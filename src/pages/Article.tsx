import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Heart, Bookmark, Share2, BadgeCheck, Star } from "lucide-react";
import { formatSolarShort } from "@/lib/solarHijri";
import { cn } from "@/lib/utils";
import { useArticleInteractions } from "@/hooks/useArticleInteractions";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { CommentSection } from "@/components/articles/CommentSection";
import { ArticleRatingModal } from "@/components/admin/ArticleRatingModal";
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
    specialty: string | null;
    reputation_score: number;
  };
}

function getReputationRing(score: number): string {
  if (score > 80) return "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background";
  if (score > 50) return "ring-2 ring-blue-500 ring-offset-2 ring-offset-background";
  return "ring-1 ring-border";
}

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const {
    isLiked,
    isBookmarked,
    likeCount,
    toggleLike,
    toggleBookmark,
  } = useArticleInteractions(id || "");

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

  const fetchArticle = async (articleId: string) => {
    setLoading(true);
    
    // First fetch the article with all scores
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

    // Then fetch the author profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, specialty, reputation_score")
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
        specialty: profileData.specialty,
        reputation_score: profileData.reputation_score || 0,
      } : undefined,
    };

    setArticle(transformed);
    setLoading(false);
  };

  const formatReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} دقیقه مطالعه`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href,
      });
    }
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

  const reputationScore = article.author?.reputation_score || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight size={24} />
          </button>
          <div className="flex items-center gap-2">
            {/* Admin Rating Button */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRatingModalOpen(true)}
                className="text-primary"
              >
                <Star size={20} />
              </Button>
            )}
            <button
              onClick={toggleLike}
              className="flex items-center gap-1.5 p-2 transition-colors"
            >
              <Heart
                size={22}
                fill={isLiked ? "currentColor" : "none"}
                className={cn(isLiked ? "text-rose-500" : "text-muted-foreground hover:text-foreground")}
              />
              {likeCount > 0 && (
                <span className="text-sm text-muted-foreground">{likeCount}</span>
              )}
            </button>
            <button
              onClick={toggleBookmark}
              className="p-2 transition-colors"
            >
              <Bookmark
                size={22}
                fill={isBookmarked ? "currentColor" : "none"}
                className={cn(isBookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-screen-md mx-auto px-4 py-6 pb-20">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground leading-relaxed mb-4">
          {article.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("rounded-full", getReputationRing(reputationScore))}>
            {article.author?.avatar_url ? (
              <img
                src={article.author.avatar_url}
                alt={article.author.display_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {article.author?.display_name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">
                {article.author?.display_name}
              </span>
              {reputationScore > 80 && (
                <BadgeCheck size={16} className="text-yellow-500" />
              )}
              {reputationScore > 50 && reputationScore <= 80 && (
                <BadgeCheck size={16} className="text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {article.author?.specialty && (
                <>
                  <span>{article.author.specialty}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatSolarShort(article.created_at)}</span>
              <span>•</span>
              <span>{formatReadTime(article.content)}</span>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-6">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="text-foreground leading-loose whitespace-pre-wrap">
            {article.content}
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-8 pt-6 border-t border-border">
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
