import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EngagementData {
  scrollDepth: number;
  timeSpent: number;
  isFullRead: boolean;
}

const FULL_READ_THRESHOLD_SCROLL = 80; // 80% scroll
const FULL_READ_THRESHOLD_TIME = 60; // 60 seconds minimum

export function useEngagementTracking(articleId: string, contentLength: number) {
  const [engagement, setEngagement] = useState<EngagementData>({
    scrollDepth: 0,
    timeSpent: 0,
    isFullRead: false,
  });
  
  const startTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const hasTrackedRef = useRef(false);

  // Calculate expected read time based on content length (200 words/min avg)
  const expectedReadTime = Math.max(30, Math.ceil((contentLength / 5) / 200) * 60);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollPercent = scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 0;
      
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
        setEngagement(prev => ({ ...prev, scrollDepth: scrollPercent }));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const timeInterval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setEngagement(prev => {
        const isFullRead = prev.scrollDepth >= FULL_READ_THRESHOLD_SCROLL && 
                          timeSpent >= Math.min(expectedReadTime, FULL_READ_THRESHOLD_TIME);
        return { ...prev, timeSpent, isFullRead };
      });
    }, 5000); // Update every 5 seconds

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
    };
  }, [expectedReadTime]);

  // Track engagement when leaving the page
  useEffect(() => {
    const trackEngagement = async () => {
      if (hasTrackedRef.current) return;
      
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const scrollDepth = maxScrollRef.current;
      
      // Only track if user spent at least 10 seconds
      if (timeSpent < 10) return;

      const isFullRead = scrollDepth >= FULL_READ_THRESHOLD_SCROLL && 
                        timeSpent >= Math.min(expectedReadTime, FULL_READ_THRESHOLD_TIME);

      hasTrackedRef.current = true;

      // Update engagement score for the article
      if (isFullRead) {
        // Increment read_count for full reads
        await supabase.rpc('increment_view_count', { article_uuid: articleId });
        
        // Update engagement_score (simplified calculation)
        const { data: article } = await supabase
          .from('articles')
          .select('engagement_score, view_count, read_count')
          .eq('id', articleId)
          .maybeSingle();

        if (article) {
          const viewCount = article.view_count || 1;
          const readCount = (article.read_count || 0) + 1;
          // Engagement = (full reads / views) * 50 (max 50 for engagement component)
          const newEngagementScore = Math.min(50, Math.round((readCount / viewCount) * 50));

          await supabase
            .from('articles')
            .update({ 
              engagement_score: newEngagementScore,
              read_count: readCount,
            })
            .eq('id', articleId);
        }
      }
    };

    const handleBeforeUnload = () => {
      trackEngagement();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackEngagement();
    };
  }, [articleId, expectedReadTime]);

  return engagement;
}
