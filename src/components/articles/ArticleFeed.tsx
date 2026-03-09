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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-5 shadow-sm">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          هنوز مقاله‌ای نیست
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
          اولین نفری باشید که دیدگاه خود را به اشتراک می‌گذارد.
        </p>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} className="gap-2 rounded-xl text-sm border-primary/20 text-primary hover:bg-primary/5">
            <RefreshCw size={14} />
            بارگذاری مجدد
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto pb-20">
      {/* Warm greeting accent */}
      <div className="h-[3px] bg-gradient-to-l from-primary/60 via-accent/50 to-primary/20 rounded-b-full mx-4 sm:mx-0" />

      <div className="flex flex-col gap-0 sm:gap-3 sm:p-4">
        {articles.map((article, index) => (
          <div
            key={article.id}
            className="bg-card sm:rounded-2xl sm:border border-border/25 animate-fade-in overflow-hidden transition-all duration-300 hover:bg-card/90"
            style={{ animationDelay: `${Math.min(index * 25, 120)}ms` }}
          >
            <ArticleCard article={article} onDelete={onRefresh} />
          </div>
        ))}
      </div>

      {/* Card dividers with warm accent on mobile */}
      <style>{`
        @media (max-width: 639px) {
          .flex.flex-col.gap-0 > div + div {
            border-top: 1px solid hsl(var(--border) / 0.25);
          }
        }
      `}</style>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-primary/40" />
            <span className="text-[11px] text-muted-foreground/40">در حال بارگذاری...</span>
          </div>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-10">
          <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground/30">
            <span className="w-8 h-px bg-border/30" />
            پایان
            <span className="w-8 h-px bg-border/30" />
          </div>
        </div>
      )}
    </div>
  );
}
