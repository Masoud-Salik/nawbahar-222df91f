import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VIEW_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export function useViewCount(articleId: string) {
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (articleId) {
      // Check if we should increment view count (rate limiting)
      const viewedKey = `viewed_${articleId}`;
      const lastViewed = localStorage.getItem(viewedKey);
      const now = Date.now();
      
      if (!lastViewed || parseInt(lastViewed) < now - VIEW_COOLDOWN_MS) {
        // Increment view count
        supabase.rpc("increment_view_count", { article_uuid: articleId });
        localStorage.setItem(viewedKey, now.toString());
      }
      
      // Fetch current view count
      fetchViewCount();
    }
  }, [articleId]);

  const fetchViewCount = async () => {
    const { data } = await supabase
      .from("articles")
      .select("view_count")
      .eq("id", articleId)
      .maybeSingle();

    setViewCount(data?.view_count || 0);
  };

  return { viewCount };
}
