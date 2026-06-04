# DEON Linux Installer

A desktop installer designed to download, authenticate, and extract Delta Online (DEON) content packs (including map packs, DLCs, and campaigns) on Linux systems.


> #### Made with the help of Antigravity. Contributions are welcome.

## System Requirements

The application requires `7z` (provided by `p7zip`) to extract the downloaded `.deon` zip archives. Ensure it is installed on your system:

- **Ubuntu / Debian**:
  ```bash
  sudo apt update && sudo apt install p7zip-full
  ```
- **Arch Linux**:
  ```bash
  sudo pacman -S p7zip
  ```
- **Fedora**:
  ```bash
  sudo dnf install p7zip p7zip-plugins
  ```


## How It Works

1. **Pack Selection**: Dynamically scans server mirrors, displays available content packs, and allows selecting custom items.
2. **Automated Installation**: Downloads packages from public mirror shares, requests passwords securely from the auth backend, and unpacks files into the configured directory.


## Architecture Details

For developers looking to inspect or modify the application:

### Frontend (React/TypeScript)

- **Application Controller (`src/App.tsx`)**: Manages UI state steps and overall installation progress.
- **Queue Engine**: Processes concurrent or sequential installation tasks using a synchronized React loop with status checking.
- **GTK Dark Mode Override (`src/App.css`)**: Native dropdowns are themed using `color-scheme: dark` to prevent GTK rendering bugs under WebKit on Linux.

### Backend (Rust/Tauri Commands)

- **`auth.rs`**: Converts Steam64 IDs to Steam3 hex format to retrieve package passwords from the DEON authentication server.
- **`download.rs`**: Connects to Hetzner Storage Shares using WebDAV Basic Auth, streams the files directly, and provides real-time progress callbacks.
- **`extract.rs`**: Spawns asynchronous `7z` extraction processes and parses output logs to ensure files are successfully placed.
- **`utils.rs`**: Handles Nextcloud public shares:
  - **Direct File Shares**: Performs `HEAD` requests to extract file metadata and filenames from headers.
  - **Directory Shares**: Performs `PROPFIND` queries to scan subfolders, parsing date-named version folders (`DD-MM-YY`) in descending order to fetch the newest release.


## Build and Development

### Install Node Dependencies
```bash
pnpm install
```

### Run in Development Mode
```bash
pnpm tauri dev
```

### Build Production Release
```bash
pnpm tauri build
```
