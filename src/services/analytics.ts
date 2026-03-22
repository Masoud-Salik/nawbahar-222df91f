import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Types
export type ActivityType = 
  | 'app_open' | 'app_install' | 'app_update' | 'login' | 'logout' | 'register'
  | 'article_view' | 'article_read' | 'article_write' | 'article_publish' 
  | 'article_edit' | 'article_delete' | 'article_share' | 'article_bookmark' 
  | 'article_unbookmark' | 'article_like' | 'article_unlike'
  | 'comment_add' | 'comment_edit' | 'comment_delete' | 'comment_like'
  | 'reaction_add' | 'reaction_remove' | 'follow_user' | 'unfollow_user'
  | 'profile_view' | 'profile_edit' | 'profile_setup'
  | 'search' | 'explore_view' | 'notification_open' | 'notification_read'
  | 'vip_post_view' | 'admin_action';

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'pwa' | 'unknown';
  deviceModel?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  screenWidth?: number;
  screenHeight?: number;
  timezone?: string;
  language?: string;
}

export interface ActivityLogEntry {
  userId?: string;
  deviceId: string;
  activityType: ActivityType;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  url?: string;
  referrer?: string;
  timeSpentSeconds?: number;
}

// Generate a persistent device ID
const getDeviceId = (): string => {
  const storageKey = 'nawbahar_device_id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
};

// Detect device type
const detectDeviceType = (): DeviceInfo['deviceType'] => {
  const userAgent = navigator.userAgent;
  const width = window.innerWidth;
  
  // Check for PWA mode
  if (window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true) {
    return 'pwa';
  }
  
  // Check for mobile
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent) || width >= 768) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  return 'desktop';
};

// Detect browser info
const detectBrowser = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = '';
  
  if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || '';
  }
  
  return { browserName, browserVersion };
};

