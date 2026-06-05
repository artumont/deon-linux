use futures_util::StreamExt;
use reqwest::Client;
use sha2::{Digest, Sha256};
use std::path::Path;
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;
use crate::models::{DownloadedFile, DownloadProgress, DownloadResult};
use super::utils::resolve_webdav_file;

#[tauri::command]
pub async fn download_pack(
    app: AppHandle,
    pack_id: String,
    download_url: String,
    dest_dir: String,
) -> Result<DownloadResult, String> {
    // 1. Resolve redirect and WebDAV info from the share URL
    let files = resolve_webdav_file(&download_url).await?;

    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    // Ensure dest directory exists
    let dest_path = Path::new(&dest_dir);
    tokio::fs::create_dir_all(dest_path)
        .await
        .map_err(|e| format!("Failed to create download dir: {}", e))?;

    let total_bytes: u64 = files.iter().map(|f| f.content_length).sum();
    let mut downloaded_files = Vec::new();
    let mut total_downloaded: u64 = 0;
    let mut last_emitted_percent: u32 = 0;

    for file_info in &files {
        // 2. Build direct WebDAV download link with Basic Auth
        // Use the token as the username and empty password
        let direct_dl_url = if file_info.is_file_share {
            format!(
                "https://nx87798.your-storageshare.de/public.php/dav/files/{}",
                file_info.token
            )
        } else {
            format!(
                "https://nx87798.your-storageshare.de/public.php/dav/files/{}/{}{}",
                file_info.token,
                file_info.subpath.replace(' ', "%20"),
                file_info.filename.replace(' ', "%20")
            )
        };

        let resp = client
            .get(&direct_dl_url)
            .basic_auth(&file_info.token, Some(""))
            .send()
            .await
            .map_err(|e| format!("Direct download request failed for {}: {}", file_info.filename, e))?;

        let status = resp.status();
        if !status.is_success() {
            return Err(format!("Download failed for {} with status: {}", file_info.filename, status));
        }

        let file_path = dest_path.join(&file_info.filename);
        let mut file = tokio::fs::File::create(&file_path)
            .await
            .map_err(|e| format!("Failed to create file {}: {}", file_info.filename, e))?;

        let mut stream = resp.bytes_stream();
        let mut file_downloaded: u64 = 0;
        let mut hasher = Sha256::new();

        while let Some(chunk_result) = stream.next().await {
            let chunk = chunk_result.map_err(|e| format!("Download stream error: {}", e))?;
            file.write_all(&chunk)
                .await
                .map_err(|e| format!("Write error: {}", e))?;
            hasher.update(&chunk);
            file_downloaded += chunk.len() as u64;
            total_downloaded += chunk.len() as u64;

            let percent = if total_bytes > 0 {
                ((total_downloaded as f64 / total_bytes as f64) * 100.0) as u32
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
                        bytes_downloaded: total_downloaded,
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

        downloaded_files.push(DownloadedFile {
            file_path: file_path.to_string_lossy().to_string(),
            filename: file_info.filename.clone(),
            content_hash: hash,
            content_length: file_downloaded,
            last_modified: file_info.last_modified.clone(),
        });
    }

    let agg_file_paths: Vec<String> = downloaded_files.iter().map(|f| f.file_path.clone()).collect();
    let agg_hashes: Vec<String> = downloaded_files.iter().map(|f| f.content_hash.clone()).collect();
    let agg_modified: Vec<String> = downloaded_files.iter().map(|f| f.last_modified.clone()).collect();

    Ok(DownloadResult {
        file_path: agg_file_paths.join(";"),
        content_hash: agg_hashes.join(";"),
        content_length: total_downloaded,
        last_modified: agg_modified.join(";"),
        files: downloaded_files,
    })
}
