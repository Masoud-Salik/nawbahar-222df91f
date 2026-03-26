import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Reaction keys — rendered as Lucide outline icons */
export const REACTION_KEYS = ["like", "love", "insightful", "laugh", "sad"] as const;

export const REACTION_LABELS: Record<string, string> = {
  like: "پسند",
  love: "عالی",
  insightful: "آموزنده",
  laugh: "سرگرم‌کننده",
  sad: "تأسف‌بار",
};

/** Keep REACTION_EMOJIS for backward compat (details modal, summary) */
export const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  love: "❤️",
  insightful: "💡",
  laugh: "😄",
  sad: "😔",
};

/** Vivid colors — lively and engaging with clear differentiation */
export const REACTION_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  like:       { bg: "hsl(217 85% 56% / 0.12)", text: "hsl(217 85% 50%)", ring: "hsl(217 85% 56% / 0.25)" },
  love:       { bg: "hsl(348 80% 55% / 0.12)", text: "hsl(348 80% 50%)", ring: "hsl(348 80% 55% / 0.25)" },
  insightful: { bg: "hsl(45 90% 48% / 0.14)",  text: "hsl(40 85% 42%)",  ring: "hsl(45 90% 48% / 0.25)" },
  laugh:      { bg: "hsl(28 85% 52% / 0.12)",  text: "hsl(28 85% 46%)",  ring: "hsl(28 85% 52% / 0.25)" },
  sad:        { bg: "hsl(200 55% 48% / 0.12)",  text: "hsl(200 55% 42%)", ring: "hsl(200 55% 48% / 0.25)" },
};

export type ReactionKey = keyof typeof REACTION_EMOJIS;

export interface ReactionSummary {
  topTypes: ReactionKey[];
  totalCount: number;
  reactorNames: string[];
  userReaction: ReactionKey | null;
}

const EMPTY_SUMMARY: ReactionSummary = {
  topTypes: [],
  totalCount: 0,
  reactorNames: [],
  userReaction: null,
};

/**
 * Instant card reactions hook — optimized for zero-delay loading
 * Uses article.reaction_count for display count.
 * Full reaction data is pre-fetched for instant interaction.
 */
export function useCardReactions(articleId: string, autoFetch = true) {
  const [summary, setSummary] = useState<ReactionSummary>(EMPTY_SUMMARY);
  const [fetched, setFetched] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReactions = useCallback(async () => {
    setLoading(true);
    
    // Optimized: Get session and reactions in parallel
    const [{ data: { session } }, { data: reactions }] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from("reactions")
        .select("reaction_type, user_id, created_at")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })
    ]);
    
    const currentUserId = session?.user?.id || null;
    setUserId(currentUserId);

    if (!reactions || reactions.length === 0) {
      setSummary(EMPTY_SUMMARY);
      setFetched(true);
      setLoading(false);
      return;
    }

    // Optimized: Process data efficiently
    const typeCounts: Record<string, number> = {};
    const userReactionType = currentUserId 
      ? reactions.find((r) => r.user_id === currentUserId)?.reaction_type as ReactionKey | undefined
      : null;
    
    reactions.forEach((r) => {
      typeCounts[r.reaction_type] = (typeCounts[r.reaction_type] || 0) + 1;
    });

    const sorted = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key as ReactionKey);
    const topTypes = sorted.slice(0, 2);

    const userReaction = userReactionType || null;

    const uniqueOtherReactorIds = Array.from(
      new Set(reactions.filter((r) => r.user_id !== currentUserId).map((r) => r.user_id))
    );

    let reactorNames: string[] = [];
    if (uniqueOtherReactorIds.length > 0) {
      const reactorIdsToShow = uniqueOtherReactorIds.slice(0, 2);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", reactorIdsToShow);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));
      reactorNames = reactorIdsToShow.map((id) => profileMap.get(id)).filter((name): name is string => Boolean(name));
    }

    setSummary({ topTypes, totalCount: reactions.length, reactorNames, userReaction });
    setFetched(true);
    setLoading(false);
  }, [articleId]);

  // Instant fetch on mount for zero-delay interaction
  useEffect(() => {
    if (autoFetch && !fetched && !loading) {
      fetchReactions();
    }
  }, [autoFetch, fetched, loading, fetchReactions]);

  const ensureFetched = useCallback(async () => {
    if (!fetched) await fetchReactions();
  }, [fetched, fetchReactions]);

  const toggleReaction = async (type: ReactionKey) => {
    // Instant response - no waiting for fetch
    const optimisticUpdate = () => {
      if (summary.userReaction === type) {
        // Remove reaction
        setSummary(prev => ({
          ...prev,
          userReaction: null,
          totalCount: Math.max(0, prev.totalCount - 1)
        }));
      } else if (summary.userReaction) {
        // Change reaction
        setSummary(prev => ({
          ...prev,
          userReaction: type
        }));
      } else {
        // Add reaction
        setSummary(prev => ({
          ...prev,
          userReaction: type,
          totalCount: prev.totalCount + 1
        }));
      }
    };

    // Apply optimistic update immediately
    optimisticUpdate();

    // Get session and perform database operation
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      // Revert optimistic update if not authenticated
      await fetchReactions();
      return false;
    }

    try {
      if (summary.userReaction === type) {
        await supabase.from("reactions").delete().eq("article_id", articleId).eq("user_id", uid);
      } else if (summary.userReaction) {
        await supabase.from("reactions").update({ reaction_type: type }).eq("article_id", articleId).eq("user_id", uid);
      } else {
        await supabase.from("reactions").insert({ article_id: articleId, user_id: uid, reaction_type: type });
      }
    } catch (error) {
      // Revert on error
      console.error('Reaction toggle failed:', error);
      await fetchReactions();
      return false;
    }

    // Refresh data to ensure consistency
    await fetchReactions();
    return true;
  };

  return { summary, loading, userId, toggleReaction, ensureFetched, fetched };
}
