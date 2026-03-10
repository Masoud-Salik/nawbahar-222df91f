import { useState } from "react";
import { type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { cn, toPersianNumber } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { ReactionDetailsModal } from "./ReactionDetailsModal";
import { ReactionPicker } from "./ReactionPicker";

interface ArticleReactionsProps {
  articleId: string;
  summary: ReactionSummary;
  commentCount: number;
  onReact: (type: ReactionKey) => void;
  onCommentClick?: () => void;
}

export function ArticleReactions({ articleId, summary, commentCount, onReact, onCommentClick }: ArticleReactionsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { userReaction, totalCount, topTypes, reactorNames } = summary;

  const buildLabel = (): string | null => {
    if (totalCount === 0) return null;
    const names: string[] = [];
    if (userReaction) names.push("شما");
    reactorNames.forEach((n) => { if (!names.includes(n)) names.push(n); });
    if (names.length === 0) return `${toPersianNumber(totalCount)} نفر`;
    const shown = names.slice(0, 2);
    const remaining = Math.max(totalCount - shown.length, 0);
    let text = shown.join("، ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر دیگر`;
    return text;
  };

  const label = buildLabel();
  const hasReactions = totalCount > 0;

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasReactions) setShowDetails(true);
  };

  return (
    <>
      <div className="flex items-center justify-between py-4 my-6 border-t border-b border-border/30">
        <div className="flex items-center gap-4">
          {/* Comment */}
          <button
            onClick={onCommentClick}
            className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle size={14} strokeWidth={1.5} />
            <span className="text-[11.5px]">
              {commentCount > 0 ? `${toPersianNumber(commentCount)} نظر` : "نظر"}
            </span>
          </button>

          {/* Reaction picker — same as card */}
          <ReactionPicker
            userReaction={userReaction}
            onReact={onReact}
            topTypes={topTypes}
            summaryText={label || undefined}
            onSummaryClick={hasReactions ? handleSummaryClick : undefined}
          />
        </div>
      </div>

      <ReactionDetailsModal
        articleId={articleId}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}
