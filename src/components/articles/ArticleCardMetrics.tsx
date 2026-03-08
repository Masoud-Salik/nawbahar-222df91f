import { MessageCircle, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
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
  isRead,
  commentsOpen,
  tag,
  onCommentClick,
  reactionSummary,
  onReact,
}: ArticleCardMetricsProps) {
  const { types, totalCount, reactorNames, userReaction } = reactionSummary;

  const buildReactorText = () => {
    if (totalCount === 0) return null;
    const names = [...reactorNames];
    if (userReaction) names.unshift("شما");
    const displayNames = names.slice(0, 2);
    const remaining = totalCount - displayNames.length;
    if (displayNames.length === 0 && remaining > 0) return `${remaining} واکنش`;
    let text = displayNames.join(" و ");
    if (remaining > 0) text += ` و ${remaining} نفر دیگر`;
    return text;
  };

  const reactorText = buildReactorText();

  return (
    <div className="mt-3 pb-4">
      <div className="flex items-center justify-between">
        {/* Left: reaction picker + reaction summary + comment */}
        <div className="flex items-center gap-4">
          <ReactionPicker userReaction={userReaction} onReact={onReact} />

          {totalCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center -space-x-1.5">
                {types.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="w-[15px] h-[15px] flex items-center justify-center rounded-full text-[8px] leading-none ring-[1.5px] ring-background"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    {REACTION_EMOJIS[type]}
                  </span>
                ))}
              </div>
              {reactorText && (
                <span className="text-[10.5px] text-muted-foreground/50 truncate max-w-[120px]">
                  {reactorText}
                </span>
              )}
            </div>
          )}

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
            {commentCount > 0 && <span className="text-[11.5px]">{commentCount}</span>}
          </button>

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
