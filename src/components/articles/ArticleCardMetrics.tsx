import { Eye, MessageCircle, Reply, CheckCheck, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleCardMetricsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
}

export function ArticleCardMetrics({
  viewCount,
  commentCount,
  responseCount,
  isRead,
  commentsOpen,
  onCommentClick,
  onResponseClick,
}: ArticleCardMetricsProps) {
  return (
    <div className="flex items-center justify-between mt-3">
      {/* Left: read indicator + tag-like info */}
      <div className="flex items-center gap-1.5">
        {isRead && (
          <CheckCheck size={14} strokeWidth={2.2} className="text-primary/50" />
        )}
      </div>

      {/* Right: Medium-style — bold rounded icons, darker, no borders */}
      <div className="flex items-center gap-4">
        {viewCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-foreground/35">
            <Eye size={16} strokeWidth={1.8} />
            <span>{viewCount}</span>
          </span>
        )}

        {responseCount > 0 && (
          <button
            onClick={onResponseClick}
            className="flex items-center gap-1 text-[11px] text-foreground/35 hover:text-foreground/60 transition-colors"
          >
            <Reply size={16} strokeWidth={1.8} />
            <span>{responseCount}</span>
          </button>
        )}

        <button
          onClick={onCommentClick}
          className={cn(
            "flex items-center gap-1 text-[11px] transition-colors",
            commentsOpen
              ? "text-foreground/65"
              : "text-foreground/35 hover:text-foreground/60"
          )}
        >
          <MessageCircle
            size={16}
            strokeWidth={1.8}
            className={cn(
              "transition-colors",
              commentsOpen && "fill-primary/20"
            )}
          />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="text-foreground/35 hover:text-foreground/60 transition-colors"
        >
          <Bookmark size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
