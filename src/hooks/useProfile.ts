import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  specialty: string | null;
  reputation_score: number;
}

interface Article {
  id: string;
  title: string;
  cover_image_url: string | null;
  created_at: string;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, specialty, reputation_score")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile({
        ...profileData,
        reputation_score: profileData.reputation_score || 0,
      });
    }

    // Fetch user's articles
    const { data: articlesData } = await supabase
      .from("articles")
      .select("id, title, cover_image_url, created_at")
      .eq("author_id", userId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    setArticles(articlesData || []);

    // Fetch bookmarked articles
    const { data: bookmarksData } = await supabase
      .from("bookmarks")
      .select("article_id")
      .eq("user_id", userId);

    if (bookmarksData && bookmarksData.length > 0) {
      const articleIds = bookmarksData.map((b) => b.article_id);
      const { data: bookmarkedArticles } = await supabase
        .from("articles")
        .select("id, title, cover_image_url, created_at")
        .in("id", articleIds)
        .eq("status", "published");

      setBookmarks(bookmarkedArticles || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return { profile, articles, bookmarks, loading, refetch: fetchProfile };
}
