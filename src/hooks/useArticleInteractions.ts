import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playClickSound } from "@/lib/sounds";

export function useArticleInteractions(articleId: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchInteractionStatus();
  }, [articleId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const fetchInteractionStatus = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    // Get like count
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("article_id", articleId);

    setLikeCount(likesCount || 0);

    if (currentUserId) {
      // Check if user liked
      const { data: likeData } = await supabase
        .from("likes")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setIsLiked(!!likeData);

      // Check if user bookmarked
      const { data: bookmarkData } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setIsBookmarked(!!bookmarkData);
    }

    setLoading(false);
  };

  const toggleLike = async () => {
    if (!userId) {
      toast({
        title: "نیاز به ورود",
        description: "برای پسندیدن مقاله باید وارد شوید",
        variant: "destructive",
      });
      return;
    }

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);

      if (!error) {
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } else {
      // Add like
      const { error } = await supabase
        .from("likes")
        .insert({ article_id: articleId, user_id: userId });

      if (!error) {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        playClickSound();
      }
    }
  };

  const toggleBookmark = async () => {
    if (!userId) {
      toast({
        title: "نیاز به ورود",
        description: "برای ذخیره مقاله باید وارد شوید",
        variant: "destructive",
      });
      return;
    }

    if (isBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);

      if (!error) {
        setIsBookmarked(false);
        toast({ title: "از ذخیره‌ها حذف شد" });
      }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from("bookmarks")
        .insert({ article_id: articleId, user_id: userId });

      if (!error) {
        setIsBookmarked(true);
        playClickSound();
        toast({ title: "در ذخیره‌ها اضافه شد" });
      }
    }
  };

  return {
    isLiked,
    isBookmarked,
    likeCount,
    loading,
    userId,
    toggleLike,
    toggleBookmark,
  };
}
