use tauri::{AppHandle, Emitter};
use crate::models::ExtractProgress;
use std::path::Path;

#[tauri::command]
pub async fn extract_pack(
    app: AppHandle,
    pack_id: String,
    file_path: String,
    dest_dir: String,
    password: String,
    keep_file: bool,
) -> Result<(), String> {
    let _ = app.emit(
        "extract-progress",
        ExtractProgress {
            pack_id: pack_id.clone(),
            percent: 0,
            current_file: None,
        },
    );

    // Debug file info
    let file_path_obj = Path::new(&file_path);
    let file_size = match tokio::fs::metadata(file_path_obj).await {
        Ok(m) => m.len(),
        Err(e) => return Err(format!("Failed to read archive file metadata: {}", e)),
    };

    println!("[EXTRACT DEBUG] Starting extraction for pack: {}", pack_id);
    println!("[EXTRACT DEBUG] Archive path: {}", file_path);
    println!("[EXTRACT DEBUG] Archive size: {} bytes", file_size);
    println!("[EXTRACT DEBUG] Destination: {}", dest_dir);
    println!("[EXTRACT DEBUG] Password length: {}", password.len());

    let mut cmd = tokio::process::Command::new("7z");
    cmd.arg("x")
        .arg(&file_path)
        .arg(format!("-o{}", dest_dir))
        .arg("-y");

    if !password.is_empty() {
        cmd.arg(format!("-p{}", password));
    } else {
        cmd.arg("-p"); // prevents interactive password prompt
    }

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to run 7z: {}. Is p7zip installed?", e))?;

    let stdout_str = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();

    println!("[EXTRACT DEBUG] 7z exit status: {:?}", output.status);
    println!("[EXTRACT DEBUG] 7z stdout:\n{}", stdout_str);
    println!("[EXTRACT DEBUG] 7z stderr:\n{}", stderr_str);

    let _ = app.emit(
        "extract-progress",
        ExtractProgress {
            pack_id: pack_id.clone(),
            percent: 100,
            current_file: None,
        },
    );

    if !output.status.success()
        || stdout_str.contains("Wrong password?")
        || stdout_str.contains("Can not open the file as archive")
        || stderr_str.contains("Wrong password?")
        || stderr_str.contains("Can not open the file as archive")
    {
        return Err(format!(
            "7z extraction failed.\nExit code: {:?}\nStdout: {}\nStderr: {}",
            output.status.code(),
            stdout_str,
            stderr_str
        ));
    }

    // Clean up the downloaded file unless user wants to keep it
    if !keep_file {
        println!("[EXTRACT DEBUG] Deleting temporary archive: {}", file_path);
        let _ = tokio::fs::remove_file(&file_path).await;
    }

    Ok(())
}
