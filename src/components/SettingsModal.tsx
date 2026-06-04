import { useState, useEffect } from "react";

interface SettingsModalProps {
  installPath: string;
  onInstallPathChange: (path: string) => void;
  onClose: () => void;
}

function SettingsModal({
  installPath,
  onInstallPathChange,
  onClose,
}: SettingsModalProps) {
  const [downloadLimit, setDownloadLimit] = useState<string>("unlimited");
  const [highResTextures, setHighResTextures] = useState<boolean>(true);
  const [soundVolume, setSoundVolume] = useState<number>(80);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyProgress, setVerifyProgress] = useState<number>(0);

  const startVerification = () => {
    if (verifying) return;
    setVerifying(true);
    setVerifyProgress(0);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (verifying && verifyProgress < 100) {
      timer = setInterval(() => {
        setVerifyProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setVerifying(false);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [verifying, verifyProgress]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-[500px] bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded shadow-2xl animate-modal-in select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-5">
          <h3 className="font-display text-lg font-bold tracking-wider text-red-600">
            LAUNCHER SETTINGS
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors duration-150 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content / Options Form */}
        <div className="space-y-5 text-sm">
          {/* Install path */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold tracking-wide uppercase text-xs">
              Installation Path
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={installPath}
                onChange={(e) => onInstallPathChange(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-1.5 text-neutral-300 font-mono text-xs rounded focus:outline-none focus:border-red-800 transition-colors"
              />
            </div>
          </div>

          {/* Download Speed Limit dropdown */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold tracking-wide uppercase text-xs">
              Download Speed Limit
            </label>
            <select
              value={downloadLimit}
              onChange={(e) => setDownloadLimit(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-1.5 text-neutral-300 rounded focus:outline-none focus:border-red-800 transition-colors"
            >
              <option value="unlimited">Unlimited (Recommended)</option>
              <option value="10">10 MB/s</option>
              <option value="5">5 MB/s</option>
              <option value="2">2 MB/s</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={highResTextures}
                onChange={(e) => setHighResTextures(e.target.checked)}
                className="accent-red-700 h-4 w-4 rounded bg-neutral-950 border-neutral-800 focus:ring-0 cursor-pointer"
              />
              <span className="text-neutral-300 select-none">
                Download High-Resolution Texture Pack
              </span>
            </label>
          </div>

          {/* Sound Volume Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <label className="text-neutral-400 font-semibold tracking-wide uppercase text-xs">
                Launcher Volume
              </label>
              <span className="text-neutral-400 font-mono text-xs">
                {soundVolume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="w-full accent-red-700 h-1.5 bg-neutral-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Actions & Verification */}
          <div className="border-t border-neutral-800/60 pt-4 mt-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                Trouble installing? Verify files integrity.
              </div>
              <button
                onClick={startVerification}
                disabled={verifying}
                className={`px-3 py-1 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors duration-150 font-display font-semibold tracking-wider text-xs border border-neutral-700 rounded uppercase
                  ${verifying ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {verifying ? "Verifying..." : "Verify Files"}
              </button>
            </div>

            {/* File Verification progress bar */}
            {verifying && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>VERIFYING FILES</span>
                  <span>{verifyProgress}%</span>
                </div>
                <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-700 transition-all duration-100 ease-linear"
                    style={{ width: `${verifyProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Save/Close button */}
        <div className="flex justify-end space-x-3 border-t border-neutral-850 mt-6 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-red-800 text-white hover:bg-red-700 transition-colors duration-150 font-display font-bold tracking-widest text-xs uppercase border border-red-700 rounded shadow-md"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
