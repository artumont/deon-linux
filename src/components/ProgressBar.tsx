interface ProgressBarProps {
  progress: number;
  isActive: boolean;
  currentLabel?: string;
  onTogglePause?: () => void;
}

function ProgressBar({
  progress,
  isActive,
  currentLabel,
  onTogglePause,
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
              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-red-600 animate-ping" : "bg-neutral-600"}`}
            />
            <span>
              {currentLabel
                ? `${currentLabel} — ${progress}%`
                : isActive
                  ? `INSTALLING — ${progress}% COMPLETE`
                  : `PAUSED — ${progress}% COMPLETE`
              }
            </span>
          </button>
        ) : (
          <span className="text-emerald-500 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>COMPLETE — READY TO PLAY</span>
          </span>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="flex items-center w-full max-w-[640px] px-4 space-x-4">
        <div
          onClick={onTogglePause}
          className="flex-1 h-3 bg-neutral-900 border border-neutral-800 rounded-sm overflow-hidden cursor-pointer"
          title={
            progress < 100
              ? isActive
                ? "Click to Pause"
                : "Click to Resume"
              : "Complete"
          }
        >
          <div
            className={`h-full bg-red-800 transition-all duration-300 ease-out animate-red-glow ${isActive ? "bg-red-700" : "bg-red-900 opacity-60"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </footer>
  );
}

export default ProgressBar;
