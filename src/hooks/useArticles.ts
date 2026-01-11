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
  author_id: string;
  view_count: number;
  author?: {
    display_name: string;
    avatar_url: string | null;
    specialty: string | null;
    reputation_score: number;
  };
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
    
    // First get articles
    const { data: articlesData, error: articlesError } = await supabase
      .from("articles")
      .select("id, title, content, cover_image_url, tags, created_at, save_count, view_count, author_id")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (articlesError) {
      setError(articlesError.message);
      setArticles([]);
      setLoading(false);
      return;
    }

    // Get unique author IDs
    const authorIds = [...new Set((articlesData || []).map(a => a.author_id))];
    
    // Fetch profiles for those authors
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, specialty, reputation_score")
      .in("id", authorIds);

    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

    const transformed: FeedArticle[] = (articlesData || []).map((item) => {
      const profile = profilesMap.get(item.author_id);
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        cover_image_url: item.cover_image_url,
        tags: item.tags || [],
        created_at: item.created_at,
        save_count: item.save_count || 0,
        view_count: item.view_count || 0,
        author_id: item.author_id,
        author: profile ? {
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          specialty: profile.specialty,
          reputation_score: profile.reputation_score || 0,
        } : undefined,
      };
    });

    setArticles(transformed);
    setLoading(false);
  };

  return { articles, loading, error, refetch: fetchArticles };
}
