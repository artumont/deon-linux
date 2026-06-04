# Release Notes - Version 0.1.0

This release introduces the initial release of the DEON Linux Installer, a desktop installer to manage Delta Online content packs.

## Summary of Changes

### Backend (Rust/Tauri)
- **WebDAV Share Resolution**: Implemented redirection parsing for mirror links to extract Nextcloud public share tokens.
- **Direct File & Folder Scanning**: Added support to distinguish between direct file shares (e.g. Fenix Rising) and directory shares (e.g. Forces of Nature). For directory shares, the backend automatically scans for versioned subfolders (formatted as `DD-MM-YY`), sorting them descending to download the latest available release.
- **Direct Download Streaming**: Streams map archives from storage shares via WebDAV Basic Auth (using the share token as the username and an empty password), avoiding standard HTML landing page redirects.
- **Authentication**: Added Steam3 Hex conversion from Steam64 IDs to securely fetch extraction passwords from the DEON authentication endpoint.
- **Improved Extraction Checking**: Configured `7z` to run asynchronously and verified its standard outputs against warning signatures (e.g. "Wrong password?", "Can not open the file as archive") to prevent silent extraction failures.

### Frontend (React/TypeScript)
- **Settings Screen**: Added installation path input and Steam profile fetching screen.
- **Dynamic Pack Selector**: Scans the mirrors and fetches available packs dynamically, offering users control over which content packs to download.
- **Dropdown Theming Fixes**: Implemented native GTK dark-theme overrides (`color-scheme: dark`) to prevent rendering glitches of dropdown boxes on Linux.
- **Step-by-Step UI Flow**: Split application screens into dedicated components (Terms of Use, SetupSettings, PackSelection, InstallerContent, ProgressBar).
- **Navigation Controls**: Added "Modify Pack Selection" controls to allow users to download and manage additional packs after completion without repeating existing downloads.

## Packaging
- Bundle contains standard Debian (`.deb`) package binaries and `AppImage` files.
