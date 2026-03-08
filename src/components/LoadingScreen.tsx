import { useState, useEffect } from "react";

export function LoadingScreen() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Simulated progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-28 gap-8 transition-opacity duration-700"
      style={{ opacity: show ? 1 : 0 }}
    >
      {/* Logo mark */}
      <div className="relative w-20 h-20">
        {/* Orbiting dots */}
        <div className="absolute inset-0" style={{ animation: "nb-orbit 3s linear infinite" }}>
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
            style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
          />
        </div>
        <div className="absolute inset-0" style={{ animation: "nb-orbit 3s linear infinite reverse", animationDelay: "-1.5s" }}>
          <div
            className="absolute w-1 h-1 rounded-full bg-accent/50"
            style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
          />
        </div>

        {/* Static ring */}
        <div className="absolute inset-1 rounded-[18px] border border-border/30" />

        {/* Inner glow */}
        <div
          className="absolute inset-3 rounded-[14px]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
            animation: "nb-pulse 2.5s ease-in-out infinite",
          }}
        />

        {/* Center letter */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: "nb-letter-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
        >
          <span
            className="text-[28px] font-black text-foreground select-none"
            style={{ animation: "nb-breathe 3.5s ease-in-out 0.8s infinite" }}
          >
            ن
          </span>
        </div>
      </div>

      {/* Brand */}
      <div style={{ animation: "nb-fade-up 0.5s ease-out 0.3s both" }}>
        <span className="text-[15px] font-bold text-foreground/80 tracking-wider">نوبهار</span>
      </div>

      {/* Progress bar */}
      <div className="w-20 h-[2px] bg-border/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: "hsl(var(--primary) / 0.6)",
          }}
        />
      </div>

      <style>{`
        @keyframes nb-orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes nb-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes nb-letter-in {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes nb-fade-up {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
