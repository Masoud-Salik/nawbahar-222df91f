import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeedArticle {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  save_count: number;
  author?: {
    display_name: string;
    avatar_url: string | null;
    specialty: string | null;
    reputation_score: number;
  };
  is_bookmarked?: boolean;
  is_liked?: boolean;
}

export function usePublishedArticles() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        content,
        cover_image_url,
        tags,
        created_at,
        save_count,
        total_feed_rank,
        profiles:author_id(
          display_name,
          avatar_url,
          specialty,
          reputation_score
        )
      `)
      .eq("status", "published")
      .order("total_feed_rank", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setArticles([]);
    } else {
      const transformed: FeedArticle[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        cover_image_url: item.cover_image_url,
        tags: item.tags || [],
        created_at: item.created_at,
        save_count: item.save_count || 0,
        author: item.profiles ? {
          display_name: item.profiles.display_name,
          avatar_url: item.profiles.avatar_url,
          specialty: item.profiles.specialty,
          reputation_score: item.profiles.reputation_score || 0,
        } : undefined,
      }));
      setArticles(transformed);
    }
    setLoading(false);
  };

  return { articles, loading, error, refetch: fetchArticles };
}
