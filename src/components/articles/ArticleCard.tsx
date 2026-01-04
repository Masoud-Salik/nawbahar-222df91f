import { Bookmark, Heart, BadgeCheck, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";
import { formatSolarShort } from "@/lib/solarHijri";
import { useArticleInteractions } from "@/hooks/useArticleInteractions";
import { ArticleMenu } from "./ArticleMenu";
import { useUserRole } from "@/hooks/useUserRole";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function getReputationRing(score: number): string {
  if (score > 80) return "ring-2 ring-yellow-500 ring-offset-2 ring-offset-card";
  if (score > 50) return "ring-2 ring-blue-500 ring-offset-2 ring-offset-card";
  return "ring-1 ring-border";
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const { isAdmin, userId } = useUserRole();
  const {
    isLiked,
    isBookmarked,
    likeCount,
    toggleLike,
    toggleBookmark,
  } = useArticleInteractions(article.id);

  const formatReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} دقیقه`;
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: `/article/${article.id}`,
      });
    }
  };

  const reputationScore = article.author?.reputation_score || 0;

  return (
    <article className="bg-card rounded-2xl border border-border/60 overflow-hidden animate-fade-in hover:shadow-md transition-all duration-300 relative">
      {/* Three dots menu */}
      <div className="absolute top-3 left-3 z-10">
        <ArticleMenu
          articleId={article.id}
          authorId={article.author_id}
          currentUserId={userId}
          isAdmin={isAdmin}
          onDelete={onDelete}
        />
      </div>

      <Link to={`/article/${article.id}`} className="block">
        {/* Title */}
        <div className="px-4 pt-4 pb-3 pl-12">
          <h3 className="text-lg font-semibold text-foreground leading-relaxed line-clamp-2">
            {article.title}
          </h3>
        </div>

        {/* Author with Reputation Ring */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-full", getReputationRing(reputationScore))}>
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {article.author?.display_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {article.author?.display_name}
                </span>
                {reputationScore > 80 && (
                  <BadgeCheck size={14} className="text-yellow-500 flex-shrink-0" />
                )}
                {reputationScore > 50 && reputationScore <= 80 && (
                  <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {article.author?.specialty}
              </span>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="px-4 pb-3">
            <div className="aspect-[16/9] rounded-xl overflow-hidden">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Excerpt */}
        <div className="px-4 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {article.content.substring(0, 150)}...
          </p>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta & Actions */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatSolarShort(article.created_at)}</span>
            <span>•</span>
            <span>{formatReadTime(article.content)}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* پسند (Like) */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm transition-all duration-200 group"
              title="پسند"
            >
              <Heart
                size={20}
                strokeWidth={1.5}
                fill={isLiked ? "currentColor" : "none"}
                className={cn(
                  "transition-transform duration-200 group-hover:scale-110",
                  isLiked ? "text-rose-500" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {likeCount > 0 && (
                <span className="text-muted-foreground">{likeCount}</span>
              )}
            </button>

            {/* ذخیره (Save) */}
            <button
              onClick={handleBookmark}
              className={cn(
                "transition-all duration-200",
                isBookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="ذخیره"
            >
              <Bookmark
                size={20}
                strokeWidth={1.5}
                fill={isBookmarked ? "currentColor" : "none"}
                className="transition-transform duration-200 hover:scale-110"
              />
            </button>

            {/* اشتراک (Share) */}
            <button
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground transition-all duration-200"
              title="اشتراک"
            >
              <Share2
                size={18}
                strokeWidth={1.5}
                className="transition-transform duration-200 hover:scale-110"
              />
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
