import { useEffect, useRef, useCallback } from "react";
import type { FeedArticle } from "@/hooks/useArticles";
import { ArticleCard } from "./ArticleCard";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArticleFeedProps {
  articles: FeedArticle[];
  onRefresh?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ArticleFeed({ articles, onRefresh, hasMore, loadingMore, onLoadMore }: ArticleFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-5">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          هنوز مقاله‌ای نیست
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
          اولین نفری باشید که دیدگاه خود را به اشتراک می‌گذارد.
        </p>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} className="gap-2 rounded-lg text-sm">
            <RefreshCw size={14} />
            بارگذاری مجدد
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(index * 25, 120)}ms` }}
        >
          <ArticleCard article={article} onDelete={onRefresh} />
          {index < articles.length - 1 && (
            <div className="mx-5 border-b border-border" />
          )}
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-muted-foreground/40" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-8 text-[12px] text-muted-foreground/30">
          پایان مقالات
        </div>
      )}
    </div>
  );
}
