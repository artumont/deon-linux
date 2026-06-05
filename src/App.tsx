import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

import type { WizardStep, PackStatus, DownloadSettings, InstallManifest } from "./types";
import { CONTENT_PACKS, getPackDownloadUrl, steam64ToHex } from "./packs";

import TitleBar from "./components/TitleBar";
import BackgroundLayer from "./components/BackgroundLayer";
import TermsOfUse from "./components/TermsOfUse";
import SetupSettings from "./components/SetupSettings";
import PackSelection from "./components/PackSelection";
import InstallerContent from "./components/InstallerContent";
import ProgressBar from "./components/ProgressBar";

function App() {
  // Wizard navigation
  const [step, setStep] = useState<WizardStep>(0);

  // Setup state
  const [installPath, setInstallPath] = useState("");
  const [steamId, setSteamId] = useState("");
  const [mirrorId, setMirrorId] = useState(1);

  // Pack selection
  const [selectedPacks, setSelectedPacks] = useState<string[]>(
    CONTENT_PACKS.filter((p) => p.required).map((p) => p.id)
  );

  // Download settings
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings>({
    concurrentDownloads: 2,
    speedLimitMbps: 0,
    tempLocation: "",
    keepFiles: false,
  });

  // Install state
  const [packStatuses, setPackStatuses] = useState<PackStatus[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Refs for tracking active variables in async loops
  const isInstallingRef = useRef(false);
  const installQueueRef = useRef<string[]>([]);
  const runnerActiveRef = useRef(false);

  // Keep isInstallingRef synchronized with state
  useEffect(() => {
    isInstallingRef.current = isInstalling;
  }, [isInstalling]);

  // Aggregate progress
  const overallProgress =
    packStatuses.length > 0
      ? Math.round(
          packStatuses.reduce((sum, s) => {
            if (s.state === "complete" || s.state === "up-to-date") return sum + 100;
            if (s.state === "error") return sum; // Error doesn't contribute
            return sum + s.progress;
          }, 0) / packStatuses.length
        )
      : 0;

  // Current active pack label
  const activePack = packStatuses.find(
    (s) => s.state === "downloading" || s.state === "extracting" || s.state === "authenticating"
  );
  const activePackName = activePack
    ? CONTENT_PACKS.find((p) => p.id === activePack.packId)?.name
    : undefined;

  // --- Persistent state loading ---
  useEffect(() => {
    const savedPath = localStorage.getItem("deon_install_path");
    const savedSteamId = localStorage.getItem("deon_steam_id");
    const savedMirrorId = localStorage.getItem("deon_mirror_id");

    if (savedPath) setInstallPath(savedPath);
    if (savedSteamId) setSteamId(savedSteamId);
    if (savedMirrorId) setMirrorId(Number(savedMirrorId));

    if (savedPath && savedSteamId) {
      // Check for manifest
      invoke<InstallManifest | null>("read_manifest", { installPath: savedPath })
        .then((manifest) => {
          if (manifest) {
            setIsUpdateMode(true);
            setStep(3);
            checkUpdates(manifest, Number(savedMirrorId) || 1);
          }
        })
        .catch((err) => {
          console.warn("Failed to read manifest on launch:", err);
        });
    }
  }, []);

  // --- Update Check logic ---
  const checkUpdates = async (manifest: InstallManifest, currentMirror: number) => {
    // Initialise statuses as up-to-date/checking
    const initialStatuses: PackStatus[] = manifest.installedPacks.map((p) => ({
      packId: p.packId,
      state: "up-to-date",
      progress: 100,
    }));
    setPackStatuses(initialStatuses);

    const updatedStatuses = [...initialStatuses];

    for (let i = 0; i < manifest.installedPacks.map((p) => p.packId).length; i++) {
      const entry = manifest.installedPacks[i];
      try {
        const downloadUrl = getPackDownloadUrl(entry.packId, currentMirror);
        const checkResult = await invoke<{ status: string; reason: string | null }>(
          "check_pack_update",
          {
            packId: entry.packId,
            downloadUrl,
            knownContentLength: entry.contentLength,
            knownLastModified: entry.lastModified,
          }
        );

        const statusIndex = updatedStatuses.findIndex((s) => s.packId === entry.packId);
        if (statusIndex !== -1) {
          updatedStatuses[statusIndex] = {
            packId: entry.packId,
            state: checkResult.status === "outdated" ? "outdated" : "up-to-date",
            progress: checkResult.status === "outdated" ? 0 : 100,
          };
          setPackStatuses([...updatedStatuses]);
        }
      } catch (err) {
        console.error("Failed update check for pack:", entry.packId, err);
      }
    }
  };

  // --- Real download progress listeners ---
  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenExtract: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        unlistenProgress = await listen<{ packId: string; percent: number }>(
          "download-progress",
          (event) => {
            const { packId, percent } = event.payload;
            setPackStatuses((prev) =>
              prev.map((s) => (s.packId === packId ? { ...s, progress: percent } : s))
            );
          }
        );

        unlistenExtract = await listen<{ packId: string; percent: number }>(
          "extract-progress",
          (event) => {
            const { packId, percent } = event.payload;
            setPackStatuses((prev) =>
              prev.map((s) => (s.packId === packId ? { ...s, progress: percent } : s))
            );
          }
        );
      } catch (err) {
        console.error("Failed to setup Tauri progress event listeners:", err);
      }
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenExtract) unlistenExtract();
    };
  }, []);

  // --- Installer Queue Runner effect ---
  useEffect(() => {
    if (!isInstalling) return;
    if (runnerActiveRef.current) return;

    // If queue is empty, populate it with all non-completed packs (for resume)
    if (installQueueRef.current.length === 0) {
      const resumePacks = packStatuses
        .filter((s) => s.state !== "complete" && s.state !== "up-to-date" && s.state !== "error")
        .map((s) => s.packId);
      installQueueRef.current = resumePacks;
    }

    if (installQueueRef.current.length === 0) {
      setIsInstalling(false);
      return;
    }

    const runQueue = async () => {
      runnerActiveRef.current = true;

      const processPack = async (packId: string) => {
        const updateStatus = (state: PackStatus["state"], progress: number, error?: string) => {
          setPackStatuses((prev) =>
            prev.map((s) => (s.packId === packId ? { ...s, state, progress, error } : s))
          );
        };

        try {
          if (!isInstallingRef.current) {
            installQueueRef.current.unshift(packId);
            updateStatus("queued", 0);
            return;
          }

          // 1. Download
          updateStatus("downloading", 0);
          const downloadUrl = getPackDownloadUrl(packId, mirrorId);
          const tempDir = downloadSettings.tempLocation || installPath;

          const downloadResult = await invoke<{
            files: Array<{
              filePath: string;
              filename: string;
              contentHash: string;
              contentLength: number;
              lastModified: string;
            }>;
            filePath: string;
            contentHash: string;
            contentLength: number;
            lastModified: string;
          }>("download_pack", {
            packId,
            downloadUrl,
            destDir: tempDir,
          });

          if (!isInstallingRef.current) {
            installQueueRef.current.unshift(packId);
            updateStatus("queued", 0);
            return;
          }

          // 2. Authenticate & Extract each file in the pack
          const steamHex = steam64ToHex(steamId);
          let fileIndex = 0;
          for (const file of downloadResult.files) {
            fileIndex++;
            updateStatus("authenticating", Math.round(((fileIndex - 0.5) / downloadResult.files.length) * 100));
            const cleanPackName = file.filename.replace(/\.deon$/i, "");
            const password = await invoke<string>("authenticate_pack", {
              packName: cleanPackName,
              steamHex,
            });

            if (!isInstallingRef.current) {
              installQueueRef.current.unshift(packId);
              updateStatus("queued", 0);
              return;
            }

            updateStatus("extracting", Math.round((fileIndex / downloadResult.files.length) * 100));
            await invoke<void>("extract_pack", {
              packId,
              filePath: file.filePath,
              destDir: installPath,
              password,
              keepFile: downloadSettings.keepFiles,
            });
          }

          // 4. Save to Manifest
          updateStatus("complete", 100);

          const currentManifest = (await invoke<InstallManifest | null>("read_manifest", {
            installPath: installPath,
          })) || {
            installPath: installPath,
            steamId: steamId,
            mirrorId: mirrorId,
            installedPacks: [],
          };

          currentManifest.installedPacks = currentManifest.installedPacks.filter(
            (p) => p.packId !== packId
          );
          currentManifest.installedPacks.push({
            packId,
            contentHash: downloadResult.contentHash,
            contentLength: downloadResult.contentLength,
            lastModified: downloadResult.lastModified,
            installedAt: new Date().toISOString(),
          });

          await invoke<void>("write_manifest", { manifest: currentManifest });
        } catch (err) {
          console.error(`Error processing pack ${packId}:`, err);
          updateStatus("error", 0, String(err));
        }
      };

      const workers = Array.from(
        { length: Math.min(installQueueRef.current.length, downloadSettings.concurrentDownloads) },
        async () => {
          while (installQueueRef.current.length > 0 && isInstallingRef.current) {
            const nextPack = installQueueRef.current.shift();
            if (nextPack) {
              await processPack(nextPack);
            }
          }
        }
      );

      await Promise.all(workers);
      runnerActiveRef.current = false;

      if (installQueueRef.current.length === 0) {
        setIsInstalling(false);
      }
    };

    runQueue();
  }, [isInstalling, installPath, steamId, mirrorId, downloadSettings]);

  // --- Real Installer Dispatcher ---
  const beginInstallation = useCallback(() => {
    // Save settings to localStorage
    localStorage.setItem("deon_install_path", installPath);
    localStorage.setItem("deon_steam_id", steamId);
    localStorage.setItem("deon_mirror_id", String(mirrorId));

    // Determine what packs to install (all selected if new install, or outdated ones if update)
    let packsToInstall = [...selectedPacks];
    if (isUpdateMode) {
      packsToInstall = packStatuses
        .filter((s) => s.state === "outdated")
        .map((s) => s.packId);
    } else {
      // ONLY install selected packs that are NOT already complete or up-to-date
      packsToInstall = packsToInstall.filter((id) => {
        const current = packStatuses.find((s) => s.packId === id);
        return !current || (current.state !== "complete" && current.state !== "up-to-date");
      });
    }

    if (packsToInstall.length === 0) {
      // Nothing new to install; just transition to step 3 showing everything is complete
      setStep(3);
      return;
    }

    // Set up status trackers for all packs being installed/updated
    const initialStatuses: PackStatus[] = CONTENT_PACKS.map((p) => {
      const isPending = packsToInstall.includes(p.id);
      const existingStatus = packStatuses.find((s) => s.packId === p.id);

      if (isPending) {
        return {
          packId: p.id,
          state: "queued" as const,
          progress: 0,
        };
      } else if (existingStatus) {
        return existingStatus;
      } else {
        return {
          packId: p.id,
          state: "queued" as const,
          progress: 0,
        };
      }
    }).filter((s) =>
      packsToInstall.includes(s.packId) ||
      packStatuses.some((ps) => ps.packId === s.packId && (ps.state === "complete" || ps.state === "up-to-date"))
    );

    setPackStatuses(initialStatuses);
    installQueueRef.current = [...packsToInstall];
    setIsInstalling(true);
    setStep(3);
  }, [
    installPath,
    steamId,
    mirrorId,
    selectedPacks,
    isUpdateMode,
    packStatuses,
  ]);

  const handleImportExisting = async (selectedPath: string): Promise<boolean> => {
    try {
      const isVerified = await invoke<boolean>("verify_installed", {
        installPath: selectedPath,
      });
      if (!isVerified) {
        alert("Delta Online executable ('deonupdater.exe') not found in this folder. Please select the correct folder.");
        return false;
      }

      // Read manifest from selected path
      const manifest = await invoke<InstallManifest | null>("read_manifest", {
        installPath: selectedPath,
      });

      if (manifest) {
        // Set state from manifest
        setInstallPath(selectedPath);
        if (manifest.steamId) {
          setSteamId(manifest.steamId);
          localStorage.setItem("deon_steam_id", manifest.steamId);
        }
        if (manifest.mirrorId) {
          setMirrorId(manifest.mirrorId);
          localStorage.setItem("deon_mirror_id", String(manifest.mirrorId));
        }
        localStorage.setItem("deon_install_path", selectedPath);

        // Update packStatuses to match manifest
        const updatedStatuses = CONTENT_PACKS.map((p) => {
          const entry = manifest.installedPacks.find((ep) => ep.packId === p.id);
          if (entry) {
            return {
              packId: p.id,
              state: "complete" as const,
              progress: 100,
            };
          }
          return {
            packId: p.id,
            state: "queued" as const,
            progress: 0,
          };
        }).filter((s) => manifest.installedPacks.some((ep) => ep.packId === s.packId));

        setPackStatuses(updatedStatuses);

        // Also add the installed packs to selectedPacks so they appear selected if modifying
        setSelectedPacks(manifest.installedPacks.map((ep) => ep.packId));

        setIsUpdateMode(true);
        // Transition to Step 3 (which renders InstallerContent showing success & Hub)
        setStep(3);
        checkUpdates(manifest, manifest.mirrorId || 1);
        return true;
      } else {
        // No manifest found, but valid directory. Just populate path and proceed to settings setup
        setInstallPath(selectedPath);
        localStorage.setItem("deon_install_path", selectedPath);
        setStep(1); // Go to Settings step
        return true;
      }
    } catch (err) {
      console.error("Failed to import existing installation:", err);
      alert("Failed to import installation: " + String(err));
      return false;
    }
  };

  const handleMarkAsInstalled = async (packId: string): Promise<void> => {
    try {
      let contentLength = 0;
      let lastModified = "";

      const downloadUrl = getPackDownloadUrl(packId, mirrorId);
      try {
        const files = await invoke<any[]>("resolve_webdav_metadata", { downloadUrl });
        if (files && files.length > 0) {
          contentLength = files.reduce((sum, f) => sum + (f.contentLength || 0), 0);
          lastModified = files.map((f) => f.lastModified || "").join(";");
        }
      } catch (err) {
        console.warn(`Failed to resolve WebDAV metadata for ${packId}, using empty metadata:`, err);
      }

      const currentManifest = (await invoke<InstallManifest | null>("read_manifest", {
        installPath: installPath,
      })) || {
        installPath: installPath,
        steamId: steamId,
        mirrorId: mirrorId,
        installedPacks: [],
      };

      currentManifest.installedPacks = currentManifest.installedPacks.filter(
        (p) => p.packId !== packId
      );
      currentManifest.installedPacks.push({
        packId,
        contentHash: "",
        contentLength,
        lastModified,
        installedAt: new Date().toISOString(),
      });

      await invoke<void>("write_manifest", { manifest: currentManifest });

      if (!selectedPacks.includes(packId)) {
        setSelectedPacks((prev) => [...prev, packId]);
      }

      setPackStatuses((prev) => {
        const statusIndex = prev.findIndex((s) => s.packId === packId);
        const newStatus = {
          packId,
          state: "up-to-date" as const,
          progress: 100,
        };
        if (statusIndex !== -1) {
          const next = [...prev];
          next[statusIndex] = newStatus;
          return next;
        } else {
          return [...prev, newStatus];
        }
      });
    } catch (err) {
      console.error("Failed to mark pack as installed:", err);
      alert("Failed to mark pack as installed: " + String(err));
      throw err;
    }
  };

  return (
    <div className="relative w-screen h-screen select-none overflow-hidden font-sans text-neutral-200 antialiased bg-[#030303]">
      <BackgroundLayer />
      <TitleBar />

      {/* Step content with transition */}
      <div className="step-content">
        {step === 0 && <TermsOfUse onAccept={() => setStep(1)} onImport={handleImportExisting} />}

        {step === 1 && (
          <SetupSettings
            installPath={installPath}
            steamId={steamId}
            onInstallPathChange={setInstallPath}
            onSteamIdChange={setSteamId}
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <PackSelection
            selectedPacks={selectedPacks}
            mirrorId={mirrorId}
            downloadSettings={downloadSettings}
            onSelectedPacksChange={setSelectedPacks}
            onMirrorIdChange={setMirrorId}
            onDownloadSettingsChange={setDownloadSettings}
            onBeginInstall={beginInstallation}
            onBack={() => setStep(1)}
            packStatuses={packStatuses}
            onMarkAsInstalled={handleMarkAsInstalled}
          />
        )}

        {step === 3 && (
          <>
            <InstallerContent
              packStatuses={packStatuses}
              isUpdateMode={isUpdateMode}
              onBackToSelection={() => {
                setIsUpdateMode(false);
                setStep(2);
              }}
              onApplyUpdates={beginInstallation}
              isInstalling={isInstalling}
            />
            <ProgressBar
              progress={overallProgress}
              isActive={isInstalling}
              currentLabel={activePackName ? `Installing ${activePackName}` : undefined}
              onTogglePause={() => setIsInstalling(!isInstalling)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
