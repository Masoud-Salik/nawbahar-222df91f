import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ReactionType = "liked" | "disliked" | null;

export function useReactions(articleId: string) {
  const [userReaction, setUserReaction] = useState<ReactionType>(null);
  const [likedCount, setLikedCount] = useState(0);
  const [dislikedCount, setDislikedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchReactions();
  }, [articleId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const fetchReactions = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    // Get liked count
    const { count: liked } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("article_id", articleId)
      .eq("reaction_type", "liked");

    // Get disliked count
    const { count: disliked } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("article_id", articleId)
      .eq("reaction_type", "disliked");

    setLikedCount(liked || 0);
    setDislikedCount(disliked || 0);

    if (currentUserId) {
      // Check user's reaction
      const { data: reactionData } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("article_id", articleId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setUserReaction(reactionData?.reaction_type as ReactionType || null);
    }

    setLoading(false);
  };

  const setReaction = async (type: "liked" | "disliked") => {
    if (!userId) {
      toast({
        title: "نیاز به ورود",
        description: "برای ثبت نظر باید وارد شوید",
        variant: "destructive",
      });
      return;
    }

    // If same reaction, remove it
    if (userReaction === type) {
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);

      if (!error) {
        if (type === "liked") setLikedCount(prev => prev - 1);
        else setDislikedCount(prev => prev - 1);
        setUserReaction(null);
      }
    } else {
      // Remove old reaction if exists
      if (userReaction) {
        await supabase
          .from("reactions")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", userId);
        
        if (userReaction === "liked") setLikedCount(prev => prev - 1);
        else setDislikedCount(prev => prev - 1);
      }

      // Add new reaction
      const { error } = await supabase
        .from("reactions")
        .insert({ article_id: articleId, user_id: userId, reaction_type: type });

      if (!error) {
        if (type === "liked") setLikedCount(prev => prev + 1);
        else setDislikedCount(prev => prev + 1);
        setUserReaction(type);
      }
    }
  };

  return {
    userReaction,
    likedCount,
    dislikedCount,
    loading,
    setReaction,
  };
}
