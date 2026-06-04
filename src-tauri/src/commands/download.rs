use futures_util::StreamExt;
use reqwest::Client;
use sha2::{Digest, Sha256};
use std::path::Path;
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;
use crate::models::{DownloadProgress, DownloadResult};
use super::utils::resolve_webdav_file;

#[tauri::command]
pub async fn download_pack(
    app: AppHandle,
    pack_id: String,
    download_url: String,
    dest_dir: String,
) -> Result<DownloadResult, String> {
    // 1. Resolve redirect and WebDAV info from the share URL
    let file_info = resolve_webdav_file(&download_url).await?;

    // 2. Build direct WebDAV download link with Basic Auth
    // Use the token as the username and empty password
    let direct_dl_url = format!(
        "https://nx87798.your-storageshare.de/public.php/dav/files/{}/{}{}",
        file_info.token,
        file_info.subpath.replace(' ', "%20"),
        file_info.filename.replace(' ', "%20")
    );

    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let resp = client
        .get(&direct_dl_url)
        .basic_auth(&file_info.token, Some(""))
        .send()
        .await
        .map_err(|e| format!("Direct download request failed: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        return Err(format!("Download failed with status: {}", status));
    }

    let total_bytes = file_info.content_length;

    // Ensure dest directory exists
    let dest_path = Path::new(&dest_dir);
    tokio::fs::create_dir_all(dest_path)
        .await
        .map_err(|e| format!("Failed to create download dir: {}", e))?;

    let file_path = dest_path.join(&file_info.filename);
    let mut file = tokio::fs::File::create(&file_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut stream = resp.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut hasher = Sha256::new();
    let mut last_emitted_percent: u32 = 0;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Download stream error: {}", e))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Write error: {}", e))?;
        hasher.update(&chunk);
        downloaded += chunk.len() as u64;

        let percent = if total_bytes > 0 {
            ((downloaded as f64 / total_bytes as f64) * 100.0) as u32
        } else {
            0
        };

        // Only emit progress every 1% to avoid flooding
        if percent > last_emitted_percent {
            last_emitted_percent = percent;
            let _ = app.emit(
                "download-progress",
                DownloadProgress {
                    pack_id: pack_id.clone(),
                    bytes_downloaded: downloaded,
                    total_bytes,
                    percent,
                },
            );
        }
    }

    file.flush()
        .await
        .map_err(|e| format!("Flush error: {}", e))?;

    let hash = format!("{:x}", hasher.finalize());

    Ok(DownloadResult {
        file_path: file_path.to_string_lossy().to_string(),
        content_hash: hash,
        content_length: downloaded,
        last_modified: file_info.last_modified,
    })
}
