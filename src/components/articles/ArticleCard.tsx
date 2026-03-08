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
          /* --- Card WITH image: editorial magazine layout --- */
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
              {/* Main content: side-by-side image + text */}
              <div className="flex gap-0">
                {/* Text column — takes priority */}
                <div className="flex-1 min-w-0 p-3.5 pb-2.5 flex flex-col justify-between">
                  {/* Title */}
                  <h3 className="text-[14px] font-extrabold text-foreground leading-[1.8] line-clamp-2 tracking-tight">
                    {article.title}
                  </h3>
                  
                  {/* Excerpt */}
                  <p className="text-[11.5px] text-muted-foreground/60 leading-[1.9] line-clamp-2 mt-1.5">
                    {getExcerpt(article.content, 120)}
                  </p>
                  
                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-secondary/80 text-muted-foreground/50 px-1.5 py-0.5 rounded-full text-[9px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Image column — balanced square thumbnail */}
                <div className="w-[120px] flex-shrink-0 relative self-stretch">
                  {!imageLoaded && <div className="absolute inset-0 skeleton" />}
                  <img
                    src={article.cover_image_url!}
                    alt=""
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-500 saturate-[0.85] brightness-[0.97] contrast-[1.03]",
                      imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                  />
                  {/* Warm editorial tint */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-amber-900/[0.08] mix-blend-multiply" />
                  {/* Soft vignette */}
                  <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.1)]" />
                  
                  {/* Three-dot menu — top corner of image */}
                  <div className="absolute top-1.5 left-1.5 z-10" onClick={(e) => e.preventDefault()}>
                    <ArticleActionsMenu
                      articleId={article.id}
                      authorId={article.author_id}
                      articleTitle={article.title}
                    />
                  </div>
                </div>
              </div>
              
              {/* Author + meta + actions footer */}
              <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/10 bg-secondary/15">
                {/* Author */}
                <button onClick={handleAuthorClick} className="flex items-center gap-1.5 group/author min-w-0">
                  {article.author?.avatar_url ? (
                    <img src={article.author.avatar_url} alt="" className="w-4.5 h-4.5 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-4.5 h-4.5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-[7px] font-bold">{article.author?.display_name?.charAt(0)}</span>
                    </div>
                  )}
                  <span className="text-[10.5px] text-foreground/55 group-hover/author:text-primary transition-colors font-medium truncate max-w-[70px]">
                    {article.author?.display_name}
                  </span>
                  <span className="text-muted-foreground/20 text-[9px]">·</span>
                  <span className="text-[9.5px] text-muted-foreground/35">{getRelativeTime(article.created_at)}</span>
                  <span className="text-muted-foreground/20 text-[9px]">·</span>
                  <span className="text-[9.5px] text-muted-foreground/35">{calculateReadTime(article.content)}</span>
                </button>
                
                {/* Inline actions */}
                <div className="flex items-center gap-0.5">
                  {formatCount(viewCount) && (
                    <span className="flex items-center gap-0.5 text-muted-foreground/25 text-[9.5px] px-1">
                      <BarChart3 size={9} strokeWidth={1.5} />
                      {viewCount}
                    </span>
                  )}
                  {formatCount(responseCount) && (
                    <button 
                      onClick={handleResponseClick}
                      className="flex items-center gap-0.5 text-muted-foreground/25 hover:text-muted-foreground transition-colors px-1 py-1 text-[9.5px]"
                    >
                      <CornerDownLeft size={9} strokeWidth={1.5} />
                      <span>{responseCount}</span>
                    </button>
                  )}
                  <button 
                    onClick={handleCommentClick}
                    className={cn(
                      "flex items-center gap-0.5 transition-colors px-1 py-1 text-[9.5px]",
                      showComments 
                        ? "text-primary" 
                        : "text-muted-foreground/25 hover:text-muted-foreground"
                    )}
                  >
                    <MessageSquareText size={9} strokeWidth={1.5} />
                    {formatCount(comments.length) && (
                      <span>{comments.length}</span>
                    )}
                  </button>
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
