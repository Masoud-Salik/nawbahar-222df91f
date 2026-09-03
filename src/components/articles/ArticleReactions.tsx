import { useState, useRef } from "react";
import { ThumbsUp, Heart, Smile, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionKey = "like" | "love" | "funny" | "fire" | "star";

const reactions = [
  { key: "like", icon: ThumbsUp, label: "لایک" },
  { key: "love", icon: Heart, label: "علاقه" },
  { key: "funny", icon: Smile, label: "خنده‌دار" },
  { key: "fire", icon: Flame, label: "خفن" },
  { key: "star", icon: Star, label: "عالی" },
] as const;

interface Props {
  userReaction?: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  topTypes: ReactionKey[];
  summaryText?: string;
  onSummaryClick?: () => void;
}

export function ReactionPicker({
  userReaction,
  onReact,
  summaryText,
  onSummaryClick,
}: Props) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⏱️ Long press handler
  const handleMouseDown = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 300); // LinkedIn-like delay
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleSelect = (type: ReactionKey) => {
    onReact(type);
    setOpen(false);
  };

  const ActiveIcon =
    reactions.find((r) => r.key === userReaction)?.icon || ThumbsUp;

  return (
    <div className="relative flex items-center gap-2">
      {/* Main Button */}
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={() => onReact("like")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition",
          userReaction
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ActiveIcon size={16} strokeWidth={1.8} />
        <span className="text-[12px]">
          {userReaction
            ? reactions.find((r) => r.key === userReaction)?.label
            : "لایک"}
        </span>
      </button>

      {/* Popup reactions */}
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute bottom-10 left-0 flex items-center gap-2 bg-background border border-border shadow-lg rounded-full px-3 py-2 animate-in fade-in zoom-in-95"
        >
          {reactions.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className="group flex flex-col items-center"
            >
              <Icon
                size={20}
                className="transition-transform duration-150 group-hover:scale-125"
              />
              <span className="text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition">
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      {summaryText && (
        <button
          onClick={onSummaryClick}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          {summaryText}
        </button>
      )}
    </div>
  );
}
