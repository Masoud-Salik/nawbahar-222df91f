import { useState } from "react";
import { MessageSquareText, BarChart3, CornerUpRight, CornerDownLeft, MoreHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { ArticleActionsMenu } from "./ArticleActionsMenu";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";
import { SlideDownComments } from "./SlideDownComments";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function calculateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} دقیقه`;
}

function getExcerpt(content: string, maxChars: number = 120): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim() + "…";
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const { comments, loading: commentsLoading, userId, addComment, deleteComment, refetch: refetchComments, submitting } = useComments(article.id);
  const { responseCount, parentArticle } = useResponseArticles(article.id);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const viewCount = (article as any).view_count || 0;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${article.author_id}`);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleResponseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/write?response_to=${article.id}`);
  };

  const formatCount = (count: number) => count > 0 ? count : null;

  return (
    <article className="group">
      {/* Response indicator */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-5 pt-3 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <CornerUpRight size={10} strokeWidth={1.5} className="text-primary/60" />
          <span>پاسخ به: {parentArticle.title.slice(0, 35)}{parentArticle.title.length > 35 ? '…' : ''}</span>
        </Link>
      )}

      {/* Author row — minimal */}
      <div className="px-5 pt-4 pb-2.5 flex items-center justify-between">
        <button 
          onClick={handleAuthorClick} 
          className="flex items-center gap-2 group/author min-w-0"
          aria-label={`پروفایل ${article.author?.display_name}`}
        >
          {article.author?.avatar_url ? (
            <img
              src={article.author.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-[8px] font-bold">
                {article.author?.display_name?.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] text-foreground/90 group-hover/author:text-primary transition-colors font-semibold truncate">
              {article.author?.display_name}
            </span>
            {article.author?.specialty && (
              <>
                <span className="text-muted-foreground/30 text-[9px]">·</span>
                <span className="text-[11px] text-muted-foreground/50 truncate">
                  {article.author.specialty}
                </span>
              </>
            )}
          </div>
        </button>
        <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
          <ArticleActionsMenu
            articleId={article.id}
            authorId={article.author_id}
            articleTitle={article.title}
          />
        </div>
      </div>

      {/* Content block */}
      <Link to={`/article/${article.id}`} className="block px-5">
        {/* Cover image — full width on top when present */}
        {article.cover_image_url && (
          <div className="w-full aspect-[2.4/1] rounded-lg overflow-hidden bg-muted/30 mb-3 relative">
            {!imageLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={article.cover_image_url}
              alt=""
              className={cn(
                "w-full h-full object-cover transition-opacity duration-500",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        )}

        {/* Title + excerpt */}
        <h3 className="text-[15px] font-extrabold text-foreground leading-[1.7] line-clamp-2 tracking-tight">
          {article.title}
        </h3>
        <p className="text-[13px] text-muted-foreground/65 leading-[1.8] line-clamp-2 mt-0.5">
          {getExcerpt(article.content, 120)}
        </p>
      </Link>

      {/* Footer — Medium style: meta left, actions right */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        {/* Left: date · read time · tag */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
          <span>{getRelativeTime(article.created_at)}</span>
          <span className="text-muted-foreground/20">·</span>
          <span>{calculateReadTime(article.content)}</span>
          {article.tags && article.tags.length > 0 && (
            <>
              <span className="text-muted-foreground/20">·</span>
              <span className="bg-secondary/80 text-secondary-foreground/70 px-2 py-px rounded-full text-[10px]">
                {article.tags[0]}
              </span>
            </>
          )}
          {formatCount(viewCount) && (
            <>
              <span className="text-muted-foreground/20">·</span>
              <span className="flex items-center gap-0.5">
                <BarChart3 size={10} strokeWidth={1.5} />
                {viewCount}
              </span>
            </>
          )}
        </div>

        {/* Right: comment + response */}
        <div className="flex items-center gap-1">
          {formatCount(responseCount) && (
            <button 
              onClick={handleResponseClick}
              className="flex items-center gap-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded-full px-1.5 py-1 text-[11px]"
              aria-label={`${responseCount} پاسخ`}
            >
              <CornerDownLeft size={13} strokeWidth={1.5} />
              <span className="text-[11px]">{responseCount}</span>
            </button>
          )}
          <button 
            onClick={handleCommentClick}
            className={cn(
              "flex items-center gap-1 transition-colors rounded-full px-1.5 py-1 text-[11px]",
              showComments 
                ? "text-primary" 
                : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
            aria-label={`${comments.length} نظر`}
          >
            <MessageSquareText size={13} strokeWidth={1.5} />
            {formatCount(comments.length) && (
              <span className="text-[11px]">{comments.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/30 mx-5">
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
