import { MessageCircle, CheckCheck, CornerUpRight } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { REACTION_EMOJIS, type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";

interface ArticleCardMetricsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  tag?: string | null;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
  reactionSummary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
}

export function ArticleCardMetrics({
  commentCount,
  responseCount,
  isRead,
  commentsOpen,
  tag,
  onCommentClick,
  onResponseClick,
  reactionSummary,
  onReact,
}: ArticleCardMetricsProps) {
  const { topTypes, totalCount, reactorNames, userReaction } = reactionSummary;

  const buildReactorText = () => {
    if (totalCount === 0) return null;
    const names = [...reactorNames];
    if (userReaction) names.unshift("شما");
    const displayNames = names.slice(0, 2);
    const remaining = totalCount - displayNames.length;
    if (displayNames.length === 0 && remaining > 0) return `${toPersianNumber(remaining)} واکنش`;
    let text = displayNames.join(" و ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر دیگر`;
    return text;
  };

  const reactorText = buildReactorText();

  return (
    <div className="mt-3 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Comment button with count or label */}
          <button
            onClick={onCommentClick}
            className={cn(
              "flex items-center gap-1 text-[12px] transition-colors",
              commentsOpen
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle size={14} strokeWidth={1.5} />
            <span className="text-[11.5px]">
              {commentCount > 0 ? `${toPersianNumber(commentCount)} نظر` : "نظر"}
            </span>
          </button>

          {/* Response articles indicator */}
          {responseCount > 0 && (
            <button
              onClick={onResponseClick}
              className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CornerUpRight size={13} strokeWidth={1.5} />
              <span className="text-[11.5px]">{toPersianNumber(responseCount)}</span>
            </button>
          )}

          {/* Reaction picker */}
          <ReactionPicker userReaction={userReaction} onReact={onReact} />

          {/* Inline reaction summary: top emojis + names */}
          {totalCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center -space-x-0.5">
                {topTypes.slice(0, 2).map((type) => (
                  <span
                    key={type}
                    className="w-[18px] h-[18px] flex items-center justify-center rounded-full text-[12px] leading-none ring-[1.5px] ring-background"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    {REACTION_EMOJIS[type]}
                  </span>
                ))}
              </div>
              {reactorText && (
                <span className="text-[10.5px] text-muted-foreground/45 truncate max-w-[110px]">
                  {reactorText}
                </span>
              )}
            </div>
          )}

          {isRead && (
            <CheckCheck size={12} strokeWidth={2} className="text-primary/35" />
          )}
        </div>

        {tag && (
          <span className="text-muted-foreground/40 text-[10px]">{tag}</span>
        )}
      </div>
    </div>
  );
}
