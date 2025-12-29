import { Article } from "@/types";
import { ArticleCard } from "./ArticleCard";

interface ArticleFeedProps {
  articles: Article[];
}

export function ArticleFeed({ articles }: ArticleFeedProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No articles yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Be the first to share your thoughts with the community.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {articles.map((article, index) => (
        <div
          key={article.id}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <ArticleCard article={article} />
        </div>
      ))}
    </div>
  );
}
