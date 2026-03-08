import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star, CornerUpRight, Share2 } from "lucide-react";
import { formatSolarShort } from "@/lib/solarHijri";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useComments } from "@/hooks/useComments";
import { useCardReactions } from "@/hooks/useCardReactions";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { useViewCount } from "@/hooks/useViewCount";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { CommentSection } from "@/components/articles/CommentSection";
import { ArticleRatingModal } from "@/components/admin/ArticleRatingModal";
import { ArticleActionsMenu } from "@/components/articles/ArticleActionsMenu";
import { ArticleReactions } from "@/components/articles/ArticleReactions";
import { ArticleBottomSignals } from "@/components/articles/ArticleBottomSignals";
import { ResponseArticles } from "@/components/articles/ResponseArticles";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import { useToast } from "@/hooks/use-toast";
import { toPersianNumber } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";

interface ArticleData {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  save_count: number;
  author_id: string;
  editorial_score_science: number;
  editorial_score_ethics: number;
  editorial_score_writing: number;
  editorial_score_timing: number;
  editorial_score_innovation: number;
  author?: {
    display_name: string;
    avatar_url: string | null;
    specialty: string | null;
  };
}

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { viewCount } = useViewCount(id || "");
  const { summary: reactionSummary, toggleReaction } = useCardReactions(id || "");
  const { responses, responseCount, parentArticle } = useResponseArticles(id || "");
  
  const contentLength = article?.content?.length || 0;
  useEngagementTracking(id || "", contentLength);

  const { comments, loading: commentsLoading, submitting, userId, addComment, deleteComment } = useComments(id || "");

  useEffect(() => {
    if (id) fetchArticle(id);
  }, [id]);

  useEffect(() => {
    if (window.location.hash === "#comments" && !loading) {
      const el = document.getElementById("comments");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loading]);

  const fetchArticle = async (articleId: string) => {
    setLoading(true);
    const { data: articleData, error } = await supabase
      .from("articles")
      .select("id, title, content, cover_image_url, tags, created_at, save_count, author_id, editorial_score_science, editorial_score_ethics, editorial_score_writing, editorial_score_timing, editorial_score_innovation")
      .eq("id", articleId)
      .eq("status", "published")
      .maybeSingle();

    if (error || !articleData) { navigate("/"); return; }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, specialty")
      .eq("id", articleData.author_id)
      .maybeSingle();

    setArticle({
      ...articleData,
      tags: articleData.tags || [],
      save_count: articleData.save_count || 0,
      editorial_score_science: articleData.editorial_score_science || 0,
      editorial_score_ethics: articleData.editorial_score_ethics || 0,
      editorial_score_writing: articleData.editorial_score_writing || 0,
      editorial_score_timing: articleData.editorial_score_timing || 0,
      editorial_score_innovation: articleData.editorial_score_innovation || 0,
      author: profileData ? {
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        specialty: profileData.specialty,
      } : undefined,
    });
    setLoading(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${id}`;
    if (navigator.share) {
      await navigator.share({ title: article?.title || "مقاله", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد ✅" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!article) return null;

  const readTime = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200));
  const articleDescription = article.content.replace(/\s+/g, " ").slice(0, 155).trim() + "…";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={article.title}
        description={articleDescription}
        ogUrl={`/article/${article.id}`}
        ogType="article"
        ogImage={article.cover_image_url || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: articleDescription,
          image: article.cover_image_url || undefined,
          datePublished: article.created_at,
          author: {
            "@type": "Person",
            name: article.author?.display_name,
          },
          publisher: {
            "@type": "Organization",
            name: "نوبهار",
            url: "https://nawbahar.lovable.app",
          },
          mainEntityOfPage: `https://nawbahar.lovable.app/article/${article.id}`,
          inLanguage: "fa-IR",
          wordCount: article.content.split(/\s+/).length,
          keywords: article.tags?.join(", "),
        }}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-11 max-w-screen-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={22} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={handleShare} className="p-2 text-muted-foreground/45 hover:text-foreground transition-colors">
              <Share2 size={18} strokeWidth={1.5} />
            </button>
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => setRatingModalOpen(true)} className="text-muted-foreground/45 h-8 w-8">
                <Star size={18} strokeWidth={1.5} />
              </Button>
            )}
            <ArticleActionsMenu articleId={article.id} authorId={article.author_id} articleTitle={article.title} />
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-screen-md mx-auto px-5 py-8 pb-24">
        {/* Response indicator */}
        {parentArticle && (
          <Link
            to={`/article/${parentArticle.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <CornerUpRight size={12} strokeWidth={1.5} className="text-primary/50" />
            <span>در پاسخ به:</span>
            <span className="text-foreground font-medium">{parentArticle.title.slice(0, 40)}{parentArticle.title.length > 40 ? "…" : ""}</span>
          </Link>
        )}

        {/* Author Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Link to={`/profile/${article.author_id}`}>
              {article.author?.avatar_url ? (
                <img src={article.author.avatar_url} alt={article.author.display_name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{article.author?.display_name?.charAt(0)}</span>
                </div>
              )}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/profile/${article.author_id}`} className="text-[13px] font-medium text-foreground hover:underline">
                  {article.author?.display_name}
                </Link>
                {user?.id !== article.author_id && <FollowButton userId={article.author_id} />}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 mt-0.5">
                <span>{formatSolarShort(article.created_at)}</span>
                <span className="text-muted-foreground/20">·</span>
                <span>{toPersianNumber(readTime)} دقیقه مطالعه</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-extrabold text-foreground leading-[1.7] mb-5">{article.title}</h1>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="rounded-lg overflow-hidden mb-8">
            <img src={article.cover_image_url} alt={article.title} className="w-full object-cover" loading="lazy" />
          </div>
        )}

        {/* Content */}
        <article className="article-content">
          <div className="text-foreground whitespace-pre-wrap leading-[2.2] text-[15px]">{article.content}</div>
        </article>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-8">
            {article.tags.map(tag => (
              <Link
                key={tag}
                to={`/explore?tag=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 bg-muted/50 text-muted-foreground/60 rounded-full text-[11px] hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Reactions */}
        <ArticleReactions articleId={article.id} summary={reactionSummary} onReact={toggleReaction} />

        {/* Bottom Signals */}
        <ArticleBottomSignals viewCount={viewCount} commentCount={comments.length} responseCount={responseCount} />

        {/* Response Articles */}
        <ResponseArticles responses={responses} />

        {/* Related Articles */}
        <RelatedArticles articleId={article.id} tags={article.tags} authorId={article.author_id} />

        {/* Comments Section */}
        <div id="comments" className="mt-10 pt-8 border-t border-border/50">
          <CommentSection
            comments={comments}
            loading={commentsLoading}
            submitting={submitting}
            userId={userId}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            responses={responses}
          />
        </div>
      </main>

      {/* Admin Rating Modal */}
      {article && (
        <ArticleRatingModal
          articleId={article.id}
          authorId={article.author_id}
          open={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          currentScores={{
            science: article.editorial_score_science,
            ethics: article.editorial_score_ethics,
            writing: article.editorial_score_writing,
            timing: article.editorial_score_timing,
            innovation: article.editorial_score_innovation,
          }}
        />
      )}
    </div>
  );
};

export default Article;
