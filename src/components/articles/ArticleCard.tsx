import { useState, useMemo } from "react";
import { MessageCircle, Eye, CornerDownLeft, CornerUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { ArticleActionsMenu } from "./ArticleActionsMenu";
import { cn } from "@/lib/utils";
import { SlideDownComments } from "./SlideDownComments";
import { formatSolarShort } from "@/lib/solarHijri";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function calculateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} دقیقه`;
}

function getExcerpt(content: string, maxChars: number = 110): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim() + "…";
}

function isArticleRead(articleId: string): boolean {
  try {
    return localStorage.getItem(`article_viewed_${articleId}`) !== null;
  } catch {
    return false;
  }
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const { comments, loading: commentsLoading, userId, addComment, deleteComment, refetch: refetchComments, submitting } = useComments(article.id);
  const { responseCount, parentArticle } = useResponseArticles(article.id);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const viewCount = (article as any).view_count || 0;
  const hasCover = !!article.cover_image_url;
  const hasBeenRead = useMemo(() => isArticleRead(article.id), [article.id]);

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

  return (
    <article className="group">
      {/* Response indicator */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-5 pt-3 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
        >
          <CornerUpRight size={10} strokeWidth={1.5} className="text-primary/40" />
          <span>پاسخ به: {parentArticle.title.slice(0, 35)}{parentArticle.title.length > 35 ? '…' : ''}</span>
        </Link>
      )}

      <Link to={`/article/${article.id}`} className="block px-5 pt-5 pb-1">
        {/* Author row with date */}
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={handleAuthorClick} className="flex items-center gap-1.5 group/author min-w-0">
            {article.author?.avatar_url ? (
              <img src={article.author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" loading="lazy" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-[8px] font-bold">{article.author?.display_name?.charAt(0)}</span>
              </div>
            )}
            <span className="text-[11.5px] text-foreground/55 group-hover/author:text-primary transition-colors font-medium truncate max-w-[80px]">
              {article.author?.display_name}
            </span>
            <span className="text-muted-foreground/20 text-[10px]">·</span>
            <span className="text-[10.5px] text-muted-foreground/35 font-normal">
              {formatSolarShort(article.created_at)}
            </span>
          </button>
          <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
            <ArticleActionsMenu
              articleId={article.id}
              authorId={article.author_id}
              articleTitle={article.title}
            />
          </div>
        </div>

        {/* Content */}
        {hasCover ? (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "text-[16px] font-extrabold text-foreground leading-[1.75] line-clamp-3 transition-colors",
                hasBeenRead && "text-muted-foreground/60"
              )}>
                {article.title}
              </h3>
              <p className="text-[13px] text-muted-foreground/40 leading-[1.8] line-clamp-3 mt-1.5">
                {getExcerpt(article.content, 150)}
              </p>
            </div>
            <div className={cn(
              "w-[112px] h-[75px] flex-shrink-0 rounded overflow-hidden relative bg-muted/15 self-start mt-1 transition-all",
              hasBeenRead && "opacity-50 saturate-[0.3]"
            )}>
              {!imageLoaded && <div className="absolute inset-0 skeleton" />}
              <img
                src={article.cover_image_url!}
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
          </div>
        ) : (
          <div>
            <h3 className={cn(
              "text-[16px] font-extrabold text-foreground leading-[1.75] line-clamp-3 transition-colors",
              hasBeenRead && "text-muted-foreground/60"
            )}>
              {article.title}
            </h3>
            <p className="text-[13px] text-muted-foreground/40 leading-[1.8] line-clamp-3 mt-1.5">
              {getExcerpt(article.content, 200)}
            </p>
          </div>
        )}

        {/* Footer — balanced & elegant */}
        <div className="flex items-center justify-between mt-4 pb-1">
          {/* Left: tag + read time */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/35">
            {article.tags && article.tags.length > 0 && (
              <span className="bg-secondary/50 text-muted-foreground/45 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                {article.tags[0]}
              </span>
            )}
            <span>{calculateReadTime(article.content)}</span>
          </div>
          
          {/* Right: interaction icons — evenly spaced, subtle */}
          <div className="flex items-center gap-4">
            {viewCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground/25 text-[11px]">
                <Eye size={14} strokeWidth={1.3} />
                <span>{viewCount}</span>
              </span>
            )}
            {responseCount > 0 && (
              <button 
                onClick={handleResponseClick}
                className="flex items-center gap-1 text-muted-foreground/25 hover:text-primary/50 transition-colors text-[11px]"
              >
                <CornerDownLeft size={14} strokeWidth={1.3} />
                <span>{responseCount}</span>
              </button>
            )}
            <button 
              onClick={handleCommentClick}
              className={cn(
                "flex items-center gap-1 transition-colors text-[11px]",
                showComments 
                  ? "text-primary/60" 
                  : "text-muted-foreground/25 hover:text-primary/50"
              )}
            >
              <MessageCircle size={14} strokeWidth={1.3} />
              {comments.length > 0 && <span>{comments.length}</span>}
            </button>
          </div>
        </div>
      </Link>

      {/* Comments */}
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