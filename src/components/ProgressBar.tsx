interface ProgressBarProps {
  progress: number;
  isInstalling: boolean;
  onTogglePause: () => void;
  onOpenSettings: () => void;
}

function ProgressBar({
  progress,
  isInstalling,
  onTogglePause,
  onOpenSettings,
}: ProgressBarProps) {
  return (
    <footer className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center bg-gradient-to-t from-black via-black/95 to-black/0 pt-8 pb-5 px-6 md:px-12 select-none">
      {/* Progress Text Label */}
      <div className="flex items-center space-x-2 mb-2 font-display text-[10px] md:text-[12px] font-bold tracking-widest">
        {progress < 100 ? (
          <button
            onClick={onTogglePause}
            className="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors duration-150 focus:outline-none"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isInstalling ? "bg-red-600 animate-ping" : "bg-neutral-600"}`}
            />
            <span>
              {isInstalling ? "INSTALLING" : "INSTALLATION PAUSED"} -{" "}
              {progress}% COMPLETE
            </span>
          </button>
        ) : (
          <span className="text-emerald-500 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>INSTALLATION COMPLETE - READY TO PLAY</span>
          </span>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="flex items-center w-full max-w-[640px] px-4 space-x-4">
        <div
          onClick={() => progress < 100 && onTogglePause()}
          className="flex-1 h-3 bg-neutral-900 border border-neutral-800 rounded-sm overflow-hidden cursor-pointer"
          title={
            progress < 100
              ? isInstalling
                ? "Click to Pause"
                : "Click to Resume"
              : "Complete"
          }
        >
          <div
            className={`h-full bg-red-800 transition-all duration-300 ease-out animate-red-glow ${isInstalling ? "bg-red-700" : "bg-red-900 opacity-60"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Settings gear trigger bottom-left */}
      <div className="absolute left-6 md:left-12 bottom-5">
        <button
          onClick={onOpenSettings}
          className="text-neutral-500 hover:text-neutral-200 transition-colors duration-300 focus:outline-none"
          title="Open Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin-slow hover:text-white"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </footer>
  );
}

export default ProgressBar;
