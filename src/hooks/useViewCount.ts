import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useViewCount(articleId: string) {
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (articleId) {
      // Increment view count
      supabase.rpc("increment_view_count", { article_uuid: articleId });
      
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

    setViewCount((data?.view_count || 0) + 1); // +1 for current view
  };

  return { viewCount };
}
