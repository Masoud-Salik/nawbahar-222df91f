import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { LoadingScreen } from "@/components/LoadingScreen";
import { usePublishedArticles } from "@/hooks/useArticles";
import { SEOHead } from "@/components/SEOHead";

const Index = () => {
  const { articles, loading, loadingMore, hasMore, refetch, loadMore } = usePublishedArticles();

  return (
    <AppLayout>
      <SEOHead
        title="نوبهار"
        ogUrl="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "نوبهار",
          alternateName: "Nawbahar",
          url: "https://nawbahar.lovable.app",
          description: "پلتفرم انتشار محتوای تخصصی برای نخبگان ایرانی",
          inLanguage: "fa-IR",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://nawbahar.lovable.app/explore?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {loading ? (
        <LoadingScreen />
      ) : (
        <ArticleFeed 
          articles={articles} 
          onRefresh={refetch}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}
    </AppLayout>
  );
};

export default Index;
