import type { FeedArticle } from "@/hooks/useArticles";
import { ArticleCard } from "./ArticleCard";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArticleFeedProps {
  articles: FeedArticle[];
  onRefresh?: () => void;
}

export function ArticleFeed({ articles, onRefresh }: ArticleFeedProps) {
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
    </div>
  );
}
