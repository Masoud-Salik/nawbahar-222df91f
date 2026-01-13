import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthorStats {
  trustScore: number;
  articleCount: number;
  avgScore: number;
  reportCount: number;
}

export function useAuthorTrustScore(authorId: string | null) {
  const [stats, setStats] = useState<AuthorStats>({
    trustScore: 50,
    articleCount: 0,
    avgScore: 0,
    reportCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authorId) {
      fetchAuthorStats(authorId);
    }
  }, [authorId]);

  const fetchAuthorStats = async (id: string) => {
    setLoading(true);

    // Get profile trust score
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score, reputation_score")
      .eq("id", id)
      .maybeSingle();

    // Get article stats
    const { data: articles } = await supabase
      .from("articles")
      .select("editorial_score_science, editorial_score_ethics, editorial_score_writing, total_feed_rank")
      .eq("author_id", id)
      .eq("status", "published");

    // Calculate average score
    let avgScore = 0;
    if (articles && articles.length > 0) {
      const totalScore = articles.reduce((sum, a) => {
        return sum + (a.total_feed_rank || 0);
      }, 0);
      avgScore = Math.round(totalScore / articles.length);
    }

    setStats({
      trustScore: (profile as any)?.trust_score || 50,
      articleCount: articles?.length || 0,
      avgScore,
      reportCount: 0,
    });

    setLoading(false);
  };

  // Calculate publishing eligibility based on trust score
  const canPublishImmediately = stats.trustScore >= 70;
  const needsReview = stats.trustScore < 40;
  const reducedWeight = stats.trustScore >= 40 && stats.trustScore < 70;

  return {
    ...stats,
    loading,
    canPublishImmediately,
    needsReview,
    reducedWeight,
    refetch: () => authorId && fetchAuthorStats(authorId),
  };
}
