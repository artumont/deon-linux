use std::path::{Path, PathBuf};
use crate::models::InstallManifest;

fn manifest_path(install_path: &str) -> PathBuf {
    Path::new(install_path).join("deon_manifest.json")
}

#[tauri::command]
pub async fn read_manifest(install_path: String) -> Result<Option<InstallManifest>, String> {
    let path = manifest_path(&install_path);
    if !path.exists() {
        return Ok(None);
    }
    let data = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read manifest: {}", e))?;
    let manifest: InstallManifest =
        serde_json::from_str(&data).map_err(|e| format!("Failed to parse manifest: {}", e))?;
    Ok(Some(manifest))
}

#[tauri::command]
pub async fn write_manifest(manifest: InstallManifest) -> Result<(), String> {
    let path = manifest_path(&manifest.install_path);
    // Ensure directory exists
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    let data =
        serde_json::to_string_pretty(&manifest).map_err(|e| format!("Serialize error: {}", e))?;
    tokio::fs::write(&path, data)
        .await
        .map_err(|e| format!("Failed to write manifest: {}", e))?;
    Ok(())
}

fn find_file_recursive(dir: &Path, filename: &str, depth: usize) -> bool {
    if depth > 4 {
        return false;
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if find_file_recursive(&path, filename, depth + 1) {
                    return true;
                }
            } else if let Some(name) = path.file_name() {
                if name == filename {
                    return true;
                }
            }
        }
    }
    false
}

#[tauri::command]
pub async fn verify_installed(install_path: String) -> Result<bool, String> {
    let base_path = Path::new(&install_path);
    if !base_path.exists() {
        return Ok(false);
    }

    if base_path.join("deonupdater.exe").exists() {
        return Ok(true);
    }
    
    let found = find_file_recursive(base_path, "deonupdater.exe", 0);
    Ok(found)
}
