import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ResponseArticle {
  id: string;
  title: string;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface ParentArticle {
  id: string;
  title: string;
}

export function useResponseArticles(articleId: string) {
  const [responses, setResponses] = useState<ResponseArticle[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [parentArticle, setParentArticle] = useState<ParentArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      fetchResponses();
      fetchParentArticle();
    }
  }, [articleId]);

  const fetchResponses = async () => {
    setLoading(true);
    
    // Get response articles
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, created_at, author_id")
      .eq("parent_article_id", articleId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setResponses([]);
      setResponseCount(0);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const authorIds = [...new Set(data.map(a => a.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const responsesWithAuthors = data.map(article => ({
      id: article.id,
      title: article.title,
      created_at: article.created_at,
      author: profileMap.get(article.author_id) || null,
    }));

    setResponses(responsesWithAuthors);
    setResponseCount(data.length);
    setLoading(false);
  };

  const fetchParentArticle = async () => {
    // First get current article's parent_article_id
    const { data: currentArticle } = await supabase
      .from("articles")
      .select("parent_article_id")
      .eq("id", articleId)
      .maybeSingle();

    if (!currentArticle?.parent_article_id) {
      setParentArticle(null);
      return;
    }

    // Get parent article details
    const { data: parent } = await supabase
      .from("articles")
      .select("id, title")
      .eq("id", currentArticle.parent_article_id)
      .maybeSingle();

    setParentArticle(parent);
  };

  return {
    responses,
    responseCount,
    parentArticle,
    loading,
    refetch: fetchResponses,
  };
}
