import { useState, useRef, useEffect } from "react";

interface TermsOfUseProps {
  onAccept: () => void;
  onImport: (path: string) => void;
}

function TermsOfUse({ onAccept, onImport }: TermsOfUseProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleImportClick = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Existing Installation Folder",
      });
      if (selected) {
        onImport(selected as string);
      }
    } catch (err) {
      console.warn("Folder picker not available outside Tauri:", err);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      if (atBottom) setScrolledToEnd(true);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-60px)] px-6 md:px-16">
      <div className="w-full max-w-[620px] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-xl md:text-2xl font-black tracking-wider text-white drop-shadow-md">
            TERMS OF USE
          </h1>
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-red-900/50 transition-all duration-200 font-display font-bold tracking-wider text-[10px] rounded uppercase shadow-sm"
          >
            Import Existing Install
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-neutral-500 font-display tracking-widest uppercase mb-4">
          Please read carefully before proceeding
        </p>

        {/* Scrollable terms container */}
        <div
          ref={scrollRef}
          className="terms-scroll-container overflow-y-auto max-h-[340px] bg-neutral-950/70 border border-neutral-800/60 rounded p-5 md:p-6 space-y-4 text-sm text-neutral-400 leading-relaxed backdrop-blur-sm"
        >
          <section>
            <h2 className="font-display text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
              Disclaimer
            </h2>
            <p>
              This installer is an <strong className="text-neutral-200">unofficial, community-built tool</strong> and
              is <strong className="text-neutral-200">not affiliated with, endorsed by, or associated with</strong> the
              Delta Online (DEON) development team, Epic Games, The Coalition, or Microsoft Corporation in any way.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
              Purpose
            </h2>
            <p>
              This tool exists solely to simplify the process of downloading and installing Delta Online
              content packs on Linux. It automates steps that would otherwise be performed manually
              by the end user.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
              Content &amp; Intellectual Property
            </h2>
            <p>
              All game content, assets, and data downloaded through this installer remain the
              intellectual property of their respective owners. This installer does not modify,
              redistribute, or host any game files directly — it facilitates downloads from
              the official Delta Online distribution mirrors.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
              No Warranty
            </h2>
            <p>
              This software is provided "as-is" without any warranty of any kind, express or implied.
              The author(s) shall not be held liable for any damages arising from the use of this tool.
              Use at your own risk.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
              Steam Account Requirement
            </h2>
            <p>
              A valid Steam account with a Steam64 ID is required to authenticate and decrypt
              content packs. Your Steam ID is sent to the Delta Online authentication server
              to retrieve file passwords. This installer does not store, transmit, or share your
              Steam credentials beyond what is required for authentication.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
              Agreement
            </h2>
            <p>
              By clicking "I Agree &amp; Continue" below, you acknowledge that you have read and
              understood this disclaimer, and you accept full responsibility for your use of this tool.
            </p>
          </section>
        </div>

        {/* Scroll hint + accept button */}
        <div className="flex items-center justify-between mt-4">
          <span className={`text-[10px] font-display tracking-widest uppercase transition-opacity duration-300 ${scrolledToEnd ? "opacity-0" : "text-neutral-500 opacity-100"}`}>
            ↓ Scroll to continue
          </span>
          <button
            onClick={onAccept}
            disabled={!scrolledToEnd}
            className={`px-6 py-2 font-display font-bold tracking-widest text-xs uppercase border rounded shadow-md transition-all duration-200
              ${scrolledToEnd
                ? "bg-red-800 text-white border-red-700 hover:bg-red-700 cursor-pointer"
                : "bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-50"
              }
            `}
          >
            I AGREE &amp; CONTINUE
          </button>
        </div>
      </div>
    </main>
  );
}

export default TermsOfUse;
