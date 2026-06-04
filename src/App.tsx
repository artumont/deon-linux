import { useState, useEffect } from "react";
import "./App.css";

import TitleBar from "./components/TitleBar";
import BackgroundLayer from "./components/BackgroundLayer";
import InstallerContent from "./components/InstallerContent";
import ProgressBar from "./components/ProgressBar";
import SettingsModal from "./components/SettingsModal";

function App() {
  const [progress, setProgress] = useState<number>(0);
  const [isInstalling, setIsInstalling] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [installPath, setInstallPath] = useState<string>("C:\\Games\\DeltaOnline");

  // Installer progress simulation
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isInstalling && progress < 100) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsInstalling(false);
            return 100;
          }
          const increment = Math.random() > 0.7 ? 1 : Math.random() > 0.4 ? 0.5 : 0;
          return Math.min(100, Number((prev + increment).toFixed(1)));
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isInstalling, progress]);

  return (
    <div className="relative w-screen h-screen select-none overflow-hidden font-sans text-neutral-200 antialiased bg-[#030303]">
      <BackgroundLayer />
      <TitleBar />

      <InstallerContent progress={progress} isInstalling={isInstalling} />

      <ProgressBar
        progress={progress}
        isInstalling={isInstalling}
        onTogglePause={() => setIsInstalling(!isInstalling)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showSettings && (
        <SettingsModal
          installPath={installPath}
          onInstallPathChange={setInstallPath}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
