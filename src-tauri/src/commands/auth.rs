use reqwest::Client;

#[tauri::command]
pub async fn authenticate_pack(pack_name: String, steam_hex: String) -> Result<String, String> {
    let url = format!(
        "https://getdeltaonline.net/deong3/backend/deonauthenticate.php\
         ?BuildID=m3-ascension-public\
         &ActionToPerform=FileReq\
         &FileName={}\
         &SteamID={}",
        pack_name, steam_hex
    );

    let client = Client::builder()
        .danger_accept_invalid_certs(true) // mirrors the `-k` flag from the reference script
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Auth request failed: {}", e))?;

    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read auth response: {}", e))?;

    if let Some(idx) = body.find("auth_success:") {
        let password = body[idx + "auth_success:".len()..]
            .split('<')
            .next()
            .unwrap_or("")
            .trim()
            .to_string();
        Ok(password)
    } else {
        Err(format!("Authentication failed. Response: {}", body))
    }
}
