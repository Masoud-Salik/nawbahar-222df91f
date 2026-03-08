import { useState, useEffect } from "react";

export function LoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-8 transition-opacity duration-500"
      style={{ opacity: show ? 1 : 0 }}
    >
      {/* Logo mark with elegant animation */}
      <div className="relative w-20 h-20">
        {/* Outer breathing ring */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-primary/15"
          style={{
            animation: "splash-breathe 2s ease-in-out infinite",
          }}
        />

        {/* Rotating gradient arc */}
        <div className="absolute inset-0">
          <svg className="w-20 h-20" viewBox="0 0 80 80" style={{ animation: "splash-spin 2s linear infinite" }}>
            <defs>
              <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="74" height="74" rx="16" ry="16" fill="none" stroke="url(#arc-grad)" strokeWidth="2" strokeDasharray="100 200" />
          </svg>
        </div>

        {/* Center letter with scale-in */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: "splash-letter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
        >
          <span className="text-[28px] font-black text-primary select-none">ن</span>
        </div>
      </div>

      {/* Brand name fade-in */}
      <div style={{ animation: "splash-fade-up 0.5s ease-out 0.3s both" }}>
        <span className="text-lg font-bold text-foreground tracking-wide">نوبهار</span>
      </div>

      {/* Elegant progress bar */}
      <div className="w-20 h-[2px] bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
            animation: "splash-bar 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes splash-breathe {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
        @keyframes splash-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splash-letter {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splash-fade-up {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes splash-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 65%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
