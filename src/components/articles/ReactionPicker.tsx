import { useState, useRef, useEffect } from "react";
import { REACTION_EMOJIS, REACTION_LABELS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
  summaryText?: string;
  onSummaryClick?: (e: React.MouseEvent) => void;
}

export function ReactionPicker({ userReaction, onReact, onHover, summaryText, onSummaryClick }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside scroll only
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      // Don't close if scrolling inside the picker itself
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  // Hover: only OPENS the picker tray, does NOT trigger any reaction
  const handlePointerEnter = () => {
    clearTimeout(timeoutRef.current);
    onHover?.();
    timeoutRef.current = setTimeout(() => setOpen(true), 400);
  };

  const handlePointerLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 250);
  };

  // Tap on the icon: toggle like (only if picker is NOT open)
  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // If picker is open or was long-pressed, don't toggle — let user pick from tray
    if (open || longPressRef.current) {
      longPressRef.current = false;
      return;
    }
    onReact("like");
  };

  // Touch: long-press opens picker, short tap toggles like
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    longPressRef.current = false;
    clearTimeout(timeoutRef.current);
    onHover?.();
    timeoutRef.current = setTimeout(() => {
      longPressRef.current = true;
      setOpen(true);
    }, 400);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!longPressRef.current) clearTimeout(timeoutRef.current);
  };

  // Select from picker tray — this is the ONLY way to change reaction type
  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReact(type);
    setOpen(false);
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSummaryClick) {
      onSummaryClick(e);
      return;
    }
    onReact("like");
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

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

  const isReacted = Boolean(userReaction);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1.5"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Reaction icon — tap toggles like, hover opens picker */}
      <button
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex items-center transition-colors duration-200",
          isReacted ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ThumbsUp
          size={14}
          strokeWidth={1.5}
          fill={isReacted ? "currentColor" : "none"}
        />
      </button>

      {/* Summary text: names / count */}
      {summaryText && (
        <button
          onClick={handleTextClick}
          className={cn(
            "text-[11px] truncate max-w-[150px] transition-colors duration-200",
            isReacted ? "text-foreground/85" : "text-muted-foreground"
          )}
        >
          {summaryText}
        </button>
      )}

      {/* Emoji picker tray */}
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 flex items-center gap-0.5 rounded-full px-2 py-1.5 z-50 animate-scale-in"
          style={{
            background: "hsl(var(--background))",
            boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.12), 0 0 0 1px hsl(var(--border) / 0.6)",
          }}
        >
          {Object.entries(REACTION_EMOJIS).map(([key, emoji], i) => (
            <button
              key={key}
              onClick={(e) => handleSelect(key as ReactionKey, e)}
              className={cn(
                "w-[32px] h-[32px] flex items-center justify-center rounded-full text-[18px] transition-all duration-150",
                "hover:scale-[1.35] hover:-translate-y-1",
                userReaction === key && "bg-muted/70 scale-110"
              )}
              style={{ animation: `scale-in 0.18s ease-out ${i * 25}ms both` }}
              title={REACTION_LABELS[key]}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
