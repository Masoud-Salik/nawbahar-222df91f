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

/** Muted distinct colors per reaction — professional but not lifeless (excitement ≈ 30) */
export const REACTION_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  like:       { bg: "hsl(210 25% 50% / 0.08)", text: "hsl(210 25% 40%)", ring: "hsl(210 25% 50% / 0.12)" },
  love:       { bg: "hsl(350 30% 50% / 0.08)", text: "hsl(350 30% 42%)", ring: "hsl(350 30% 50% / 0.12)" },
  insightful: { bg: "hsl(45 30% 48% / 0.08)",  text: "hsl(45 30% 38%)",  ring: "hsl(45 30% 48% / 0.12)" },
  laugh:      { bg: "hsl(30 28% 48% / 0.08)",  text: "hsl(30 28% 40%)",  ring: "hsl(30 28% 48% / 0.12)" },
  sad:        { bg: "hsl(200 18% 48% / 0.08)",  text: "hsl(200 18% 42%)", ring: "hsl(200 18% 48% / 0.12)" },
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
export function useCardReactions(articleId: string, autoFetch = true) {
  const [summary, setSummary] = useState<ReactionSummary>(EMPTY_SUMMARY);
  const [fetched, setFetched] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || null;
    setUserId(currentUserId);

    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_type, user_id, created_at")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

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
  }, [articleId]);

  // Auto-fetch on mount for persistent display
  useEffect(() => {
    if (autoFetch && !fetched) {
      fetchReactions();
    }
  }, [autoFetch, fetched, fetchReactions]);

  const ensureFetched = useCallback(async () => {
    if (!fetched) await fetchReactions();
  }, [fetched, fetchReactions]);

  const toggleReaction = async (type: ReactionKey) => {
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
