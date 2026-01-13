import { useState } from "react";
import { Eye, MessageCircle, CornerDownLeft, CornerUpRight, MoreVertical } from "lucide-react";
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

function getExcerpt(content: string, lines: number = 3): string {
  const maxChars = lines * 55;
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim();
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const { comments, loading: commentsLoading, userId, addComment, deleteComment, refetch: refetchComments, submitting } = useComments(article.id);
  const { responseCount, parentArticle } = useResponseArticles(article.id);
  const { latestComment } = useLatestComment(article.id);
  const [showComments, setShowComments] = useState(false);
  const [interactedIcons, setInteractedIcons] = useState<Record<string, boolean>>({});
  
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
    setInteractedIcons(prev => ({ ...prev, comment: true }));
  };

  const handleResponseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/write?response_to=${article.id}`);
    setInteractedIcons(prev => ({ ...prev, response: true }));
  };

  // Format count - don't show 0
  const formatCount = (count: number) => count > 0 ? count : null;

  return (
    <article className="bg-card border-b border-border animate-fade-in">
      {/* Response indicator - if this is a response to another article */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-4 pt-3 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <CornerUpRight size={12} strokeWidth={1.5} />
          <span>پاسخ به: {parentArticle.title.slice(0, 40)}{parentArticle.title.length > 40 ? '...' : ''}</span>
        </Link>
      )}

      {/* Top Row: Author + Date + Menu */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleAuthorClick} className="flex items-center gap-2">
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.display_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-[10px] font-medium">
                    {article.author?.display_name?.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {article.author?.display_name}
              </span>
            </button>
            <span className="text-xs text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground">
              {getRelativeTime(article.created_at)}
            </span>
          </div>

          {/* Vertical three-dot menu */}
          <div onClick={(e) => e.preventDefault()}>
            <ArticleActionsMenu
              articleId={article.id}
              authorId={article.author_id}
              articleTitle={article.title}
            />
          </div>
        </div>
      </div>

      <Link to={`/article/${article.id}`} className="block">
        {/* Title - Clear, semibold, prominent */}
        <div className="px-4 pb-3">
          <h3 className="text-[15px] font-semibold text-foreground leading-7 line-clamp-2">
            {article.title}
          </h3>
        </div>

        {/* Cover Image - Slightly reduced height, soft corners */}
        {article.cover_image_url && (
          <div className="aspect-[16/9] overflow-hidden bg-muted mx-4 rounded-lg">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        {/* Excerpt - 3 lines on mobile with soft fade */}
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground leading-6 line-clamp-3 relative">
            {getExcerpt(article.content, 3)}
            <span className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </p>
        </div>
      </Link>

      {/* Bottom Interaction Bar */}
      <div className="px-4 pb-3 flex items-center gap-5">
        <span className="text-[11px] text-muted-foreground">
          {calculateReadTime(article.content)}
        </span>
        <span className="text-muted-foreground/30">·</span>
        
        {/* View count */}
        <div className={cn(
          "flex items-center gap-1 transition-colors duration-300",
          interactedIcons.view ? "text-primary" : "text-muted-foreground"
        )}>
          <Eye size={14} strokeWidth={1.5} />
          {formatCount(viewCount) && (
            <span className="text-[11px]">{viewCount}</span>
          )}
        </div>
        
        {/* Comment count - clickable */}
        <button 
          onClick={handleCommentClick}
          className={cn(
            "flex items-center gap-1 transition-colors duration-300",
            interactedIcons.comment ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle size={14} strokeWidth={1.5} />
          {formatCount(comments.length) && (
            <span className="text-[11px]">{comments.length}</span>
          )}
        </button>
        
        {/* Response count - clickable */}
        <button 
          onClick={handleResponseClick}
          className={cn(
            "flex items-center gap-1 transition-colors duration-300",
            interactedIcons.response ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CornerDownLeft size={14} strokeWidth={1.5} />
          {formatCount(responseCount) && (
            <span className="text-[11px]">{responseCount}</span>
          )}
        </button>
      </div>

      {/* Latest Comment Teaser */}
      {latestComment && !showComments && (
        <div className="px-4 pb-3">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <span className="font-medium text-foreground">{latestComment.author_name}:</span>
            <span className="text-muted-foreground mr-1 line-clamp-1">{latestComment.content}</span>
          </div>
        </div>
      )}

      {/* Slide-down Comments Panel */}
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
    </article>
  );
}
