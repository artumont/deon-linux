use reqwest::Client;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct WebDavFileInfo {
    pub token: String,
    pub subpath: String, // e.g., "16-05-26/" or empty
    pub filename: String,
    pub content_length: u64,
    pub last_modified: String,
    pub is_file_share: bool,
}

#[derive(Debug, Clone)]
pub struct ParsedPropItem {
    pub filename: String,
    pub is_directory: bool,
    pub content_length: u64,
    pub last_modified: String,
}

pub fn percent_decode(s: &str) -> String {
    let mut res = String::new();
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c == '%' {
            let mut hex = String::new();
            if let Some(h1) = chars.next() { hex.push(h1); }
            if let Some(h2) = chars.next() { hex.push(h2); }
            if let Ok(val) = u8::from_str_radix(&hex, 16) {
                res.push(val as char);
            } else {
                res.push('%');
                res.push_str(&hex);
            }
        } else {
            res.push(c);
        }
    }
    res
}

fn parse_date_folder(name: &str) -> Option<(u32, u32, u32)> {
    let parts: Vec<&str> = name.split('-').collect();
    if parts.len() == 3 {
        let day = parts[0].parse::<u32>().ok()?;
        let month = parts[1].parse::<u32>().ok()?;
        let year = parts[2].parse::<u32>().ok()?;
        Some((year, month, day))
    } else {
        None
    }
}

async fn query_propfind(client: &Client, url: &str, token: &str) -> Result<String, String> {
    let resp = client.request(reqwest::Method::from_bytes(b"PROPFIND").unwrap(), url)
        .header("Depth", "1")
        .basic_auth(token, Some(""))
        .send()
        .await
        .map_err(|e| format!("WebDAV PROPFIND request failed: {}", e))?;

    resp.text()
        .await
        .map_err(|e| format!("Failed to read WebDAV response: {}", e))
}

fn parse_propfind_xml(body: &str, query_path: &str) -> Vec<ParsedPropItem> {
    let mut items = Vec::new();
    let norm_query = query_path.trim_end_matches('/');

    for item in body.split("<d:response>") {
        if !item.contains("</d:response>") {
            continue;
        }

        let href = if let Some(start) = item.find("<d:href>") {
            if let Some(end) = item[start..].find("</d:href>") {
                Some(&item[start + "<d:href>".len() .. start + end])
            } else { None }
        } else { None };

        if let Some(href_str) = href {
            let decoded_href = percent_decode(href_str);
            let norm_href = decoded_href.trim_end_matches('/');

            // Skip the folder itself
            if norm_href.len() <= norm_query.len() {
                continue;
            }

            if let Some(fname) = norm_href.split('/').last() {
                if !fname.is_empty() {
                    let is_directory = item.contains("<d:collection/>") || item.contains("<collection/>");

                    let mut content_length = 0;
                    if let Some(s_start) = item.find("<d:getcontentlength>") {
                        if let Some(s_end) = item[s_start..].find("</d:getcontentlength>") {
                            let size_str = &item[s_start + "<d:getcontentlength>".len() .. s_start + s_end];
                            content_length = size_str.trim().parse::<u64>().unwrap_or(0);
                        }
                    }

                    let mut last_modified = String::new();
                    if let Some(m_start) = item.find("<d:getlastmodified>") {
                        if let Some(m_end) = item[m_start..].find("</d:getlastmodified>") {
                            last_modified = item[m_start + "<d:getlastmodified>".len() .. m_start + m_end].trim().to_string();
                        }
                    }

                    items.push(ParsedPropItem {
                        filename: fname.to_string(),
                        is_directory,
                        content_length,
                        last_modified,
                    });
                }
            }
        }
    }
    items
}

