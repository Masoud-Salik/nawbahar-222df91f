import { useState, useRef, useEffect, useCallback } from "react";
import { REACTION_KEYS, REACTION_LABELS, REACTION_COLORS, type ReactionKey } from "@/hooks/useCardReactions";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { cn } from "@/lib/utils";

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
  const [justReacted, setJustReacted] = useState(false);
  const prevReaction = useRef(userReaction);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Tap = quick like, long press = open picker
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHover?.();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      setOpen(true);
    }, 400);
  }, [onHover]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      // Quick tap = toggle like
      if (userReaction === "like") {
        onReact("like"); // removes it
      } else if (!userReaction) {
        setJustReacted(true);
        onReact("like");
      } else {
        // Already has a different reaction, open picker
        setOpen(true);
      }
    }
  }, [userReaction, onReact]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Desktop: click opens picker
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only use on non-touch devices
    if (window.matchMedia("(hover: hover)").matches) {
      onHover?.();
      setOpen(prev => !prev);
    }
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

  const renderInlineIcon = () => {
    const IconComponent = userReaction ? REACTION_SVG_ICONS[userReaction] : REACTION_SVG_ICONS.like;
    const style = justReacted ? { animation: "reaction-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both" } : {};
    
    return (
      <span style={style} className="flex items-center">
        <IconComponent 
          size={16} 
          strokeWidth={userReaction ? 2 : 1.5}
          className={cn(
            "transition-colors duration-150",
            userReaction ? "" : "text-muted-foreground/50"
          )}
        />
      </span>
    );
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
      {/* Main icon button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        className="flex items-center touch-none select-none"
        style={activeColor ? { color: activeColor } : {}}
      >
        {renderInlineIcon()}
      </button>

      {/* Summary text */}
      <button
        onClick={handleSummaryClick}
        className="text-[10.5px] sm:text-[11px] truncate max-w-[120px] sm:max-w-[150px] text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        {summaryText || "واکنش"}
      </button>

      {/* Reaction picker panel */}
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
              const IconComponent = REACTION_SVG_ICONS[key];
              const color = REACTION_COLORS[key];
              return (
                <button
                  key={key}
                  onClick={(e) => handleSelect(key as ReactionKey, e)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl transition-all duration-150",
                    "w-[54px] h-[58px] sm:w-[42px] sm:h-[42px]",
                    "hover:scale-[1.2] hover:-translate-y-1 active:scale-90",
                    isActive && "scale-[1.05]"
                  )}
                  style={{
                    animation: `reaction-entry 0.22s ease-out ${i * 40}ms both`,
                    ...(isActive ? { backgroundColor: color.bg } : {}),
                  }}
                >
                  <IconComponent 
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    className={cn(
                      "transition-all duration-150",
                      isActive ? "" : "text-muted-foreground hover:text-foreground"
                    )}
                  />
                  <span className={cn(
                    "text-[8.5px] sm:hidden mt-1 leading-none",
                    isActive ? "font-medium" : "text-muted-foreground/60"
                  )}
                    style={isActive ? { color: color.text } : {}}
                  >
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
          className="fixed inset-0 z-40 bg-background/15 sm:hidden"
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
