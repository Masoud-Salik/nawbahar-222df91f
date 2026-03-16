import { useState, useMemo, useCallback } from "react";
import { CornerUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useCardReactions } from "@/hooks/useCardReactions";
import { ArticleActionsMenu } from "./ArticleActionsMenu";

import { cn } from "@/lib/utils";
import { SlideDownComments } from "./SlideDownComments";
import { formatSolarShort } from "@/lib/solarHijri";
import { ArticleCardMetrics } from "./ArticleCardMetrics";
import defaultCover from "@/assets/default-cover.jpg";
import { storage } from "@/lib/storage";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function getExcerpt(content: string, maxChars: number = 110): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim() + "…";
}

function isArticleRead(articleId: string): boolean {
  return storage.get(`article_viewed_${articleId}`, null) !== null;
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Lazy-load comments only when panel is opened
  const {
    comments,
    loading: commentsLoading,
    userId,
    addComment,
    deleteComment,
    refetch: refetchComments,
    submitting,
  } = useComments(article.id, { lazy: !showComments });

  // Lazy reactions — no fetch on mount, uses article.reaction_count for display
  const { summary: reactionSummary, toggleReaction, ensureFetched } = useCardReactions(article.id, false);

  const viewCount = article.view_count || 0;
  const coverImage = article.cover_image_url || defaultCover;
  const hasBeenRead = useMemo(() => isArticleRead(article.id), [article.id]);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${article.author_id}`);
  };

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(prev => !prev);
  }, []);

  const handleResponseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/write?response_to=${article.id}`);
  };

  return (
    <article className="group" aria-label={article.title}>
      {article.parent_title && article.parent_article_id && (
        <Link
          to={`/article/${article.parent_article_id}`}
          className="flex items-center gap-1.5 px-5 pt-3 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
        >
          <CornerUpRight size={10} strokeWidth={1.5} className="text-primary/40" />
          <span>
            پاسخ به: {article.parent_title.slice(0, 35)}
            {article.parent_title.length > 35 ? "…" : ""}
          </span>
        </Link>
      )}

      <Link to={`/article/${article.id}`} className="block px-5 pt-5 pb-1">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 group/author min-w-0">
            <button onClick={handleAuthorClick} className="flex items-center gap-1.5 min-w-0" aria-label={`View ${article.author?.display_name}'s profile`}>
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author?.display_name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-[8px] font-bold">{article.author?.display_name?.charAt(0)}</span>
                </div>
              )}
              <span className="text-[11.5px] text-foreground/60 group-hover/author:text-primary transition-colors font-medium truncate max-w-[80px]">
                {article.author?.display_name}
              </span>
            </button>
            <span className="text-muted-foreground/20 text-[10px]">·</span>
            <span className="text-[10.5px] text-muted-foreground/50 font-normal">{formatSolarShort(article.created_at)}</span>
          </div>

          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex-shrink-0">
            <ArticleActionsMenu articleId={article.id} authorId={article.author_id} articleTitle={article.title} onDelete={onDelete} />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-[16px] font-extrabold text-foreground leading-[1.75] line-clamp-3 transition-colors",
                hasBeenRead && "text-muted-foreground/65"
              )}
            >
              {article.title}
            </h3>
            <p className="text-[13px] text-muted-foreground/55 leading-[1.8] line-clamp-3 mt-1.5">
              {getExcerpt(article.content, 150)}
            </p>
          </div>
          <div
            className={cn(
              "w-[112px] h-[75px] flex-shrink-0 rounded overflow-hidden relative bg-muted/15 self-start mt-1 transition-all duration-300",
              hasBeenRead && "opacity-50 saturate-[0.3] blur-[0.5px]"
            )}
          >
            {!imageLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={coverImage}
              alt=""
              className={cn("w-full h-full object-cover transition-opacity duration-500", imageLoaded ? "opacity-100" : "opacity-0")}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>

        <ArticleCardMetrics
          articleId={article.id}
          viewCount={viewCount}
          commentCount={article.comment_count}
          reactionCount={article.reaction_count}
          responseCount={0}
          isRead={hasBeenRead}
          commentsOpen={showComments}
          onCommentClick={handleCommentClick}
          onResponseClick={handleResponseClick}
          reactionSummary={reactionSummary}
          onReact={(type) => { toggleReaction(type); }}
          onReactionHover={ensureFetched}
        />
      </Link>

      {showComments && (
        <div className="border-t border-border/20 mx-5">
          <SlideDownComments
            isOpen={showComments}
            articleId={article.id}
            comments={comments}
            loading={commentsLoading}
            submitting={submitting}
            userId={userId}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onClose={() => setShowComments(false)}
            refetch={refetchComments}
          />
        </div>
      )}
    </article>
  );
}
