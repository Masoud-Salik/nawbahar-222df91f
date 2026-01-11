import { Eye, MessageCircle, CornerDownLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { ArticleActionsMenu } from "./ArticleActionsMenu";
import { useUserRole } from "@/hooks/useUserRole";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function calculateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} دقیقه`;
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const { userId } = useUserRole();
  const { comments } = useComments(article.id);
  const { responseCount } = useResponseArticles(article.id);
  
  // Use view_count from article or default to 0
  const viewCount = (article as any).view_count || 0;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${article.author_id}`);
  };

  return (
    <article className="bg-card border-b border-border animate-fade-in">
      <Link to={`/article/${article.id}`} className="block">
        {/* Cover Image - Clean, full-width with fixed aspect ratio */}
        {article.cover_image_url && (
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-5">
          {/* Title */}
          <h3 className="text-lg font-bold text-foreground leading-8 mb-3 line-clamp-2">
            {article.title}
          </h3>

          {/* Author & Meta Row */}
          <div className="flex items-center justify-between mb-4">
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
                    <span className="text-muted-foreground text-xs">
                      {article.author?.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {article.author?.display_name}
                </span>
              </button>
            </div>

            {/* Three-dot menu */}
            <div onClick={(e) => e.preventDefault()}>
              <ArticleActionsMenu
                articleId={article.id}
                authorId={article.author_id}
                articleTitle={article.title}
              />
            </div>
          </div>

          {/* Stats Row - Subtle, neutral */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{calculateReadTime(article.content)}</span>
            <span className="opacity-30">|</span>
            <div className="flex items-center gap-1">
              <Eye size={14} strokeWidth={1.5} />
              <span>{viewCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={14} strokeWidth={1.5} />
              <span>{comments.length}</span>
            </div>
            {responseCount > 0 && (
              <div className="flex items-center gap-1">
                <CornerDownLeft size={14} strokeWidth={1.5} />
                <span>{responseCount}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
