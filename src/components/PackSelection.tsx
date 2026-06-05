import { useState } from "react";
import { CONTENT_PACKS } from "../packs";
import type { ContentPack, DownloadSettings, PackStatus } from "../types";

interface PackSelectionProps {
  selectedPacks: string[];
  mirrorId: number;
  downloadSettings: DownloadSettings;
  onSelectedPacksChange: (packs: string[]) => void;
  onMirrorIdChange: (id: number) => void;
  onDownloadSettingsChange: (settings: DownloadSettings) => void;
  onBeginInstall: () => void;
  onBack: () => void;
  packStatuses: PackStatus[];
  onMarkAsInstalled: (packId: string) => Promise<void>;
}

function PackSelection({
  selectedPacks,
  mirrorId,
  downloadSettings,
  onSelectedPacksChange,
  onMirrorIdChange,
  onDownloadSettingsChange,
  onBeginInstall,
  onBack,
  packStatuses,
  onMarkAsInstalled,
}: PackSelectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [markingPackId, setMarkingPackId] = useState<string | null>(null);

  const togglePack = (packId: string, required: boolean) => {
    if (required) return; // Can't deselect required packs
    if (selectedPacks.includes(packId)) {
      onSelectedPacksChange(selectedPacks.filter((p) => p !== packId));
    } else {
      onSelectedPacksChange([...selectedPacks, packId]);
    }
  };

  const selectAll = () => {
    onSelectedPacksChange(CONTENT_PACKS.map((p) => p.id));
  };

  const selectRequired = () => {
    onSelectedPacksChange(CONTENT_PACKS.filter((p) => p.required).map((p) => p.id));
  };

  const updateSetting = <K extends keyof DownloadSettings>(
    key: K,
    value: DownloadSettings[K]
  ) => {
    onDownloadSettingsChange({ ...downloadSettings, [key]: value });
  };

  return (
    <main className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-60px)] px-6 md:px-16">
      <div className="w-full max-w-[640px] flex flex-col">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-black tracking-wider text-white drop-shadow-md mb-1">
              CONTENT PACKS
            </h1>
            <p className="text-[10px] md:text-xs text-neutral-500 font-display tracking-widest uppercase">
              Select packs to install
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAll}
              className="px-2 py-1 text-[10px] font-display font-semibold tracking-wider text-neutral-400 hover:text-white uppercase transition-colors"
            >
              All
            </button>
            <span className="text-neutral-700 text-[10px]">|</span>
            <button
              onClick={selectRequired}
              className="px-2 py-1 text-[10px] font-display font-semibold tracking-wider text-neutral-400 hover:text-white uppercase transition-colors"
            >
              Required Only
            </button>
          </div>
        </div>

        {/* Pack List */}
        <div className="overflow-y-auto max-h-[240px] space-y-1.5 pr-1 no-scrollbar">
          {CONTENT_PACKS.map((pack: ContentPack) => {
             const isSelected = selectedPacks.includes(pack.id);
             const status = packStatuses.find((s) => s.packId === pack.id);
             const isInstalled = status?.state === "complete" || status?.state === "up-to-date";
             const isMarking = markingPackId === pack.id;

             return (
              <div
                key={pack.id}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded border transition-all duration-200 text-left
                  ${isSelected
                    ? "bg-neutral-900/80 border-red-900/50 hover:border-red-800/70"
                    : "bg-neutral-950/50 border-neutral-800/40 hover:border-neutral-700/60 opacity-60 hover:opacity-80"
                  }
                `}
              >
                {/* Clickable toggle area */}
                <div
                  onClick={() => togglePack(pack.id, pack.required)}
                  className={`flex items-center space-x-3 min-w-0 flex-1 ${pack.required ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* Toggle indicator */}
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border-2 shrink-0 flex items-center justify-center transition-colors duration-200
                      ${isSelected
                        ? "border-red-700 bg-red-800"
                        : "border-neutral-700 bg-transparent"
                      }
                      ${pack.required ? "border-red-900 bg-red-900/50" : ""}
                    `}
                  >
                    {isSelected && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-display text-xs font-bold tracking-wider text-neutral-200 uppercase truncate">
                        {pack.name}
                      </span>
                      {pack.required && (
                        <span className="text-[8px] font-display font-bold tracking-widest text-red-700 uppercase bg-red-950/50 px-1.5 py-0.5 rounded shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                      {pack.description}
                    </p>
                  </div>
                </div>

                {/* Right action area */}
                <div className="flex items-center shrink-0 ml-3">
                  {isInstalled ? (
                    <span className="text-[9px] font-display font-bold tracking-wider text-emerald-600 uppercase bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/20">
                      Installed
                    </span>
                  ) : isMarking ? (
                    <span className="text-[9px] font-display font-bold tracking-wider text-red-500 uppercase animate-pulse">
                      Marking...
                    </span>
                  ) : (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setMarkingPackId(pack.id);
                        try {
                          await onMarkAsInstalled(pack.id);
                        } finally {
                          setMarkingPackId(null);
                        }
                      }}
                      className="px-2 py-1 text-[9px] font-display font-semibold tracking-wider text-neutral-400 hover:text-white border border-neutral-850 hover:border-red-900/40 rounded uppercase transition-all duration-200 hover:bg-neutral-900"
                    >
                      Mark Installed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mirror selector */}
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-display font-semibold tracking-wider text-neutral-500 uppercase">
              Mirror:
            </span>
            {[1, 2].map((id) => (
              <button
                key={id}
                onClick={() => onMirrorIdChange(id)}
                className={`px-3 py-1 text-[10px] font-display font-semibold tracking-wider uppercase border rounded transition-all duration-200
                  ${mirrorId === id
                    ? "border-red-800 text-red-500 bg-red-950/30"
                    : "border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                  }
                `}
              >
                Mirror {id}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-display font-semibold tracking-wider text-neutral-500 hover:text-neutral-300 uppercase transition-colors flex items-center space-x-1"
          >
            <span>Advanced</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Advanced Settings Panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showAdvanced ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="bg-neutral-950/60 border border-neutral-800/50 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-display font-semibold tracking-wider text-neutral-400 uppercase">
                Concurrent Downloads
              </label>
              <select
                value={downloadSettings.concurrentDownloads}
                onChange={(e) => updateSetting("concurrentDownloads", Number(e.target.value))}
                className="bg-neutral-900 border border-neutral-800 px-2 py-1 text-[10px] text-neutral-300 rounded focus:outline-none focus:border-red-800 cursor-pointer"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n} className="bg-neutral-950 text-neutral-200">{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] font-display font-semibold tracking-wider text-neutral-400 uppercase">
                Speed Limit
              </label>
              <select
                value={downloadSettings.speedLimitMbps}
                onChange={(e) => updateSetting("speedLimitMbps", Number(e.target.value))}
                className="bg-neutral-900 border border-neutral-800 px-2 py-1 text-[10px] text-neutral-300 rounded focus:outline-none focus:border-red-800 cursor-pointer"
              >
                <option value={0} className="bg-neutral-950 text-neutral-200">Unlimited</option>
                <option value={10} className="bg-neutral-950 text-neutral-200">10 MB/s</option>
                <option value={5} className="bg-neutral-950 text-neutral-200">5 MB/s</option>
                <option value={2} className="bg-neutral-950 text-neutral-200">2 MB/s</option>
                <option value={1} className="bg-neutral-950 text-neutral-200">1 MB/s</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] font-display font-semibold tracking-wider text-neutral-400 uppercase">
                Temp Location
              </label>
              <input
                type="text"
                value={downloadSettings.tempLocation}
                onChange={(e) => updateSetting("tempLocation", e.target.value)}
                placeholder="System default"
                className="w-40 bg-neutral-900 border border-neutral-800 px-2 py-1 text-[10px] text-neutral-300 font-mono rounded focus:outline-none focus:border-red-800"
              />
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={downloadSettings.keepFiles}
                onChange={(e) => updateSetting("keepFiles", e.target.checked)}
                className="accent-red-700 h-3 w-3 rounded bg-neutral-950 border-neutral-800 focus:ring-0 cursor-pointer"
              />
              <span className="text-[10px] font-display tracking-wider text-neutral-400 uppercase">
                Keep .deon files after extraction
              </span>
            </label>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-neutral-500 hover:text-white font-display font-semibold tracking-widest text-xs uppercase transition-colors duration-150"
          >
            ← BACK
          </button>
          <button
            onClick={onBeginInstall}
            disabled={selectedPacks.length === 0}
            className={`px-6 py-2 font-display font-bold tracking-widest text-xs uppercase border rounded shadow-md transition-all duration-200
              ${selectedPacks.length > 0
                ? "bg-red-800 text-white border-red-700 hover:bg-red-700"
                : "bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-50"
              }
            `}
          >
            BEGIN INSTALLATION ({selectedPacks.length})
          </button>
        </div>
      </div>
    </main>
  );
}

export default PackSelection;
