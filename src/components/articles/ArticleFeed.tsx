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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          هنوز مقاله‌ای نیست
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
          اولین نفری باشید که دیدگاه خود را با جامعه به اشتراک می‌گذارد.
        </p>
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw size={16} />
            بارگذاری مجدد
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="py-3 space-y-3 px-3">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className="animate-slide-up"
          style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
        >
          <ArticleCard article={article} onDelete={onRefresh} />
        </div>
      ))}
    </div>
  );
}
