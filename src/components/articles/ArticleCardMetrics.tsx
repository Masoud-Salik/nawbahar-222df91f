import { Eye, MessageCircle, Reply, CheckCheck, Bookmark, ThumbsDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleCardMetricsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  tag?: string | null;
  latestCommentSnippet?: string | null;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
}

export function ArticleCardMetrics({
  viewCount,
  commentCount,
  responseCount,
  isRead,
  commentsOpen,
  tag,
  latestCommentSnippet,
  onCommentClick,
  onResponseClick,
}: ArticleCardMetricsProps) {
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Main metrics row */}
      <div className="flex items-center justify-between">
        {/* Left side: tag + comment snippet */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
          {tag && (
            <span className="bg-secondary/60 text-muted-foreground/55 px-2.5 py-[3px] rounded-full text-[10px] font-medium whitespace-nowrap flex-shrink-0">
              {tag}
            </span>
          )}
          {latestCommentSnippet && !commentsOpen && (
            <button
              onClick={onCommentClick}
              className="text-[10.5px] text-muted-foreground/40 truncate min-w-0 hover:text-muted-foreground/60 transition-colors"
            >
              💬 {latestCommentSnippet}
            </button>
          )}
        </div>

        {/* Right side: icons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isRead && (
            <CheckCheck size={14} strokeWidth={2.2} className="text-primary/50" />
          )}

          {viewCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-foreground/40">
              <Eye size={15} strokeWidth={1.8} />
              <span>{viewCount}</span>
            </span>
          )}

          <button
            onClick={onResponseClick}
            className="flex items-center gap-0.5 text-[11px] text-foreground/40 hover:text-foreground/65 transition-colors"
          >
            <Reply size={15} strokeWidth={1.8} />
            {responseCount > 0 && <span>{responseCount}</span>}
          </button>

          <button
            onClick={onCommentClick}
            className={cn(
              "flex items-center gap-0.5 text-[11px] transition-colors",
              commentsOpen
                ? "text-foreground/65"
                : "text-foreground/40 hover:text-foreground/65"
            )}
          >
            <MessageCircle
              size={15}
              strokeWidth={1.8}
              className={cn(commentsOpen && "fill-primary/20")}
            />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          <button
            onClick={stop}
            className="text-foreground/40 hover:text-foreground/65 transition-colors"
          >
            <ThumbsDown size={14} strokeWidth={1.8} />
          </button>

          <button
            onClick={stop}
            className="text-foreground/40 hover:text-foreground/65 transition-colors"
          >
            <Bookmark size={14} strokeWidth={1.8} />
          </button>

          <button
            onClick={stop}
            className="text-foreground/40 hover:text-foreground/65 transition-colors"
          >
            <MoreHorizontal size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
