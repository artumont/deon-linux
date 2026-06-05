use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledPackEntry {
    pub pack_id: String,
    pub content_hash: String,
    pub content_length: u64,
    pub last_modified: String,
    pub installed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallManifest {
    pub install_path: String,
    pub steam_id: String,
    pub mirror_id: u32,
    pub installed_packs: Vec<InstalledPackEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub pack_id: String,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub percent: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractProgress {
    pub pack_id: String,
    pub percent: u32,
    pub current_file: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub pack_id: String,
    pub status: String, // "up-to-date", "outdated", "error"
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadedFile {
    pub file_path: String,
    pub filename: String,
    pub content_hash: String,
    pub content_length: u64,
    pub last_modified: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResult {
    pub files: Vec<DownloadedFile>,
    pub file_path: String,
    pub content_hash: String,
    pub content_length: u64,
    pub last_modified: String,
}
