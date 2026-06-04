import { getCurrentWindow } from "@tauri-apps/api/window";

interface TitleBarProps {
  title?: string;
  titleAccent?: string;
}

function TitleBar({ title = "DELTA", titleAccent = "ONLINE" }: TitleBarProps) {
  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (err) {
      console.warn("Minimize window API not available in browser:", err);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.warn("Close window API not available in browser:", err);
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="relative z-10 flex items-center justify-between w-full px-5 py-3 select-none cursor-move"
    >
      <div data-tauri-drag-region className="flex-1 h-full" />
      <div
        data-tauri-drag-region
        className="flex items-center space-x-1 font-display tracking-widest text-sm md:text-base cursor-move"
      >
        <span
          data-tauri-drag-region
          className="font-extrabold text-white text-opacity-95 pointer-events-none"
        >
          {title}
        </span>
        <span
          data-tauri-drag-region
          className="font-normal text-neutral-400 pointer-events-none"
        >
          {titleAccent}
        </span>
      </div>
      <div className="flex items-center justify-end flex-1 space-x-4">
        <button
          onClick={handleMinimize}
          className="text-neutral-500 hover:text-white transition-colors duration-200 focus:outline-none cursor-default relative z-20"
          title="Minimize"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="text-neutral-500 hover:text-red-500 transition-colors duration-200 focus:outline-none cursor-default relative z-20"
          title="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
    </header>
  );
}

export default TitleBar;
