import { useState, useCallback } from "react";
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
 * Lazy card reactions hook — does NOT fetch on mount.
 * Uses article.reaction_count for display count.
 * Full reaction data is only fetched on first user interaction.
 */
export function useCardReactions(articleId: string) {
  const [summary, setSummary] = useState<ReactionSummary>(EMPTY_SUMMARY);
  const [fetched, setFetched] = useState(false);
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
      setSummary(EMPTY_SUMMARY);
      setFetched(true);
      return;
    }

    const typeCounts: Record<string, number> = {};
    reactions.forEach((r) => {
      typeCounts[r.reaction_type] = (typeCounts[r.reaction_type] || 0) + 1;
    });

    const sorted = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key as ReactionKey);
    const topTypes = sorted.slice(0, 2);

    const userReaction = currentUserId
      ? (reactions.find((r) => r.user_id === currentUserId)?.reaction_type as ReactionKey | undefined) || null
      : null;

    const otherReactorIds = reactions
      .filter((r) => r.user_id !== currentUserId)
      .map((r) => r.user_id);

    let reactorNames: string[] = [];
    if (otherReactorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("display_name")
        .in("id", otherReactorIds.slice(0, 2));
      reactorNames = profiles?.map((p) => p.display_name) || [];
    }

    setSummary({ topTypes, totalCount: reactions.length, reactorNames, userReaction });
    setFetched(true);
  }, [articleId]);

  const ensureFetched = useCallback(async () => {
    if (!fetched) await fetchReactions();
  }, [fetched, fetchReactions]);

  const toggleReaction = async (type: ReactionKey) => {
    // Ensure data is loaded first
    if (!fetched) await fetchReactions();
    
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return false;

    if (summary.userReaction === type) {
      await supabase.from("reactions").delete().eq("article_id", articleId).eq("user_id", uid);
    } else if (summary.userReaction) {
      await supabase.from("reactions").update({ reaction_type: type }).eq("article_id", articleId).eq("user_id", uid);
    } else {
      await supabase.from("reactions").insert({ article_id: articleId, user_id: uid, reaction_type: type });
    }

    await fetchReactions();
    return true;
  };

  return { summary, loading: false, userId, toggleReaction, ensureFetched, fetched };
}
