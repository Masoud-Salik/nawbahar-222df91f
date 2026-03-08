import { useState, useRef, useEffect } from "react";
import { REACTION_KEYS, REACTION_LABELS, REACTION_COLORS, REACTION_EMOJIS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";
import { ThumbsUp, Heart, Lightbulb, Smile, Frown } from "lucide-react";

/** Map reaction keys to Lucide outline icons */
const REACTION_ICONS: Record<string, React.ElementType> = {
  like: ThumbsUp,
  love: Heart,
  insightful: Lightbulb,
  laugh: Smile,
  sad: Frown,
};

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
  // Track if reaction changed via user action (not initial load)
  const [justReacted, setJustReacted] = useState(false);
  const prevReaction = useRef(userReaction);

  useEffect(() => {
    // Only trigger pop animation if user actively changed their reaction
    if (prevReaction.current !== userReaction && prevReaction.current !== undefined) {
      // Skip animation on first data load (prevReaction was null initially)
      if (prevReaction.current !== null || justReacted) {
        setJustReacted(true);
        const t = setTimeout(() => setJustReacted(false), 350);
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

  const handleIconTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHover?.();
    setOpen((prev) => !prev);
  };

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

  const handleReactionLabelClick = (e: React.MouseEvent) => {
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

  const renderSmartIcon = () => {
    if (userReaction) {
      const Icon = REACTION_ICONS[userReaction] || ThumbsUp;
      return (
        <span
          className="inline-flex transition-colors duration-300"
          style={{
            color: activeColor,
            ...(justReacted ? { animation: "reaction-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both" } : {}),
          }}
        >
          <Icon size={15} strokeWidth={1.8} />
        </span>
      );
    }
    if (topTypes && topTypes.length > 0) {
      return (
        <span className="flex items-center -space-x-1 transition-opacity duration-500">
          {topTypes.slice(0, 2).map((type) => {
            const Icon = REACTION_ICONS[type] || ThumbsUp;
            const color = REACTION_COLORS[type]?.text;
            return (
              <Icon
                key={type}
                size={13}
                strokeWidth={1.5}
                className="transition-colors duration-500"
                style={{ color: color || undefined, opacity: 0.5 }}
              />
            );
          })}
        </span>
      );
    }
    return <ThumbsUp size={14} strokeWidth={1.5} className="text-muted-foreground/50" />;
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      <button
        onClick={handleIconTap}
        className={cn(
          "flex items-center transition-all duration-300",
          isReacted ? "" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {renderSmartIcon()}
      </button>

      {summaryText && onSummaryClick ? (
        <button
          onClick={handleTextClick}
          className={cn(
            "text-[11px] truncate max-w-[150px] transition-colors duration-300",
            isReacted ? "" : "text-muted-foreground"
          )}
          style={isReacted ? { color: activeColor } : undefined}
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

      {/* Picker tray — outline icons with muted colors */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:bottom-full sm:mb-2 sm:left-0 flex items-center justify-center gap-2 sm:gap-1 sm:rounded-full rounded-t-2xl px-4 sm:px-3 py-4 sm:py-2 z-50 animate-scale-in"
          style={{
            background: "hsl(var(--background))",
            boxShadow: "0 -4px 20px -4px hsl(var(--foreground) / 0.1), 0 0 0 1px hsl(var(--border) / 0.5)",
          }}
        >
          {REACTION_KEYS.map((key, i) => {
            const Icon = REACTION_ICONS[key];
            const isActive = userReaction === key;
            const colors = REACTION_COLORS[key];
            return (
              <button
                key={key}
                onClick={(e) => handleSelect(key as ReactionKey, e)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-full transition-all duration-150",
                  "w-[48px] h-[48px] sm:w-[38px] sm:h-[38px]",
                  "hover:scale-[1.15] hover:-translate-y-0.5 active:scale-95",
                )}
                style={{
                  animation: `scale-in 0.18s ease-out ${i * 35}ms both`,
                  backgroundColor: isActive ? colors?.bg : undefined,
                  boxShadow: isActive ? `0 0 0 1.5px ${colors?.ring}` : undefined,
                  color: isActive ? colors?.text : "hsl(var(--muted-foreground))",
                }}
              >
                <Icon size={20} strokeWidth={1.5} className="sm:w-[17px] sm:h-[17px]" />
                <span className="text-[8px] sm:hidden mt-1 leading-none opacity-70">
                  {REACTION_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
