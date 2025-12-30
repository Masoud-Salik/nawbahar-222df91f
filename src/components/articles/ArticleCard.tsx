import { Bookmark, Heart, BadgeCheck, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Article } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatSolarShort } from "@/lib/solarHijri";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(article.is_bookmarked || false);
  const [isLiked, setIsLiked] = useState(article.is_liked || false);
  const [likeCount, setLikeCount] = useState(article.save_count || 0);

  const formatReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} دقیقه`;
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
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

  return (
    <article className="bg-card rounded-2xl border border-border/60 overflow-hidden animate-fade-in hover:shadow-md transition-all duration-300">
      <Link to={`/article/${article.id}`} className="block">
        {/* Title */}
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-lg font-semibold text-foreground leading-snug line-clamp-2">
            {article.title}
          </h3>
        </div>

        {/* Author */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            {article.author?.avatar_url && (
              <img
                src={article.author.avatar_url}
                alt={article.author.display_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {article.author?.display_name}
                </span>
                <BadgeCheck size={14} className="text-primary flex-shrink-0" />
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
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.content.substring(0, 150)}...
          </p>
        </div>

        {/* Meta & Actions */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatSolarShort(article.created_at)}</span>
            <span>•</span>
            <span>{formatReadTime(article.content)}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* پسند (Like) - Paisley-style Heart */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-all duration-200",
                isLiked ? "text-rose-500" : "text-muted-foreground hover:text-foreground"
              )}
              title="پسند"
            >
              <Heart
                size={20}
                strokeWidth={1.5}
                fill={isLiked ? "currentColor" : "none"}
                className="transition-transform duration-200 hover:scale-110"
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* ذخیره (Save) - Bookmark Ribbon */}
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
