import { useState } from "react";
import { CONTENT_PACKS } from "../packs";
import type { PackStatus } from "../types";

interface InstallerContentProps {
  packStatuses: PackStatus[];
  isUpdateMode: boolean;
  onBackToSelection: () => void;
  onApplyUpdates?: () => void;
  isInstalling?: boolean;
}

function InstallerContent({
  packStatuses,
  isUpdateMode,
  onBackToSelection,
  onApplyUpdates,
  isInstalling = false,
}: InstallerContentProps) {
  const [activeFix, setActiveFix] = useState<string | null>(null);

  const allComplete = packStatuses.length > 0 && packStatuses.every(
    (s) => s.state === "complete" || s.state === "up-to-date"
  );

  const getStatusIcon = (state: PackStatus["state"]) => {
    switch (state) {
      case "complete":
      case "up-to-date":
        return (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        );
      case "downloading":
      case "authenticating":
      case "extracting":
        return (
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
        );
      case "error":
        return (
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
        );
      case "outdated":
        return (
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
        );
      default:
        return (
          <span className="w-2 h-2 rounded-full bg-neutral-700 shrink-0" />
        );
    }
  };

  const getStatusLabel = (status: PackStatus): string => {
    switch (status.state) {
      case "queued":
        return "Queued";
      case "downloading":
        return `Downloading ${status.progress}%`;
      case "authenticating":
        return "Authenticating...";
      case "extracting":
        return `Extracting ${status.progress}%`;
      case "complete":
        return "Installed";
      case "error":
        return status.error || "Error";
      case "up-to-date":
        return "Up to date";
      case "outdated":
        return "Update available";
      default:
        return "";
    }
  };

  const toggleFix = (fixId: string) => {
    setActiveFix((prev) => (prev === fixId ? null : fixId));
  };

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-6 md:px-12 py-6 md:py-8 overflow-y-auto">
      <div className={`w-full transition-all duration-500 ease-in-out flex flex-col ${allComplete ? "max-w-[960px]" : "max-w-[620px]"}`}>
        
        {/* Title & Header */}
        <div className="mb-6">
          <h1 className="font-display text-xl md:text-2xl font-black tracking-wider text-white drop-shadow-md mb-1">
            {isUpdateMode
              ? allComplete
                ? "ALL UP TO DATE"
                : "UPDATE CHECK"
              : allComplete
                ? "INSTALLATION COMPLETE"
                : "INSTALLING"
            }
          </h1>
          <p className="text-[10px] md:text-xs text-neutral-500 font-display tracking-widest uppercase">
            {isUpdateMode
              ? allComplete
                ? "All content packs are current"
                : "Checking installed packs for updates"
              : allComplete
                ? "All selected packs have been installed successfully"
                : "Downloading and extracting content packs"
            }
          </p>
        </div>

        {/* Layout Grid (two columns if complete, single column if installing) */}
        <div className={`grid grid-cols-1 gap-6 w-full ${allComplete ? "md:grid-cols-12" : ""}`}>
          
          {/* Left Column: Pack Statuses */}
          <div className={`${allComplete ? "md:col-span-5" : "w-full"} flex flex-col justify-between`}>
            <div>
              <h3 className="text-[10px] text-neutral-400 font-display tracking-widest uppercase mb-3 font-bold">
                Installed Components
              </h3>
              <div className="overflow-y-auto max-h-[280px] space-y-1.5 pr-1 no-scrollbar mb-6">
                {packStatuses.map((status) => {
                  const pack = CONTENT_PACKS.find((p) => p.id === status.packId);
                  if (!pack) return null;

                  const isActive = status.state === "downloading" || status.state === "extracting" || status.state === "authenticating";

                  return (
                    <div
                      key={status.packId}
                      className={`flex items-center justify-between px-4 py-2.5 rounded border transition-all duration-300
                        ${isActive
                          ? "bg-neutral-900/80 border-red-900/40"
                          : status.state === "complete" || status.state === "up-to-date"
                            ? "bg-neutral-950/40 border-neutral-800/30"
                            : status.state === "error"
                              ? "bg-neutral-950/40 border-amber-900/40"
                              : status.state === "outdated"
                                ? "bg-neutral-950/40 border-amber-800/30"
                                : "bg-neutral-950/30 border-neutral-800/20"
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {getStatusIcon(status.state)}
                        <div className="min-w-0">
                          <span className="font-display text-xs font-bold tracking-wider text-neutral-200 uppercase truncate block">
                            {pack.name}
                          </span>
                          <span className={`text-[10px] font-display tracking-wider uppercase
                            ${status.state === "error"
                              ? "text-amber-500"
                              : status.state === "outdated"
                                ? "text-amber-600"
                                : status.state === "complete" || status.state === "up-to-date"
                                  ? "text-emerald-600"
                                  : isActive
                                    ? "text-red-500"
                                    : "text-neutral-600"
                            }
                          `}>
                            {getStatusLabel(status)}
                          </span>
                        </div>
                      </div>

                      {/* Per-pack progress bar */}
                      {isActive && (
                        <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden shrink-0 ml-3">
                          <div
                            className="h-full bg-red-700 transition-all duration-300 ease-out"
                            style={{ width: `${status.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {allComplete && (
              <div className="mt-2">
                <button
                  onClick={onBackToSelection}
                  className="w-full px-5 py-2.5 bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-900 hover:border-red-900/50 transition-all duration-200 font-display font-bold tracking-widest text-[10px] rounded uppercase shadow-md"
                >
                  Modify Pack Selection
                </button>
              </div>
            )}

            {packStatuses.some((s) => s.state === "outdated") && !isInstalling && onApplyUpdates && (
              <div className="mt-4 space-y-2 animate-fade-in">
                <button
                  onClick={onApplyUpdates}
                  className="w-full px-5 py-2.5 bg-red-900 border border-red-800 text-white hover:bg-red-700 hover:border-red-600 transition-all duration-200 font-display font-bold tracking-widest text-[10px] rounded uppercase shadow-md"
                >
                  Apply Updates
                </button>
                <button
                  onClick={onBackToSelection}
                  className="w-full px-5 py-2.5 bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-900 hover:border-red-900/50 transition-all duration-200 font-display font-bold tracking-widest text-[10px] rounded uppercase"
                >
                  Modify Pack Selection
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Steam Deck & Linux Optimization Hub */}
          {allComplete && (
            <div className="md:col-span-7 flex flex-col border border-neutral-850/60 bg-neutral-950/20 rounded p-4">
              <h3 className="text-[10px] text-neutral-400 font-display tracking-widest uppercase mb-3 font-bold">
                Steam Deck & Linux Optimization Hub
              </h3>
              
              <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 no-scrollbar">
                
                {/* 1. Spacewar Link */}
                <div className="border border-neutral-850/65 bg-neutral-950/40 rounded overflow-hidden">
                  <button
                    onClick={() => toggleFix("spacewar")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
                  >
                    <span className="font-display text-xs font-semibold text-neutral-200 tracking-wide uppercase">
                      1. Steam invites & sleep mode fix (Spacewar)
                    </span>
                    <span className="text-xs text-neutral-500">
                      {activeFix === "spacewar" ? "Close" : "Expand"}
                    </span>
                  </button>
                  {activeFix === "spacewar" && (
                    <div className="px-4 pb-4 border-t border-neutral-900/60 pt-3 text-xs text-neutral-400 leading-relaxed space-y-3">
                      <p>
                        Delta Online utilizes Valve's **Spacewar** tool to link into the native Steam API.
                        Installing Spacewar directly onto your device prevents game closure when putting the Steam Deck to sleep.
                      </p>
                      <div className="flex items-center space-x-3 pt-1">
                        <a
                          href="steam://install/480"
                          className="px-3 py-1.5 bg-red-900/30 border border-red-900/60 hover:bg-red-900/50 text-red-200 font-display font-semibold text-[10px] tracking-wider rounded uppercase transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Install Spacewar (Steam)
                        </a>
                        <a
                          href="https://steamdb.info/app/480/info/"
                          className="text-[10px] text-neutral-500 hover:text-neutral-300 underline font-display tracking-wider uppercase"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View App Info
                        </a>
                      </div>
                      <p className="text-[10px] text-neutral-500 bg-neutral-950/50 p-2 rounded border border-neutral-900/80">
                        <strong>Controller Layout:</strong> In Steam controller settings for Spacewar, apply the <strong>"Gamepad with Joystick Trackpad"</strong> template layout to map controller inputs correctly.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. ProtonTricks DirectX Audio Fix */}
                <div className="border border-neutral-850/65 bg-neutral-950/40 rounded overflow-hidden">
                  <button
                    onClick={() => toggleFix("audio")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
                  >
                    <span className="font-display text-xs font-semibold text-neutral-200 tracking-wide uppercase">
                      2. Fix Broken Game Audio (ProtonTricks)
                    </span>
                    <span className="text-xs text-neutral-500">
                      {activeFix === "audio" ? "Close" : "Expand"}
                    </span>
                  </button>
                  {activeFix === "audio" && (
                    <div className="px-4 pb-4 border-t border-neutral-900/60 pt-3 text-xs text-neutral-400 leading-relaxed space-y-2">
                      <p>
                        Broken or missing game audio on Linux/Proton is typically caused by a missing DirectX dependency. You can install it using ProtonTricks:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1.5 pt-1 text-[11px]">
                        <li>Launch **ProtonTricks** (available in your distro package manager or the Discover software center).</li>
                        <li>Select **deonupdater.exe** (or your custom Non-Steam shortcut) from the application selection list.</li>
                        <li>Choose **"Select the default wineprefix"** and click OK.</li>
                        <li>Select **"Install a Windows DLL or component"**.</li>
                        <li>Scroll down, check the box for **"xact_x64"**, and click OK.</li>
                        <li>Follow the winetricks popup installer prompts until completion, then exit.</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* 3. Non-Steam Game Setup */}
                <div className="border border-neutral-850/65 bg-neutral-950/40 rounded overflow-hidden">
                  <button
                    onClick={() => toggleFix("nonsteam")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
                  >
                    <span className="font-display text-xs font-semibold text-neutral-200 tracking-wide uppercase">
                      3. Adding to Steam Library
                    </span>
                    <span className="text-xs text-neutral-500">
                      {activeFix === "nonsteam" ? "Close" : "Expand"}
                    </span>
                  </button>
                  {activeFix === "nonsteam" && (
                    <div className="px-4 pb-4 border-t border-neutral-900/60 pt-3 text-xs text-neutral-400 leading-relaxed space-y-2">
                      <p>
                        To launch Delta Online on your Steam Deck or Linux client:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                        <li>Open the desktop Steam client.</li>
                        <li>Click **Games** in the top menu &rarr; **Add a Non-Steam Game to My Library...**</li>
                        <li>Browse and select **deonupdater.exe** from your game directory folder.</li>
                        <li>Right-click the newly added shortcut in your library, select **Properties**, go to **Compatibility**, and force use of **Proton Experimental** or **Proton Hotfix**.</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* 4. Save Sync */}
                <div className="border border-neutral-850/65 bg-neutral-950/40 rounded overflow-hidden">
                  <button
                    onClick={() => toggleFix("savesync")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
                  >
                    <span className="font-display text-xs font-semibold text-neutral-200 tracking-wide uppercase">
                      4. Save Game Synchronization
                    </span>
                    <span className="text-xs text-neutral-500">
                      {activeFix === "savesync" ? "Close" : "Expand"}
                    </span>
                  </button>
                  {activeFix === "savesync" && (
                    <div className="px-4 pb-4 border-t border-neutral-900/60 pt-3 text-xs text-neutral-400 leading-relaxed space-y-2">
                      <p>
                        Keep your progress in sync between your Windows PC and Linux device using **Syncthing**:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                        <li>Install **Syncthing** on both devices.</li>
                        <li>On Windows, share the folder: <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-350">Documents\My Games\Delta Online</code>.</li>
                        <li>On Steam Deck/Linux, set the path to your Proton prefix game save directory. 
                          <em> Tip: In ProtonTricks, choose "Browse Files", then navigate to:</em>
                          <br />
                          <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-350 block mt-1 break-all">
                            drive_c/users/steamuser/documents/My Games/Delta Online
                          </code>
                        </li>
                        <li>Mark the Steam Deck/Linux side as <strong>"Receive Only"</strong> to safeguard against unintentional source file deletions.</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* 5. Recommended Graphics Settings */}
                <div className="border border-neutral-850/65 bg-neutral-950/40 rounded overflow-hidden">
                  <button
                    onClick={() => toggleFix("settings")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
                  >
                    <span className="font-display text-xs font-semibold text-neutral-200 tracking-wide uppercase">
                      5. Recommended Steam Deck Settings
                    </span>
                    <span className="text-xs text-neutral-500">
                      {activeFix === "settings" ? "Close" : "Expand"}
                    </span>
                  </button>
                  {activeFix === "settings" && (
                    <div className="px-4 pb-4 border-t border-neutral-900/60 pt-3 text-xs text-neutral-450 leading-relaxed space-y-2">
                      <p>
                        To target a stable 60 FPS experience on Steam Deck models (especially on heavier Gears 4/5 ports and Horde maps):
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px]">
                        <li><strong>Steam Deck Quick Access Menu:</strong> Lock display refresh rate to 60Hz.</li>
                        <li><strong>In-game Display Mode:</strong> Borderless</li>
                        <li><strong>Texture Quality:</strong> High</li>
                        <li><strong>Shadow Quality:</strong> Medium</li>
                        <li><strong>World Quality:</strong> Medium</li>
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export default InstallerContent;
