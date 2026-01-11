import { cn } from "@/lib/utils";

interface ArticleReactionsProps {
  userReaction: "liked" | "disliked" | null;
  likedCount: number;
  dislikedCount: number;
  onReaction: (type: "liked" | "disliked") => void;
}

export function ArticleReactions({ 
  userReaction, 
  likedCount, 
  dislikedCount, 
  onReaction 
}: ArticleReactionsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-6 border-t border-b border-border my-8">
      <button
        onClick={() => onReaction("liked")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-colors text-sm",
          userReaction === "liked"
            ? "bg-primary/10 border-primary text-primary"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        )}
      >
        <span>دوست داشتم</span>
        {likedCount > 0 && (
          <span className="text-xs opacity-70">({likedCount})</span>
        )}
      </button>
      <button
        onClick={() => onReaction("disliked")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-colors text-sm",
          userReaction === "disliked"
            ? "bg-muted border-muted-foreground/30 text-muted-foreground"
            : "border-border text-muted-foreground hover:border-muted-foreground/50"
        )}
      >
        <span>دوست نداشتم</span>
        {dislikedCount > 0 && (
          <span className="text-xs opacity-70">({dislikedCount})</span>
        )}
      </button>
    </div>
  );
}
