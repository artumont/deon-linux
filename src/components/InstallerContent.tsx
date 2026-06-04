interface InstallerContentProps {
  progress: number;
  isInstalling: boolean;
}

function InstallerContent({ progress, isInstalling }: InstallerContentProps) {
  const getStepStatus = (threshold: number) => {
    if (progress >= threshold) return "complete";
    if (isInstalling && progress >= threshold - 25) return "active";
    return "pending";
  };

  const steps = [
    { label: "Preparing installation", threshold: 10 },
    { label: "Downloading core files", threshold: 40 },
    { label: "Extracting assets", threshold: 70 },
    { label: "Finalizing setup", threshold: 100 },
  ];

  return (
    <main className="relative z-10 flex flex-col justify-center h-[calc(100vh-140px)] px-6 md:px-16 pt-6 md:pt-10">
      <div className="flex w-full md:w-3/5 lg:w-1/2 flex-col justify-start">
        <h1 className="font-display text-2xl md:text-3xl font-black tracking-wide text-white drop-shadow-md">
          INSTALLATION
        </h1>
        <p className="mt-2 text-sm md:text-base text-neutral-400 font-medium leading-relaxed max-w-lg">
          {progress < 100
            ? "Setting up Delta Online. This may take a few minutes depending on your connection."
            : "Delta Online has been installed successfully. You're ready to go."}
        </p>

        {/* Step indicators */}
        <div className="mt-8 space-y-4">
          {steps.map((step) => {
            const status = getStepStatus(step.threshold);
            return (
              <div key={step.label} className="flex items-center space-x-3">
                {/* Step dot */}
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                    status === "complete"
                      ? "bg-emerald-500"
                      : status === "active"
                        ? "bg-red-600 animate-pulse"
                        : "bg-neutral-700"
                  }`}
                />
                <span
                  className={`font-display text-xs md:text-sm font-semibold tracking-wider uppercase transition-colors duration-300 ${
                    status === "complete"
                      ? "text-neutral-300"
                      : status === "active"
                        ? "text-white"
                        : "text-neutral-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default InstallerContent;
