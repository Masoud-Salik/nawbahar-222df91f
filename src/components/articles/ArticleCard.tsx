import { useState } from "react";
import { Eye, MessageCircle, CornerDownLeft, CornerUpRight, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { useLatestComment } from "@/hooks/useLatestComment";
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
  const { latestComment } = useLatestComment(article.id);
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
    <article className="group bg-card border-b border-border/40 last:border-b-0">
      {/* Response indicator */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-4 pt-3 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <CornerUpRight size={11} strokeWidth={1.5} className="text-primary/60" />
          <span>پاسخ به: {parentArticle.title.slice(0, 35)}{parentArticle.title.length > 35 ? '…' : ''}</span>
        </Link>
      )}

      {/* Author Row — compact */}
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <button 
          onClick={handleAuthorClick} 
          className="flex items-center gap-2 group/author"
          aria-label={`پروفایل ${article.author?.display_name}`}
        >
          {article.author?.avatar_url ? (
            <img
              src={article.author.avatar_url}
              alt=""
              className="w-7 h-7 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <span className="text-primary text-xs font-semibold">
                {article.author?.display_name?.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-foreground group-hover/author:text-primary transition-colors font-medium">
              {article.author?.display_name}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] text-muted-foreground/60">
              {getRelativeTime(article.created_at)}
            </span>
          </div>
        </button>
        <div onClick={(e) => e.preventDefault()}>
          <ArticleActionsMenu
            articleId={article.id}
            authorId={article.author_id}
            articleTitle={article.title}
          />
        </div>
      </div>

      {/* Content — Medium style: text left, thumbnail right */}
      <Link to={`/article/${article.id}`} className="block px-4 pb-2">
        <div className={cn("flex gap-4", article.cover_image_url ? "items-start" : "")}>
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-foreground leading-7 line-clamp-2 mb-1">
              {article.title}
            </h3>
            <p className="text-[13px] text-muted-foreground leading-6 line-clamp-2">
              {getExcerpt(article.content, 120)}
            </p>
          </div>

          {/* Thumbnail — small, on the left (visually right in RTL) */}
          {article.cover_image_url && (
            <div className="flex-shrink-0 w-[100px] h-[72px] rounded-lg overflow-hidden bg-muted/30 relative">
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
        </div>
      </Link>

      {/* Footer — clean, inline */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-muted-foreground/60">
            {calculateReadTime(article.content)}
          </span>
          {formatCount(viewCount) && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/60">
                <Eye size={11} strokeWidth={1.5} />
                {viewCount}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleCommentClick}
            className={cn(
              "flex items-center gap-1 transition-colors rounded-full px-2 py-1 text-[11px]",
              showComments 
                ? "text-primary bg-primary/5" 
                : "text-muted-foreground/50 hover:text-muted-foreground"
            )}
            aria-label={`${comments.length} نظر`}
          >
            <MessageCircle size={13} strokeWidth={1.5} />
            {formatCount(comments.length) && (
              <span className="font-medium">{comments.length}</span>
            )}
          </button>
          
          <button 
            onClick={handleResponseClick}
            className="flex items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded-full px-2 py-1 text-[11px]"
            aria-label={`${responseCount} پاسخ`}
          >
            <CornerDownLeft size={13} strokeWidth={1.5} />
            {formatCount(responseCount) && (
              <span className="font-medium">{responseCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Latest Comment Teaser */}
      {latestComment && !showComments && (
        <div 
          className="border-t border-border/20 px-4 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={handleCommentClick}
        >
          <p className="text-[11px] text-muted-foreground leading-5 line-clamp-1">
            <span className="font-medium text-foreground/70">{latestComment.author_name}:</span>
            <span className="mr-1 text-muted-foreground/60">{latestComment.content}</span>
          </p>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/30">
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
