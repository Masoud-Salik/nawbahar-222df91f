import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star, CornerUpRight } from "lucide-react";
import { formatSolarShort } from "@/lib/solarHijri";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useComments } from "@/hooks/useComments";
import { useReactions } from "@/hooks/useReactions";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { useViewCount } from "@/hooks/useViewCount";
import { CommentSection } from "@/components/articles/CommentSection";
import { ArticleRatingModal } from "@/components/admin/ArticleRatingModal";
import { ArticleActionsMenu } from "@/components/articles/ArticleActionsMenu";
import { ArticleReactions } from "@/components/articles/ArticleReactions";
import { ArticleBottomSignals } from "@/components/articles/ArticleBottomSignals";
import { ResponseArticles } from "@/components/articles/ResponseArticles";
import { Button } from "@/components/ui/button";

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
  };
}

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { viewCount } = useViewCount(id || "");
  const { userReaction, likedCount, dislikedCount, setReaction } = useReactions(id || "");
  const { responses, responseCount, parentArticle } = useResponseArticles(id || "");

  const {
    comments,
    loading: commentsLoading,
    submitting,
    userId,
    addComment,
    deleteComment,
  } = useComments(id || "");

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  useEffect(() => {
    if (window.location.hash === "#comments" && !loading) {
      const commentsSection = document.getElementById("comments");
      if (commentsSection) {
        setTimeout(() => {
          commentsSection.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [loading]);

  const fetchArticle = async (articleId: string) => {
    setLoading(true);
    
    const { data: articleData, error: articleError } = await supabase
      .from("articles")
      .select("id, title, content, cover_image_url, tags, created_at, save_count, author_id, editorial_score_science, editorial_score_ethics, editorial_score_writing, editorial_score_timing, editorial_score_innovation")
      .eq("id", articleId)
      .eq("status", "published")
      .maybeSingle();

    if (articleError || !articleData) {
      navigate("/");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", articleData.author_id)
      .maybeSingle();

    const transformed: ArticleData = {
      id: articleData.id,
      title: articleData.title,
      content: articleData.content,
      cover_image_url: articleData.cover_image_url,
      tags: articleData.tags || [],
      created_at: articleData.created_at,
      save_count: articleData.save_count || 0,
      author_id: articleData.author_id,
      editorial_score_science: articleData.editorial_score_science || 0,
      editorial_score_ethics: articleData.editorial_score_ethics || 0,
      editorial_score_writing: articleData.editorial_score_writing || 0,
      editorial_score_timing: articleData.editorial_score_timing || 0,
      editorial_score_innovation: articleData.editorial_score_innovation || 0,
      author: profileData ? {
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
      } : undefined,
    };

    setArticle(transformed);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Minimal */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight size={22} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRatingModalOpen(true)}
                className="text-muted-foreground h-8 w-8"
              >
                <Star size={18} strokeWidth={1.5} />
              </Button>
            )}
            <ArticleActionsMenu 
              articleId={article.id} 
              authorId={article.author_id}
              articleTitle={article.title}
            />
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-screen-md mx-auto px-5 py-8 pb-24">
        {/* Response indicator */}
        {parentArticle && (
          <Link
            to={`/article/${parentArticle.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <CornerUpRight size={16} strokeWidth={1.5} />
            <span>در پاسخ به:</span>
            <span className="text-foreground">{parentArticle.title}</span>
          </Link>
        )}

        {/* Author - Simple, top section */}
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/profile/${article.author_id}`}>
            {article.author?.avatar_url ? (
              <img
                src={article.author.avatar_url}
                alt={article.author.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground font-medium">
                  {article.author?.display_name?.charAt(0)}
                </span>
              </div>
            )}
          </Link>
          <div>
            <Link 
              to={`/profile/${article.author_id}`} 
              className="font-medium text-foreground hover:underline"
            >
              {article.author?.display_name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {formatSolarShort(article.created_at)}
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground leading-relaxed mb-6">
          {article.title}
        </h1>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="rounded-xl overflow-hidden mb-8">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content - Improved typography */}
        <article className="article-content">
          <div className="text-foreground whitespace-pre-wrap">
            {article.content}
          </div>
        </article>

        {/* Reactions */}
        <ArticleReactions
          userReaction={userReaction}
          likedCount={likedCount}
          dislikedCount={dislikedCount}
          onReaction={setReaction}
        />

        {/* Bottom Signals */}
        <ArticleBottomSignals
          viewCount={viewCount}
          commentCount={comments.length}
          responseCount={responseCount}
        />

        {/* Response Articles */}
        <ResponseArticles responses={responses} />

        {/* Comments Section */}
        <div id="comments" className="mt-10 pt-8 border-t border-border">
          <CommentSection
            comments={comments}
            loading={commentsLoading}
            submitting={submitting}
            userId={userId}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
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