pub async fn resolve_webdav_file(download_url: &str) -> Result<WebDavFileInfo, String> {
    // 1. Get the redirect target of download_url without following redirects
    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let resp = client.get(download_url)
        .send()
        .await
        .map_err(|e| format!("Redirect request failed: {}", e))?;

    let status = resp.status();
    let location_val = if status.is_redirection() {
        resp.headers().get("location")
            .ok_or("No location header returned by redirector")?
            .to_str()
            .map_err(|_| "Invalid location header encoding")?
            .to_string()
    } else {
        return Err(format!("Expected redirect (302/303), got status: {}", status));
    };

    // Extract token from location, e.g. "https://nx87798.your-storageshare.de/s/iPXtrfqqb4YacCJ"
    let token = location_val.split("/s/")
        .nth(1)
        .ok_or_else(|| format!("Could not parse token from redirect location: {}", location_val))?
        .split('?')
        .next()
        .unwrap()
        .trim()
        .to_string();

    // 2. Perform PROPFIND on the WebDAV root endpoint
    let path_prefix = format!("/public.php/dav/files/{}/", token);
    let dav_url = format!("https://nx87798.your-storageshare.de{}", path_prefix);
    let dav_client = Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    println!("[WEBDAV DEBUG] Resolving share token: {}", token);
    let root_body = query_propfind(&dav_client, &dav_url, &token).await?;

    // Check if the root share is a directory or a file
    let is_dir_share = root_body.contains("<d:collection/>") || root_body.contains("<collection/>");
    if !is_dir_share {
        let file_dav_url = format!("https://nx87798.your-storageshare.de/public.php/dav/files/{}", token);
        let head_resp = dav_client.head(&file_dav_url)
            .basic_auth(&token, Some(""))
            .send()
            .await
            .map_err(|e| format!("HEAD request for file share failed: {}", e))?;

        let mut filename = format!("{}.deon", token); // fallback
        if let Some(cd_header) = head_resp.headers().get("content-disposition") {
            if let Ok(cd_str) = cd_header.to_str() {
                if let Some(idx) = cd_str.find("filename=\"") {
                    let sub = &cd_str[idx + "filename=\"".len()..];
                    if let Some(end_idx) = sub.find('"') {
                        filename = sub[..end_idx].to_string();
                    }
                } else if let Some(idx) = cd_str.find("filename*=") {
                    let sub = &cd_str[idx + "filename*=".len()..];
                    if let Some(utf_idx) = sub.find("UTF-8''") {
                        filename = percent_decode(sub[utf_idx + "UTF-8''".len()..].split(';').next().unwrap_or("").trim());
                    } else {
                        filename = percent_decode(sub.split(';').next().unwrap_or("").trim());
                    }
                }
            }
        }

        let mut content_length = 0;
        if let Some(s_start) = root_body.find("<d:getcontentlength>") {
            if let Some(s_end) = root_body[s_start..].find("</d:getcontentlength>") {
                let size_str = &root_body[s_start + "<d:getcontentlength>".len() .. s_start + s_end];
                content_length = size_str.trim().parse::<u64>().unwrap_or(0);
            }
        }

        let mut last_modified = String::new();
        if let Some(m_start) = root_body.find("<d:getlastmodified>") {
            if let Some(m_end) = root_body[m_start..].find("</d:getlastmodified>") {
                last_modified = root_body[m_start + "<d:getlastmodified>".len() .. m_start + m_end].trim().to_string();
            }
        }

        println!(
            "[WEBDAV DEBUG] Resolved file share: filename={}, size={}",
            filename, content_length
        );

        return Ok(WebDavFileInfo {
            token: token.clone(),
            subpath: "".to_string(),
            filename,
            content_length,
            last_modified,
            is_file_share: true,
        });
    }

    let items = parse_propfind_xml(&root_body, &path_prefix);

    // Try to find .deon file in the root directory first
    for item in &items {
        if !item.is_directory && item.filename.to_lowercase().ends_with(".deon") {
            println!("[WEBDAV DEBUG] Found .deon in root folder: {}", item.filename);
            return Ok(WebDavFileInfo {
                token: token.clone(),
                subpath: "".to_string(),
                filename: item.filename.clone(),
                content_length: item.content_length,
                last_modified: item.last_modified.clone(),
                is_file_share: false,
            });
        }
    }

    // Otherwise, collect all subfolders
    let mut subfolders = Vec::new();
    for item in &items {
        if item.is_directory {
            subfolders.push(item.filename.clone());
        }
    }

    if subfolders.is_empty() {
        return Err("No files or subfolders found in the mirror share directory.".to_string());
    }

    // Sort subfolders: if date-based (DD-MM-YY), newest date first. Otherwise alphabetical descending.
    subfolders.sort_by(|a, b| {
        let date_a = parse_date_folder(a);
        let date_b = parse_date_folder(b);
        match (date_a, date_b) {
            (Some(da), Some(db)) => db.cmp(&da), // descending (newest first)
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => b.cmp(a), // descending alphabetical
        }
    });

    println!("[WEBDAV DEBUG] Sorted subfolders for scan: {:?}", subfolders);

    // Scan each subfolder in order (newest first) to find a .deon file
    for folder in subfolders {
        let sub_prefix = format!("/public.php/dav/files/{}/{}/", token, folder);
        let sub_url = format!("https://nx87798.your-storageshare.de{}", sub_prefix.replace(' ', "%20"));
        println!("[WEBDAV DEBUG] Scanning subfolder: {}", sub_url);

        if let Ok(sub_body) = query_propfind(&dav_client, &sub_url, &token).await {
            let sub_items = parse_propfind_xml(&sub_body, &sub_prefix);
            for item in sub_items {
                if !item.is_directory && item.filename.to_lowercase().ends_with(".deon") {
                    println!(
                        "[WEBDAV DEBUG] Found .deon in subfolder '{}': {}",
                        folder, item.filename
                    );
                    return Ok(WebDavFileInfo {
                        token: token.clone(),
                        subpath: format!("{}/", folder),
                        filename: item.filename.clone(),
                        content_length: item.content_length,
                        last_modified: item.last_modified.clone(),
                        is_file_share: false,
                    });
                }
            }
        }
    }

    Err("No .deon file found in the mirror share directory (including subfolders).".to_string())
}
