import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FollowStats {
  followerCount: number;
  followingCount: number;
  loading: boolean;
}

export function useFollowStats(userId: string | undefined): FollowStats {
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      
      const [followersRes, followingRes] = await Promise.all([
        supabase.rpc("get_follower_count", { target_user_id: userId }),
        supabase.rpc("get_following_count", { target_user_id: userId }),
      ]);

      setFollowerCount(followersRes.data || 0);
      setFollowingCount(followingRes.data || 0);
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  return { followerCount, followingCount, loading };
}
