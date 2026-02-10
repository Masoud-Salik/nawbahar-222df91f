import { useState } from "react";
import { Eye, MessageCircle, CornerDownLeft, CornerUpRight } from "lucide-react";
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
  return content.slice(0, maxChars).trim() + "...";
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
    <article className="bg-card rounded-2xl border border-border/40 overflow-hidden transition-all duration-200 hover:border-border hover:shadow-sm">
      {/* Response indicator */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-4 pt-3 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <CornerUpRight size={12} strokeWidth={1.5} />
          <span>پاسخ به: {parentArticle.title.slice(0, 40)}{parentArticle.title.length > 40 ? '...' : ''}</span>
        </Link>
      )}

      {/* Main Content Area */}
      <Link to={`/article/${article.id}`} className="block">
        {/* Title - centered, prominent */}
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-base font-bold text-foreground leading-8 line-clamp-2 text-center">
            {article.title}
          </h3>
        </div>

        {/* Cover Image - narrower with padding */}
        {article.cover_image_url && (
          <div className="px-5 pb-2">
            <div className="aspect-[2/1] overflow-hidden bg-muted rounded-xl relative">
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" />
              )}
              <img
                src={article.cover_image_url}
                alt=""
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                )}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </div>
        )}

        {/* Excerpt */}
        <div className="px-5 py-2">
          <p className="text-[13px] text-muted-foreground leading-7 line-clamp-2">
            {getExcerpt(article.content, 120)}
          </p>
        </div>
      </Link>

      {/* Author Row + Meta */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAuthorClick} 
            className="flex items-center gap-2 group"
            aria-label={`پروفایل ${article.author?.display_name}`}
          >
            {article.author?.avatar_url ? (
              <img
                src={article.author.avatar_url}
                alt=""
                className="w-6 h-6 rounded-full object-cover ring-1 ring-border group-hover:ring-primary/30 transition-all"
                loading="lazy"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <span className="text-primary text-[10px] font-bold">
                  {article.author?.display_name?.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
              {article.author?.display_name}
            </span>
          </button>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <span className="text-[11px] text-muted-foreground/70">
            {getRelativeTime(article.created_at)}
          </span>
        </div>

        <div onClick={(e) => e.preventDefault()}>
          <ArticleActionsMenu
            articleId={article.id}
            authorId={article.author_id}
            articleTitle={article.title}
          />
        </div>
      </div>

      {/* Bottom Interaction Bar - subtle divider */}
      <div className="border-t border-border/30 px-5 py-2.5 flex items-center gap-5">
        <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
          {calculateReadTime(article.content)}
        </span>
        
        <div className="flex items-center gap-1 text-muted-foreground/50">
          <Eye size={13} strokeWidth={1.5} />
          {formatCount(viewCount) && (
            <span className="text-[10px]">{viewCount}</span>
          )}
        </div>
        
        <button 
          onClick={handleCommentClick}
          className={cn(
            "flex items-center gap-1 transition-colors duration-200",
            showComments ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
          )}
          aria-label={`${comments.length} نظر`}
        >
          <MessageCircle size={13} strokeWidth={1.5} />
          {formatCount(comments.length) && (
            <span className="text-[10px]">{comments.length}</span>
          )}
        </button>
        
        <button 
          onClick={handleResponseClick}
          className="flex items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200"
          aria-label={`${responseCount} پاسخ`}
        >
          <CornerDownLeft size={13} strokeWidth={1.5} />
          {formatCount(responseCount) && (
            <span className="text-[10px]">{responseCount}</span>
          )}
        </button>
      </div>

      {/* Latest Comment Teaser - Facebook-style, separated from card */}
      {latestComment && !showComments && (
        <div className="bg-muted/30 border-t border-border/20 px-5 py-2.5">
          <p className="text-[12px] text-muted-foreground leading-5 line-clamp-1">
            <span className="font-medium text-foreground/80">{latestComment.author_name}</span>
            <span className="mx-1.5 text-muted-foreground/30">·</span>
            {latestComment.content}
          </p>
        </div>
      )}

      {/* Slide-down Comments Panel - visually separated */}
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
