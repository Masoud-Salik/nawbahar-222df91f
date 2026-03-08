import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  specialty: string | null;
  bio: string | null;
  reputation_score: number | null;
  trust_score: number | null;
  whatsapp_number: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  created_at: string;
}

export interface ProfileArticle {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  view_count: number | null;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<ProfileArticle[]>([]);
  const [bookmarks, setBookmarks] = useState<ProfileArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);

    const [profileResult, articlesResult, bookmarksResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, specialty, bio, reputation_score, trust_score, whatsapp_number, facebook_url, linkedin_url, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("articles")
        .select("id, title, content, cover_image_url, created_at, view_count")
        .eq("author_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("bookmarks")
        .select("article_id")
        .eq("user_id", userId),
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data as Profile);
    }

    setArticles(articlesResult.data || []);

    const bookmarkIds = (bookmarksResult.data || []).map(b => b.article_id);
    if (bookmarkIds.length > 0) {
      const { data: bookmarkedArticles } = await supabase
        .from("articles")
        .select("id, title, content, cover_image_url, created_at, view_count")
        .in("id", bookmarkIds)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      setBookmarks(bookmarkedArticles || []);
    } else {
      setBookmarks([]);
    }

    setLoading(false);
  };

  return {
    profile,
    articles,
    bookmarks,
    loading,
    refetch: fetchProfile,
  };
}
