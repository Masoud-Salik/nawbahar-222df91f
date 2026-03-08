import { Eye, MessageCircle, CornerDownLeft, CheckCheck } from "lucide-react";
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
    <div className="flex items-center justify-between mt-4">
      {/* Left: read status */}
      <div className="flex items-center gap-1">
        {isRead && (
          <CheckCheck size={14} strokeWidth={1.8} className="text-primary/50" />
        )}
      </div>

      {/* Right: metrics row — minimal, filled icons, no borders */}
      <div className="flex items-center gap-5">
        {viewCount > 0 && (
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground/45">
            <Eye size={15} strokeWidth={1.5} className="fill-muted-foreground/15" />
            <span>{viewCount}</span>
          </span>
        )}

        {responseCount > 0 && (
          <button
            onClick={onResponseClick}
            className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground/45 hover:text-primary/60 transition-colors"
          >
            <CornerDownLeft size={15} strokeWidth={1.5} />
            <span>{responseCount}</span>
          </button>
        )}

        <button
          onClick={onCommentClick}
          className={cn(
            "flex items-center gap-1.5 text-[11.5px] transition-colors",
            commentsOpen
              ? "text-primary/70"
              : "text-muted-foreground/45 hover:text-primary/60"
          )}
        >
          <MessageCircle
            size={15}
            strokeWidth={1.5}
            className={cn(
              commentsOpen ? "fill-primary/20" : "fill-muted-foreground/10"
            )}
          />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>
    </div>
  );
}
