import { useState, useRef, useEffect } from "react";
import { REACTION_EMOJIS, REACTION_LABELS, REACTION_COLORS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
  topTypes?: ReactionKey[];
  summaryText?: string;
  onSummaryClick?: (e: React.MouseEvent) => void;
}

export function ReactionPicker({ userReaction, onReact, onHover, topTypes, summaryText, onSummaryClick }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside scroll
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  // Close on outside click
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

  // Icon button: always opens picker
  const handleIconTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHover?.();
    setOpen((prev) => !prev);
  };

  // Summary text click: show details modal
  const handleTextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSummaryClick) {
      onSummaryClick(e);
      return;
    }
    onHover?.();
    setOpen((prev) => !prev);
  };

  // "واکنش" label click: open picker
  const handleReactionLabelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHover?.();
    setOpen((prev) => !prev);
  };

  // Select from picker tray
  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReact(type);
    setOpen(false);
  };

  const isReacted = Boolean(userReaction);
  const activeEmoji = userReaction ? REACTION_EMOJIS[userReaction] : null;
  
  // Smart icon: user's own emoji > top 1-2 emojis > default thumbs up
  const renderSmartIcon = () => {
    if (activeEmoji) {
      return (
        <span className="text-[15px] leading-none select-none" style={{ animation: "reaction-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
          {activeEmoji}
        </span>
      );
    }
    if (topTypes && topTypes.length > 0) {
      return (
        <span className="flex items-center -space-x-0.5">
          {topTypes.slice(0, 2).map((type) => (
            <span key={type} className="text-[13px] leading-none select-none">{REACTION_EMOJIS[type]}</span>
          ))}
        </span>
      );
    }
    return <ThumbsUp size={14} strokeWidth={1.5} />;
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      {/* Smart reaction icon */}
      <button
        onClick={handleIconTap}
        className={cn(
          "flex items-center transition-all duration-200",
          isReacted ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {renderSmartIcon()}
      </button>

      {/* Text: summary with details or "واکنش" to open picker */}
      {summaryText && onSummaryClick ? (
        <button
          onClick={handleTextClick}
          className={cn(
            "text-[11px] truncate max-w-[150px] transition-colors duration-200",
            isReacted ? "text-foreground/85" : "text-muted-foreground"
          )}
        >
          {summaryText}
        </button>
      ) : (
        <button
          onClick={handleReactionLabelClick}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          واکنش
        </button>
      )}

      {/* Emoji picker tray */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:bottom-full sm:mb-2 sm:left-0 flex items-center justify-center gap-1 sm:gap-0.5 sm:rounded-full rounded-t-2xl px-3 sm:px-2 py-3 sm:py-1.5 z-50 animate-scale-in"
          style={{
            background: "hsl(var(--background))",
            boxShadow: "0 -4px 20px -4px hsl(var(--foreground) / 0.12), 0 0 0 1px hsl(var(--border) / 0.6)",
          }}
        >
          {Object.entries(REACTION_EMOJIS).map(([key, emoji], i) => (
            <button
              key={key}
              onClick={(e) => handleSelect(key as ReactionKey, e)}
              className={cn(
                "w-[40px] h-[40px] sm:w-[32px] sm:h-[32px] flex flex-col items-center justify-center rounded-full text-[22px] sm:text-[18px] transition-all duration-150",
                "hover:scale-[1.25] hover:-translate-y-1 active:scale-95",
                userReaction === key && "bg-primary/10 scale-110 ring-1.5 ring-primary/20"
              )}
              style={{ animation: `scale-in 0.18s ease-out ${i * 25}ms both` }}
            >
              <span>{emoji}</span>
              <span className="text-[8px] sm:hidden text-muted-foreground mt-0.5 leading-none">
                {REACTION_LABELS[key]}
              </span>
            </button>
          ))}
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
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
