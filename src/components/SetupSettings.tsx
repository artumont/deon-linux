import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SetupSettingsProps {
  installPath: string;
  steamId: string;
  onInstallPathChange: (path: string) => void;
  onSteamIdChange: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

function SetupSettings({
  installPath,
  steamId,
  onInstallPathChange,
  onSteamIdChange,
  onContinue,
  onBack,
}: SetupSettingsProps) {
  const [pathError, setPathError] = useState("");
  const [steamError, setSteamError] = useState("");

  const validateAndContinue = async () => {
    let valid = true;

    if (!installPath.trim()) {
      setPathError("Installation path is required.");
      valid = false;
    } else {
      setPathError("");
    }

    // Basic Steam64 ID validation: must be a 17-digit number starting with 7656
    const steamTrimmed = steamId.trim();
    if (!steamTrimmed) {
      setSteamError("Steam64 ID is required for content authentication.");
      valid = false;
    } else if (!/^7656\d{13}$/.test(steamTrimmed)) {
      setSteamError("Invalid Steam64 ID. Must be a 17-digit number starting with 7656.");
      valid = false;
    } else {
      setSteamError("");
    }

    if (!valid) return;

    // Verify folder contains deonupdater.exe
    try {
      const isVerified = await invoke<boolean>("verify_installed", {
        installPath: installPath.trim(),
      });
      if (!isVerified) {
        setPathError("Delta Online executable ('deonupdater.exe') not found in this folder. Please select the correct folder.");
        return;
      }
    } catch (err) {
      console.warn("Failed to verify folder via Tauri:", err);
      // In browser/dev non-tauri mode, allow bypass with warning
      if (window.navigator.userAgent.includes("Chrome") && !(window as any).__TAURI_INTERNALS__) {
        console.warn("Allowing bypass in browser environment.");
      } else {
        setPathError("Failed to access folder or run verification.");
        return;
      }
    }

    onContinue();
  };

  const handleBrowse = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Game Installation Folder",
      });
      if (selected) {
        onInstallPathChange(selected as string);
        setPathError("");
      }
    } catch {
      // Fallback: dialog plugin not available (browser dev mode)
      console.warn("Folder picker not available outside Tauri.");
    }
  };

  return (
    <main className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-60px)] px-6 md:px-16">
      <div className="w-full max-w-[580px] flex flex-col">
        <h1 className="font-display text-xl md:text-2xl font-black tracking-wider text-white drop-shadow-md mb-1">
          SETUP
        </h1>
        <p className="text-[10px] md:text-xs text-neutral-500 font-display tracking-widest uppercase mb-6">
          Configure your installation
        </p>

        <div className="space-y-6">
          {/* Installation Path */}
          <div className="space-y-2">
            <label className="text-neutral-400 font-semibold tracking-wide uppercase text-xs font-display">
              Game Installation Folder
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={installPath}
                onChange={(e) => {
                  onInstallPathChange(e.target.value);
                  if (e.target.value.trim()) setPathError("");
                }}
                placeholder="/home/user/Games/DeltaOnline"
                className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-neutral-300 font-mono text-xs rounded focus:outline-none focus:border-red-800 transition-colors"
              />
              <button
                onClick={handleBrowse}
                className="px-3 py-2 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors duration-150 font-display font-semibold tracking-wider text-xs border border-neutral-700 rounded uppercase"
              >
                Browse
              </button>
            </div>
            {pathError && (
              <p className="text-red-500 text-[10px] font-display tracking-wide">{pathError}</p>
            )}
            <p className="text-neutral-600 text-[10px]">
              Content packs will be extracted to this directory.
            </p>
          </div>

          {/* Steam64 ID */}
          <div className="space-y-2">
            <label className="text-neutral-400 font-semibold tracking-wide uppercase text-xs font-display">
              Steam64 ID
            </label>
            <input
              type="text"
              value={steamId}
              onChange={(e) => {
                onSteamIdChange(e.target.value);
                if (e.target.value.trim()) setSteamError("");
              }}
              placeholder="76561198012345678"
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-neutral-300 font-mono text-xs rounded focus:outline-none focus:border-red-800 transition-colors"
            />
            {steamError && (
              <p className="text-red-500 text-[10px] font-display tracking-wide">{steamError}</p>
            )}
            <p className="text-neutral-600 text-[10px]">
              Required for content authentication. Find yours at{" "}
              <a
                href="https://steamid.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-700 hover:text-red-500 underline underline-offset-2 transition-colors"
              >
                steamid.io
              </a>
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={onBack}
            className="px-4 py-2 text-neutral-500 hover:text-white font-display font-semibold tracking-widest text-xs uppercase transition-colors duration-150"
          >
            ← BACK
          </button>
          <button
            onClick={validateAndContinue}
            className="px-6 py-2 bg-red-800 text-white hover:bg-red-700 transition-colors duration-150 font-display font-bold tracking-widest text-xs uppercase border border-red-700 rounded shadow-md"
          >
            CONTINUE →
          </button>
        </div>
      </div>
    </main>
  );
}

export default SetupSettings;
