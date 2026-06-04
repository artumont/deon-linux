import { CONTENT_PACKS } from "../packs";
import type { PackStatus } from "../types";

interface InstallerContentProps {
  packStatuses: PackStatus[];
  isUpdateMode: boolean;
  onBackToSelection: () => void;
}

function InstallerContent({ packStatuses, isUpdateMode, onBackToSelection }: InstallerContentProps) {
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

  return (
    <main className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-140px)] px-6 md:px-16 pt-6 md:pt-10">
      <div className="w-full max-w-[620px] flex flex-col">
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
        <p className="text-[10px] md:text-xs text-neutral-500 font-display tracking-widest uppercase mb-5">
          {isUpdateMode
            ? allComplete
              ? "All content packs are current"
              : "Checking installed packs for updates"
            : allComplete
              ? "All selected packs have been installed successfully"
              : "Downloading and extracting content packs"
          }
        </p>

        {/* Pack status list */}
        <div className="overflow-y-auto max-h-[280px] space-y-1.5 pr-1 no-scrollbar">
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

                {/* Per-pack progress bar for active items */}
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

        {allComplete && (
          <div className="mt-6 flex justify-center animate-fade-in">
            <button
              onClick={onBackToSelection}
              className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-red-900/50 transition-all duration-200 font-display font-bold tracking-widest text-xs rounded uppercase shadow-lg shadow-black/45"
            >
              Modify Pack Selection
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default InstallerContent;
