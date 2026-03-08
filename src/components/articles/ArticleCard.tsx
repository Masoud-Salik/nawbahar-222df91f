import { useState } from "react";
import { MessageSquareText, BarChart3, CornerUpRight, CornerDownLeft } from "lucide-react";
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

function getExcerpt(content: string, maxChars: number = 110): string {
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
  const hasCover = !!article.cover_image_url;

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

      <Link to={`/article/${article.id}`} className="block">
        {hasCover ? (
          /* --- Card WITH image: editorial poster --- */
          <div className="px-4 pt-4">
            <div className="rounded-2xl overflow-hidden relative bg-card"
              style={{
                boxShadow: `
                  inset 0 0 0 1px hsl(var(--primary) / 0.1),
                  0 1px 3px hsl(var(--primary) / 0.04),
                  0 4px 16px -4px hsl(var(--primary) / 0.06)
                `,
              }}
            >
              {/* Cover image */}
              <div className="aspect-[2.4/1] relative bg-muted/30">
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
                {/* Cinematic gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                
                {/* Three-dot menu — top left of image */}
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.preventDefault()}>
                  <ArticleActionsMenu
                    articleId={article.id}
                    authorId={article.author_id}
                    articleTitle={article.title}
                  />
                </div>
                
                {/* Title on image */}
                <div className="absolute bottom-0 right-0 left-0 px-4 pb-3">
                  <h3 className="text-[14px] font-bold text-white leading-[1.8] line-clamp-2 drop-shadow-md">
                    {article.title}
                  </h3>
                </div>
              </div>
              
              {/* Rich text body inside card */}
              <div className="px-4 py-3 bg-gradient-to-b from-card to-secondary/25">
                {/* Excerpt — 3 lines */}
                <p className="text-[12.5px] text-muted-foreground/70 leading-[2] line-clamp-3">
                  {getExcerpt(article.content, 180)}
                </p>
                
                {/* Tags row */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-secondary/80 text-muted-foreground/55 px-2 py-0.5 rounded-full text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Author + meta + actions */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/15">
                  {/* Author */}
                  <button onClick={handleAuthorClick} className="flex items-center gap-1.5 group/author min-w-0">
                    {article.author?.avatar_url ? (
                      <img src={article.author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" loading="lazy" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-[8px] font-bold">{article.author?.display_name?.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-[11px] text-foreground/60 group-hover/author:text-primary transition-colors font-medium truncate max-w-[75px]">
                      {article.author?.display_name}
                    </span>
                    <span className="text-muted-foreground/25 text-[10px]">·</span>
                    <span className="text-[10px] text-muted-foreground/35">{getRelativeTime(article.created_at)}</span>
                    <span className="text-muted-foreground/25 text-[10px]">·</span>
                    <span className="text-[10px] text-muted-foreground/35">{calculateReadTime(article.content)}</span>
                  </button>
                  
                  {/* Inline actions */}
                  <div className="flex items-center gap-0.5">
                    {formatCount(viewCount) && (
                      <span className="flex items-center gap-0.5 text-muted-foreground/28 text-[10px] px-1">
                        <BarChart3 size={9} strokeWidth={1.5} />
                        {viewCount}
                      </span>
                    )}
                    {formatCount(responseCount) && (
                      <button 
                        onClick={handleResponseClick}
                        className="flex items-center gap-0.5 text-muted-foreground/28 hover:text-muted-foreground transition-colors px-1 py-1 text-[10px]"
                      >
                        <CornerDownLeft size={10} strokeWidth={1.5} />
                        <span>{responseCount}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleCommentClick}
                      className={cn(
                        "flex items-center gap-0.5 transition-colors px-1 py-1 text-[10px]",
                        showComments 
                          ? "text-primary" 
                          : "text-muted-foreground/28 hover:text-muted-foreground"
                      )}
                    >
                      <MessageSquareText size={10} strokeWidth={1.5} />
                      {formatCount(comments.length) && (
                        <span>{comments.length}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- Card WITHOUT image: text-focused --- */
          <div className="px-4 pt-4">
            <div className="rounded-2xl bg-card px-4 py-3.5"
              style={{
                boxShadow: `
                  inset 0 0 0 1px hsl(var(--primary) / 0.08),
                  0 1px 3px hsl(var(--primary) / 0.03),
                  0 4px 12px -4px hsl(var(--primary) / 0.05)
                `,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-extrabold text-foreground leading-[1.7] line-clamp-2 tracking-tight">
                  {article.title}
                </h3>
                <div onClick={(e) => e.preventDefault()} className="flex-shrink-0 -mt-1">
                  <ArticleActionsMenu
                    articleId={article.id}
                    authorId={article.author_id}
                    articleTitle={article.title}
                  />
                </div>
              </div>
              <p className="text-[12.5px] text-muted-foreground/60 leading-[2] line-clamp-3 mt-1.5">
                {getExcerpt(article.content, 180)}
              </p>
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="bg-secondary/80 text-muted-foreground/55 px-2 py-0.5 rounded-full text-[10px]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/15">
                <button onClick={handleAuthorClick} className="flex items-center gap-1.5 group/author min-w-0">
                  {article.author?.avatar_url ? (
                    <img src={article.author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-[8px] font-bold">{article.author?.display_name?.charAt(0)}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-foreground/60 group-hover/author:text-primary transition-colors font-medium truncate max-w-[75px]">
                    {article.author?.display_name}
                  </span>
                  <span className="text-muted-foreground/25 text-[10px]">·</span>
                  <span className="text-[10px] text-muted-foreground/35">{getRelativeTime(article.created_at)}</span>
                  <span className="text-muted-foreground/25 text-[10px]">·</span>
                  <span className="text-[10px] text-muted-foreground/35">{calculateReadTime(article.content)}</span>
                </button>
                <div className="flex items-center gap-0.5">
                  {formatCount(viewCount) && (
                    <span className="flex items-center gap-0.5 text-muted-foreground/28 text-[10px] px-1">
                      <BarChart3 size={9} strokeWidth={1.5} />
                      {viewCount}
                    </span>
                  )}
                  <button 
                    onClick={handleCommentClick}
                    className={cn(
                      "flex items-center gap-0.5 transition-colors px-1 py-1 text-[10px]",
                      showComments ? "text-primary" : "text-muted-foreground/28 hover:text-muted-foreground"
                    )}
                  >
                    <MessageSquareText size={10} strokeWidth={1.5} />
                    {formatCount(comments.length) && <span>{comments.length}</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Link>

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
