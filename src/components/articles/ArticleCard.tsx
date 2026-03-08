import { useState } from "react";
import { MessageSquareText, Bookmark, Share2, BarChart3, CornerUpRight, CornerDownLeft } from "lucide-react";
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
  return `${minutes} دقیقه مطالعه`;
}

function getExcerpt(content: string, maxChars: number = 140): string {
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

      {/* Author Row — compact with specialty */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <button 
          onClick={handleAuthorClick} 
          className="flex items-center gap-2.5 group/author min-w-0"
          aria-label={`پروفایل ${article.author?.display_name}`}
        >
          {article.author?.avatar_url ? (
            <img
              src={article.author.avatar_url}
              alt=""
              className="w-[22px] h-[22px] rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-[22px] h-[22px] rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-[9px] font-bold">
                {article.author?.display_name?.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[12px] text-foreground/80 group-hover/author:text-primary transition-colors font-semibold truncate">
              {article.author?.display_name}
            </span>
            {article.author?.specialty && (
              <>
                <span className="text-muted-foreground/25 text-[10px]">در</span>
                <span className="text-[10px] text-muted-foreground/50 truncate">
                  {article.author.specialty}
                </span>
              </>
            )}
            <span className="text-muted-foreground/25">·</span>
            <span className="text-[10px] text-muted-foreground/40 flex-shrink-0">
              {getRelativeTime(article.created_at)}
            </span>
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

      {/* Content — title + excerpt + thumbnail */}
      <Link to={`/article/${article.id}`} className="block px-5 pb-3">
        <div className={cn("flex gap-5", article.cover_image_url ? "items-start" : "")}>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-extrabold text-foreground leading-[1.7] line-clamp-2 mb-0.5 tracking-tight">
              {article.title}
            </h3>
            <p className="text-[13px] text-muted-foreground/70 leading-[1.8] line-clamp-2">
              {getExcerpt(article.content, 140)}
            </p>
          </div>

          {article.cover_image_url && (
            <div className="flex-shrink-0 w-[112px] h-[75px] rounded-md overflow-hidden bg-muted/20 relative">
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

      {/* Footer — Medium-style: tags + read time left, actions right */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* First tag as pill */}
          {article.tags && article.tags.length > 0 && (
            <span className="text-[10px] bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">
              {article.tags[0]}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/45">
            {calculateReadTime(article.content)}
          </span>
          {formatCount(viewCount) && (
            <>
              <span className="text-muted-foreground/20">·</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40">
                <BarChart3 size={11} strokeWidth={1.5} />
                {viewCount}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button 
            onClick={handleCommentClick}
            className={cn(
              "flex items-center gap-1 transition-colors rounded-full px-2 py-1.5 text-[11px]",
              showComments 
                ? "text-primary bg-primary/5" 
                : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
            aria-label={`${comments.length} نظر`}
          >
            <MessageSquareText size={14} strokeWidth={1.5} />
            {formatCount(comments.length) && (
              <span className="font-medium text-[11px]">{comments.length}</span>
            )}
          </button>
          
          <button 
            onClick={handleResponseClick}
            className="flex items-center gap-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded-full px-2 py-1.5 text-[11px]"
            aria-label={`${responseCount} پاسخ`}
          >
            <CornerDownLeft size={14} strokeWidth={1.5} />
            {formatCount(responseCount) && (
              <span className="font-medium text-[11px]">{responseCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Latest Comment Teaser */}
      {latestComment && !showComments && (
        <div 
          className="border-t border-border/15 mx-5 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={handleCommentClick}
        >
          <p className="text-[11px] text-muted-foreground leading-5 line-clamp-1">
            <span className="font-semibold text-foreground/60">{latestComment.author_name}</span>
            <span className="mr-1.5 text-muted-foreground/50">{latestComment.content}</span>
          </p>
        </div>
      )}

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
