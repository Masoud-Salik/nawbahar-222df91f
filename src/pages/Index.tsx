import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryPills } from "@/components/articles/CategoryPills";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { mockArticles } from "@/types";

const Index = () => {
  return (
    <AppLayout>
      <CategoryPills />
      <ArticleFeed articles={mockArticles} />
    </AppLayout>
  );
};

export default Index;
