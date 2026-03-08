import { useState, useRef, useEffect } from "react";
import { REACTION_EMOJIS, REACTION_LABELS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
}

export function ReactionPicker({ userReaction, onReact, onHover }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerEnter = () => {
    clearTimeout(timeoutRef.current);
    onHover?.();
    timeoutRef.current = setTimeout(() => setOpen(true), 350);
  };

  const handlePointerLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 250);
  };

  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open || longPressRef.current) {
      longPressRef.current = false;
      return;
    }
    onReact("like");
  };

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
    if (!longPressRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReact(type);
    setOpen(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

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

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex items-center gap-1 text-[12px] transition-all duration-200",
          userReaction
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {userReaction ? (
          <span className="text-[14px] leading-none">{REACTION_EMOJIS[userReaction]}</span>
        ) : (
          <ThumbsUp size={14} strokeWidth={1.5} />
        )}
        <span className="text-[11.5px]">
          {userReaction ? REACTION_LABELS[userReaction] : "پسند"}
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 flex items-center gap-0.5 rounded-full px-2 py-1.5 z-50"
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
                userReaction === key && "bg-muted scale-110"
              )}
              style={{
                animation: `scale-in 0.18s ease-out ${i * 20}ms both`,
              }}
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
