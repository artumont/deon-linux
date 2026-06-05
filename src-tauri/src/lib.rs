pub mod models;
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::manifest::read_manifest,
            commands::manifest::write_manifest,
            commands::manifest::verify_installed,
            commands::auth::authenticate_pack,
            commands::download::download_pack,
            commands::extract::extract_pack,
            commands::update::check_pack_update,
            commands::utils::resolve_webdav_metadata,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
