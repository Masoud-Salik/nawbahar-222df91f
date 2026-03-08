import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  clap: "👏",
  love: "❤️",
  insightful: "💡",
  laugh: "😂",
  sad: "😢",
  fire: "🔥",
};

export const REACTION_LABELS: Record<string, string> = {
  like: "پسند",
  clap: "تحسین",
  love: "عالی",
  insightful: "آموزنده",
  laugh: "خنده",
  sad: "غمگین",
  fire: "الهام‌بخش",
};

export type ReactionKey = keyof typeof REACTION_EMOJIS;

export interface ReactionSummary {
  /** Top 1-2 reaction types by count (like is default if present) */
  topTypes: ReactionKey[];
  totalCount: number;
  /** Names of people user follows who reacted, prioritized */
  reactorNames: string[];
  userReaction: ReactionKey | null;
}

export function useCardReactions(articleId: string) {
  const [summary, setSummary] = useState<ReactionSummary>({
    topTypes: [],
    totalCount: 0,
    reactorNames: [],
    userReaction: null,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || null;
    setUserId(currentUserId);

    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_type, user_id")
      .eq("article_id", articleId);

    if (!reactions || reactions.length === 0) {
      setSummary({ topTypes: [], totalCount: 0, reactorNames: [], userReaction: null });
      setLoading(false);
      return;
    }

    // Count each reaction type
    const typeCounts: Record<string, number> = {};
    reactions.forEach((r) => {
      typeCounts[r.reaction_type] = (typeCounts[r.reaction_type] || 0) + 1;
    });

    // Sort by count, but always put "like" first if it exists
    const sorted = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key as ReactionKey);

    // Take top 2 unique types
    const topTypes = sorted.slice(0, 2);

    // User's own reaction
    const userReaction = currentUserId
      ? (reactions.find((r) => r.user_id === currentUserId)?.reaction_type as ReactionKey | undefined) || null
      : null;

    // Get reactor IDs (exclude self)
    const otherReactorIds = reactions
      .filter((r) => r.user_id !== currentUserId)
      .map((r) => r.user_id);

    let reactorNames: string[] = [];

    if (currentUserId && otherReactorIds.length > 0) {
      // Get IDs the user follows — prioritize these names
      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", otherReactorIds.slice(0, 20));

      const followedIds = new Set(followData?.map((f) => f.following_id) || []);

      // Sort: followed users first
      const prioritized = [...otherReactorIds].sort((a, b) => {
        const aFollowed = followedIds.has(a) ? 0 : 1;
        const bFollowed = followedIds.has(b) ? 0 : 1;
        return aFollowed - bFollowed;
      });

      const topIds = prioritized.slice(0, 2);
      if (topIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("display_name")
          .in("id", topIds);
        reactorNames = profiles?.map((p) => p.display_name) || [];
      }
    } else if (otherReactorIds.length > 0) {
      // Not logged in — just show first 2
      const { data: profiles } = await supabase
        .from("profiles")
        .select("display_name")
        .in("id", otherReactorIds.slice(0, 2));
      reactorNames = profiles?.map((p) => p.display_name) || [];
    }

    setSummary({
      topTypes,
      totalCount: reactions.length,
      reactorNames,
      userReaction,
    });
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const toggleReaction = async (type: ReactionKey) => {
    if (!userId) return false;

    if (summary.userReaction === type) {
      await supabase
        .from("reactions")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);
    } else {
      if (summary.userReaction) {
        await supabase
          .from("reactions")
          .update({ reaction_type: type })
          .eq("article_id", articleId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("reactions")
          .insert({ article_id: articleId, user_id: userId, reaction_type: type });
      }
    }

    await fetchReactions();
    return true;
  };

  return { summary, loading, userId, toggleReaction };
}
