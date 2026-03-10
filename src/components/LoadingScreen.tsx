import { useState, useEffect } from "react";
import appIcon from "@/assets/app-icon-large.png";

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
      className="flex flex-col items-center justify-center py-28 gap-6 transition-opacity duration-700"
      style={{ opacity: show ? 1 : 0 }}
    >
      {/* Logo */}
      <div
        className="relative"
        style={{ animation: "nb-letter-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
      >
        <img
          src={appIcon}
          alt="نوبهار"
          className="w-24 h-24 object-contain select-none"
          style={{ animation: "nb-breathe 3.5s ease-in-out 0.8s infinite" }}
        />
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
        @keyframes nb-letter-in {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.04); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