// Detect OS
const detectOS = () => {
  const ua = navigator.userAgent;
  let osName = 'Unknown';
  let osVersion = '';
  
  if (/Windows NT 10/.test(ua)) {
    osName = 'Windows';
    osVersion = '10';
  } else if (/Windows NT 6.3/.test(ua)) {
    osName = 'Windows';
    osVersion = '8.1';
  } else if (/Mac OS X/.test(ua)) {
    osName = 'macOS';
    osVersion = ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (/Android/.test(ua)) {
    osName = 'Android';
    osVersion = ua.match(/Android ([0-9.]+)/)?.[1] || '';
  } else if (/iOS|iPhone|iPad|iPod/.test(ua)) {
    osName = 'iOS';
    osVersion = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (/Linux/.test(ua)) {
    osName = 'Linux';
  }
  
  return { osName, osVersion };
};

// Get device info
const getDeviceInfo = (): DeviceInfo => {
  const { browserName, browserVersion } = detectBrowser();
  const { osName, osVersion } = detectOS();
  
  return {
    deviceId: getDeviceId(),
    deviceType: detectDeviceType(),
    osName,
    osVersion,
    browserName,
    browserVersion,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
};

// Analytics Service
export const analyticsService = {
  // Device ID for tracking
  deviceId: getDeviceId(),
  
  // Get device info
  getDeviceInfo,
  
  // Register or update device
  async registerDevice(userId?: string, userType: 'viewer' | 'registered' | 'installer' = 'viewer') {
    const device = getDeviceInfo();
    
    const deviceData = {
      device_id: device.deviceId,
      user_id: userId || null,
      device_type: device.deviceType,
      os_name: device.osName,
      os_version: device.osVersion,
      browser_name: device.browserName,
      browser_version: device.browserVersion,
      screen_width: device.screenWidth,
      screen_height: device.screenHeight,
      timezone: device.timezone,
      language: device.language,
      user_type: userType,
      is_pwa_installed: device.deviceType === 'pwa',
      last_active_at: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from('user_devices')
      .upsert(deviceData, { onConflict: 'device_id' });
    
    if (error) {
      console.error('Error registering device:', error);
    }
    
    return device.deviceId;
  },
  
  // Log activity
  async logActivity(entry: ActivityLogEntry) {
    // Use a non-blocking approach for performance
    const activityData = {
      user_id: entry.userId || null,
      device_id: entry.deviceId || this.deviceId,
      activity_type: entry.activityType,
      entity_id: entry.entityId || null,
      entity_type: entry.entityType || null,
      metadata: entry.metadata || {},
      url: entry.url || window.location.href,
      referrer: entry.referrer || document.referrer || null,
      time_spent_seconds: entry.timeSpentSeconds || null,
    };
    
    // Fire and forget - don't wait for response to avoid blocking UI
    supabase.from('activity_logs').insert(activityData).then(({ error }) => {
      if (error) {
        console.error('Error logging activity:', error);
      }
    });
  },
  
  // Start session
  async startSession(userId?: string): Promise<string | null> {
    const sessionToken = `${this.deviceId}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId || null,
        device_id: this.deviceId,
        session_token: sessionToken,
        is_active: true,
        entry_url: window.location.href,
        user_agent: navigator.userAgent,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error starting session:', error);
      return null;
    }
    
    return data.id;
  },
  
  // End session
  async endSession(sessionId: string) {
    if (!sessionId) return;
    
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error ending session:', error);
    }
  },
  
  // Update presence (heartbeat)
  async updatePresence(userId: string, sessionId: string, status: 'online' | 'away' | 'busy' = 'online', currentActivity?: string) {
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        device_id: this.deviceId,
        session_id: sessionId,
        status,
        last_seen_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        current_activity: currentActivity || null,
        heartbeat_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error updating presence:', error);
    }
  },
  
  // Track app install
  async trackAppInstall(userId?: string) {
    await this.registerDevice(userId, 'installer');
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'app_install',
    });
  },
  
  // Track user registration
  async trackRegistration(userId: string) {
    await this.registerDevice(userId, 'registered');
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'register',
    });
  },
  
  // Track login
  async trackLogin(userId: string) {
    await this.registerDevice(userId, 'registered');
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'login',
    });
  },
  
  // Track logout
  async trackLogout(userId: string, sessionId?: string) {
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'logout',
    });
    
    if (sessionId) {
      await this.endSession(sessionId);
    }
  },
  
  // Track article view
  async trackArticleView(userId: string | undefined, articleId: string, timeSpentSeconds?: number) {
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'article_view',
      entityId: articleId,
      entityType: 'article',
      timeSpentSeconds,
    });
  },
  
  // Track article read (user actually read/scrolled through)
  async trackArticleRead(userId: string | undefined, articleId: string, timeSpentSeconds: number) {
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'article_read',
      entityId: articleId,
      entityType: 'article',
      timeSpentSeconds,
    });
  },
  
  // Track search
  async trackSearch(userId: string | undefined, query: string, resultsCount?: number) {
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'search',
      metadata: { query, resultsCount },
    });
  },
  
  // Track profile view
  async trackProfileView(userId: string | undefined, profileId: string) {
    await this.logActivity({
      userId,
      deviceId: this.deviceId,
      activityType: 'profile_view',
      entityId: profileId,
      entityType: 'profile',
    });
  },
};

// Hook for using analytics
export const useAnalytics = (user: User | null) => {
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentActivityRef = useRef<string>('');
  
  // Initialize device on mount
  useEffect(() => {
    analyticsService.registerDevice(user?.id, user ? 'registered' : 'viewer');
  }, []);
  
  // Track app open
  useEffect(() => {
    analyticsService.logActivity({
      userId: user?.id,
      deviceId: analyticsService.deviceId,
      activityType: 'app_open',
      url: window.location.href,
    });
  }, []);
  
  // Start session when user logs in
  useEffect(() => {
    if (user?.id) {
      analyticsService.startSession(user.id).then((id) => {
        if (id) {
          sessionIdRef.current = id;
          analyticsService.trackLogin(user.id);
        }
      });
      
      return () => {
        if (sessionIdRef.current) {
          analyticsService.trackLogout(user.id, sessionIdRef.current);
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
        'online',
        currentActivityRef.current
      );
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
  
  // Track visibility changes (away/online status)
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
  
  // Set current activity for presence tracking
  const setCurrentActivity = useCallback((activity: string) => {
    currentActivityRef.current = activity;
  }, []);
  
  return {
    analyticsService,
    sessionId: sessionIdRef.current,
    setCurrentActivity,
    deviceId: analyticsService.deviceId,
  };
};

// Hook for tracking time spent on pages
export const usePageTracking = (userId: string | undefined, pageName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    return () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Only log if user spent more than 5 seconds
      if (timeSpent > 5) {
        analyticsService.logActivity({
          userId,
          deviceId: analyticsService.deviceId,
          activityType: 'app_open', // Generic activity
          metadata: { pageName, timeSpentSeconds: timeSpent },
        });
      }
    };
  }, [pageName, userId]);
};

// Hook for tracking article engagement
export const useArticleTracking = (userId: string | undefined, articleId: string | undefined) => {
  const viewLoggedRef = useRef(false);
  const readThresholdRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef(0);
  
  useEffect(() => {
    if (!articleId) return;
    
    startTimeRef.current = Date.now();
    
    // Log view after 3 seconds (to avoid accidental clicks)
    const viewTimeout = setTimeout(() => {
      if (!viewLoggedRef.current) {
        analyticsService.trackArticleView(userId, articleId);
        viewLoggedRef.current = true;
      }
    }, 3000);
    
    // Track scroll depth
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      scrollDepthRef.current = Math.max(scrollDepthRef.current, scrollPercent);
      
      // Mark as "read" if scrolled past 70%
      if (scrollPercent > 70 && !readThresholdRef.current) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        analyticsService.trackArticleRead(userId, articleId, timeSpent);
        readThresholdRef.current = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(viewTimeout);
      window.removeEventListener('scroll', handleScroll);
      
      // Log final time spent if view was logged
      if (viewLoggedRef.current) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        // Update the view with time spent (optional enhancement)
      }
    };
  }, [articleId, userId]);
  
  return {
    scrollDepth: scrollDepthRef.current,
    isRead: readThresholdRef.current,
  };
};

export default analyticsService;
