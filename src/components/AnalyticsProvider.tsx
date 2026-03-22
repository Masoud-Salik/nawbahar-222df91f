import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService, ActivityType } from '@/services/analytics';
import type { User } from '@supabase/supabase-js';

interface AnalyticsContextType {
  logActivity: (type: ActivityType, metadata?: Record<string, any>) => void;
  setCurrentActivity: (activity: string) => void;
  trackArticleView: (articleId: string) => void;
  trackArticleRead: (articleId: string, timeSpent: number) => void;
  trackSearch: (query: string, resultsCount?: number) => void;
  trackProfileView: (profileId: string) => void;
  deviceId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentActivityRef = useRef<string>('');
  const lastActivityRef = useRef<number>(Date.now());

  // Initialize device on mount
  useEffect(() => {
    analyticsService.registerDevice(user?.id, user ? 'registered' : 'viewer');
  }, []);

  // Track app open
  useEffect(() => {
    const trackAppOpen = () => {
      analyticsService.logActivity({
        userId: user?.id,
        deviceId: analyticsService.deviceId,
        activityType: 'app_open',
        url: window.location.href,
        referrer: document.referrer || undefined,
      });
      lastActivityRef.current = Date.now();
    };

    trackAppOpen();

    // Track when app becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        // If it's been more than 5 minutes, count as a new app open
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          trackAppOpen();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  // Start session when user logs in
  useEffect(() => {
    if (user?.id) {
      analyticsService.startSession(user.id).then((id) => {
        if (id) {
          sessionIdRef.current = id;
        }
      });

      return () => {
        if (sessionIdRef.current) {
          analyticsService.endSession(sessionIdRef.current);
        }
      };
    }
  }, [user?.id]);

  // Heartbeat for real-time presence (every 30 seconds when active)
  useEffect(() => {
    if (!user?.id || !sessionIdRef.current) return;

    const sendHeartbeat = () => {
      analyticsService.updatePresence(
        user.id,
        sessionIdRef.current!,
        document.hidden ? 'away' : 'online',
        currentActivityRef.current
      );
      lastActivityRef.current = Date.now();
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [user?.id]);

  // Track visibility changes
  useEffect(() => {
    if (!user?.id || !sessionIdRef.current) return;

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online';
      analyticsService.updatePresence(
        user.id,
        sessionIdRef.current!,
        status,
        currentActivityRef.current
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  // Log activity function
  const logActivity = useCallback((type: ActivityType, metadata?: Record<string, any>) => {
    analyticsService.logActivity({
      userId: user?.id,
      deviceId: analyticsService.deviceId,
      activityType: type,
      metadata,
    });
    lastActivityRef.current = Date.now();
  }, [user?.id]);

  // Set current activity
  const setCurrentActivity = useCallback((activity: string) => {
    currentActivityRef.current = activity;
  }, []);

  // Track article view
  const trackArticleView = useCallback((articleId: string) => {
    analyticsService.trackArticleView(user?.id, articleId);
  }, [user?.id]);

  // Track article read
  const trackArticleRead = useCallback((articleId: string, timeSpent: number) => {
    analyticsService.trackArticleRead(user?.id, articleId, timeSpent);
  }, [user?.id]);

  // Track search
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    analyticsService.trackSearch(user?.id, query, resultsCount);
  }, [user?.id]);

  // Track profile view
  const trackProfileView = useCallback((profileId: string) => {
    analyticsService.trackProfileView(user?.id, profileId);
  }, [user?.id]);

  const value: AnalyticsContextType = {
    logActivity,
    setCurrentActivity,
    trackArticleView,
    trackArticleRead,
    trackSearch,
    trackProfileView,
    deviceId: analyticsService.deviceId,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;
