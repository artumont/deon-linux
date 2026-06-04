use crate::models::UpdateCheckResult;
use super::utils::resolve_webdav_file;

#[tauri::command]
pub async fn check_pack_update(
    pack_id: String,
    download_url: String,
    known_content_length: u64,
    known_last_modified: String,
) -> Result<UpdateCheckResult, String> {
    let file_info = resolve_webdav_file(&download_url).await.map_err(|e| {
        let err_res = UpdateCheckResult {
            pack_id: pack_id.clone(),
            status: "error".to_string(),
            reason: Some(format!("WebDAV resolve failed: {}", e)),
        };
        serde_json::to_string(&err_res).unwrap_or_default()
    })?;

    let server_length = file_info.content_length;
    let server_modified = file_info.last_modified;

    let length_changed = server_length > 0 && server_length != known_content_length;
    let modified_changed = !server_modified.is_empty()
        && !known_last_modified.is_empty()
        && server_modified != known_last_modified;

    if length_changed || modified_changed {
        Ok(UpdateCheckResult {
            pack_id,
            status: "outdated".to_string(),
            reason: Some(format!(
                "Server: {} bytes, modified '{}' vs local: {} bytes, modified '{}'",
                server_length, server_modified, known_content_length, known_last_modified
            )),
        })
    } else {
        Ok(UpdateCheckResult {
            pack_id,
            status: "up-to-date".to_string(),
            reason: None,
        })
    }
}
