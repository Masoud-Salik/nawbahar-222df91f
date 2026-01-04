import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryPills } from "@/components/articles/CategoryPills";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { usePublishedArticles } from "@/hooks/useArticles";

const Index = () => {
  const { articles, loading, refetch } = usePublishedArticles();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredArticles = useMemo(() => {
    if (activeCategory === "all") {
      return articles;
    }
    return articles.filter((article) => 
      article.tags?.some((tag) => 
        tag.toLowerCase() === activeCategory.toLowerCase()
      )
    );
  }, [articles, activeCategory]);

  return (
    <AppLayout>
      <CategoryPills onCategoryChange={setActiveCategory} />
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <ArticleFeed articles={filteredArticles} onRefresh={refetch} />
      )}
    </AppLayout>
  );
};

export default Index;
