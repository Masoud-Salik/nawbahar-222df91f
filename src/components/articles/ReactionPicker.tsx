import { useState, useRef, useEffect } from "react";
import { REACTION_KEYS, REACTION_LABELS, REACTION_EMOJIS, REACTION_COLORS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
  topTypes?: ReactionKey[];
  summaryText?: string;
  onSummaryClick?: (e: React.MouseEvent) => void;
  fetched?: boolean;
}

export function ReactionPicker({ userReaction, onReact, onHover, topTypes, summaryText, onSummaryClick, fetched = true }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [justReacted, setJustReacted] = useState(false);
  const prevReaction = useRef(userReaction);

  useEffect(() => {
    if (prevReaction.current !== userReaction && prevReaction.current !== undefined) {
      if (prevReaction.current !== null || justReacted) {
        setJustReacted(true);
        const t = setTimeout(() => setJustReacted(false), 400);
        return () => clearTimeout(t);
      }
    }
    prevReaction.current = userReaction;
  }, [userReaction]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHover?.();
    setOpen((prev) => !prev);
  };

  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJustReacted(true);
    onReact(type);
    setOpen(false);
  };

  const isReacted = Boolean(userReaction);
  const activeColor = userReaction ? REACTION_COLORS[userReaction]?.text : undefined;

  /**
   * Stable inline emoji — NEVER changes due to async data loading.
   * Shows 👍 by default. Only shows user's own reaction emoji if they reacted.
   */
  const renderInlineEmoji = () => {
    if (userReaction) {
      return (
        <span
          className="text-[15px] leading-none"
          style={justReacted ? { animation: "reaction-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both" } : {}}
        >
          {REACTION_EMOJIS[userReaction]}
        </span>
      );
    }
    // Show stable 👍 only after data is fetched (no reaction) or before fetch
    return <span className={cn("text-[14px] leading-none transition-opacity duration-300", fetched ? "opacity-45" : "opacity-20")}>👍</span>;
  };

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSummaryClick) {
      onSummaryClick(e);
    } else {
      onHover?.();
      setOpen((prev) => !prev);
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 sm:gap-1.5">
      {/* Main emoji button */}
      <button onClick={handleToggle} className="flex items-center">
        {renderInlineEmoji()}
      </button>

      {/* Summary text — always muted to match comment text */}
      <button
        onClick={handleSummaryClick}
        className="text-[10.5px] sm:text-[11px] truncate max-w-[120px] sm:max-w-[150px] text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        {summaryText || "واکنش"}
      </button>

      {/* LinkedIn-style emoji picker tray */}
      {open && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50",
            "sm:absolute sm:inset-auto sm:bottom-full sm:mb-2.5 sm:left-1/2 sm:-translate-x-1/2",
            "flex items-center justify-center",
            "sm:rounded-full rounded-t-2xl",
            "px-3 sm:px-2 py-3 sm:py-1.5",
            "animate-scale-in"
          )}
          style={{
            background: "hsl(var(--card))",
            boxShadow: "0 -6px 30px -6px hsl(var(--foreground) / 0.12), 0 0 0 1px hsl(var(--border) / 0.4)",
          }}
        >
          <div className="flex items-center gap-0.5 sm:gap-0">
            {REACTION_KEYS.map((key, i) => {
              const isActive = userReaction === key;
              return (
                <button
                  key={key}
                  onClick={(e) => handleSelect(key as ReactionKey, e)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl transition-all duration-150",
                    "w-[54px] h-[58px] sm:w-[42px] sm:h-[42px]",
                    "hover:scale-[1.2] hover:-translate-y-1 active:scale-90",
                    isActive && "bg-foreground/[0.06] scale-[1.05]"
                  )}
                  style={{ animation: `reaction-entry 0.22s ease-out ${i * 40}ms both` }}
                >
                  <span className={cn(
                    "transition-transform duration-150",
                    "text-[24px] sm:text-[21px] leading-none",
                    isActive && "scale-105"
                  )}>
                    {REACTION_EMOJIS[key]}
                  </span>
                  <span className={cn(
                    "text-[8.5px] sm:hidden mt-1 leading-none",
                    isActive ? "text-foreground/70 font-medium" : "text-muted-foreground/60"
                  )}>
                    {REACTION_LABELS[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm sm:hidden"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}
        />
      )}

      <style>{`
        @keyframes reaction-pop {
          0% { transform: scale(0.4); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes reaction-entry {
          0% { transform: scale(0) translateY(8px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
