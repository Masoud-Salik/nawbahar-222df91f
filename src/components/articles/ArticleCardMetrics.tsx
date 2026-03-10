import { MessageCircle, CheckCheck } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionDetailsModal } from "./ReactionDetailsModal";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { useState } from "react";

interface ArticleCardMetricsProps {
  articleId: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
  reactionSummary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
  onReactionHover?: () => void;
}

export function ArticleCardMetrics({
  articleId,
  commentCount,
  reactionCount,
  isRead,
  commentsOpen,
  onCommentClick,
  reactionSummary,
  onReact,
  onReactionHover,
}: ArticleCardMetricsProps) {
  const { totalCount, reactorNames, userReaction } = reactionSummary;
  const [showReactionDetails, setShowReactionDetails] = useState(false);

  const displayCount = totalCount > 0 ? totalCount : reactionCount;

  const buildReactionLabel = (): string | null => {
    if (displayCount === 0) return null;

    // Before fetch completes, show count from article data
    if (totalCount === 0 && reactionCount > 0) {
      return `${toPersianNumber(reactionCount)} واکنش`;
    }

    const names: string[] = [];
    if (userReaction) names.push("شما");
    reactorNames.forEach((n) => {
      if (!names.includes(n)) names.push(n);
    });

    if (names.length === 0) return `${toPersianNumber(displayCount)} واکنش`;

    const shown = names.slice(0, 2);
    const remaining = Math.max(displayCount - shown.length, 0);

    let text = shown.join("، ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر دیگر`;
    return text;
  };

  const reactionText = buildReactionLabel();
  const hasReactions = displayCount > 0;

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasReactions) {
      onReactionHover?.();
      setShowReactionDetails(true);
    }
  };

  return (
    <>
      <div className="mt-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onCommentClick}
              className={cn(
                "flex items-center gap-1 text-[12px] transition-colors",
                commentsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle size={14} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-[11.5px]">
                {commentCount > 0 ? `${toPersianNumber(commentCount)} نظر` : "نظر"}
              </span>
            </button>

            <ReactionPicker
              userReaction={userReaction}
              onReact={onReact}
              onHover={onReactionHover}
              topTypes={reactionSummary.topTypes}
              summaryText={reactionText || undefined}
              onSummaryClick={hasReactions ? handleSummaryClick : undefined}
            />
          </div>

          {isRead && <CheckCheck size={12} strokeWidth={2} className="text-primary/35" aria-label="خوانده شده" />}
        </div>
      </div>

      <ReactionDetailsModal
        articleId={articleId}
        isOpen={showReactionDetails}
        onClose={() => setShowReactionDetails(false)}
      />
    </>
  );
}
