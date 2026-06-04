/** Represents a content pack available for download */
export interface ContentPack {
  /** Unique identifier used in fetchfile URLs, e.g. "pack-basemap" */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description of what this pack contains */
  description: string;
  /** Whether this pack is required for the game to function */
  required: boolean;
}

/** Per-pack install/download status */
export interface PackStatus {
  packId: string;
  state:
    | "queued"
    | "downloading"
    | "authenticating"
    | "extracting"
    | "complete"
    | "error"
    | "up-to-date"
    | "outdated";
  /** Download/extract progress 0-100 */
  progress: number;
  /** Error message if state is "error" */
  error?: string;
}

/** Persisted manifest tracking installed packs */
export interface InstallManifest {
  installPath: string;
  steamId: string;
  mirrorId: number;
  installedPacks: InstalledPackEntry[];
}

export interface InstalledPackEntry {
  packId: string;
  /** SHA-256 of the downloaded .deon file */
  contentHash: string;
  /** Content-Length from the server at download time */
  contentLength: number;
  /** Last-Modified header from the server at download time */
  lastModified: string;
  /** ISO timestamp of when this pack was installed */
  installedAt: string;
}

/** Wizard step indices */
export type WizardStep = 0 | 1 | 2 | 3;

/** Download settings configured by the user */
export interface DownloadSettings {
  /** Number of concurrent downloads (1-4) */
  concurrentDownloads: number;
  /** Speed limit in MB/s, 0 = unlimited */
  speedLimitMbps: number;
  /** Custom temp directory for downloads (empty = system default) */
  tempLocation: string;
  /** Keep .deon files after extraction */
  keepFiles: boolean;
}

/** Payload emitted by the Rust backend for download progress */
export interface DownloadProgressPayload {
  packId: string;
  bytesDownloaded: number;
  totalBytes: number;
  /** 0-100 */
  percent: number;
}

/** Payload emitted by the Rust backend for extraction progress */
export interface ExtractProgressPayload {
  packId: string;
  /** 0-100 */
  percent: number;
  currentFile?: string;
}
