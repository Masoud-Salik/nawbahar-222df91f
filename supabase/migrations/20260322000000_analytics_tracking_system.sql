-- Analytics and User Tracking System Migration
-- Created: March 2026
-- Purpose: Track user registration, installations, active status, and activity logs

-- ============================================
-- 1. USER DEVICES TABLE
-- Track device info, installation, and user type (installer vs viewer)
-- ============================================
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device Information
  device_id TEXT UNIQUE NOT NULL, -- Unique device identifier (persistent)
  device_type TEXT, -- 'mobile', 'tablet', 'desktop', 'pwa', 'unknown'
  device_model TEXT, -- e.g., 'iPhone 14 Pro', 'Samsung Galaxy S23'
  os_name TEXT, -- e.g., 'iOS', 'Android', 'Windows', 'macOS', 'Linux'
  os_version TEXT, -- e.g., '17.1', '13.0'
  browser_name TEXT, -- e.g., 'Chrome', 'Safari', 'Firefox'
  browser_version TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  
  -- User Classification
  user_type TEXT NOT NULL DEFAULT 'viewer' CHECK (user_type IN ('installer', 'viewer', 'registered')),
  -- 'installer' = installed PWA/app
  -- 'viewer' = just browsing
  -- 'registered' = created account
  
  -- Installation/App Info
  is_pwa_installed BOOLEAN DEFAULT FALSE,
  installed_at TIMESTAMP WITH TIME ZONE,
  app_version TEXT, -- e.g., '0.0.2'
  
  -- First Visit Info
  first_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_visit_url TEXT,
  first_visit_referrer TEXT,
  
  -- Location (optional, approximate)
  country_code TEXT,
  timezone TEXT,
  language TEXT,
  
  -- Last Activity
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_user_devices_device_id ON public.user_devices(device_id);
CREATE INDEX idx_user_devices_user_type ON public.user_devices(user_type);
CREATE INDEX idx_user_devices_last_active ON public.user_devices(last_active_at DESC);
CREATE INDEX idx_user_devices_is_pwa ON public.user_devices(is_pwa_installed) WHERE is_pwa_installed = TRUE;

-- ============================================
-- 2. USER SESSIONS TABLE
-- Track active sessions and online status
-- ============================================
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES public.user_devices(device_id) ON DELETE CASCADE,
  
  -- Session Info
  session_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Session Times
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Session Duration (calculated)
  duration_seconds INTEGER,
  
  -- Session Context
  ip_address INET,
  user_agent TEXT,
  entry_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_device_id ON public.user_sessions(device_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_last_heartbeat ON public.user_sessions(last_heartbeat_at DESC);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);

-- ============================================
-- 3. ACTIVITY LOGS TABLE
-- Track all major user actions with timestamps
-- ============================================
CREATE TYPE public.activity_type AS ENUM (
  -- Auth Activities
  'app_open',           -- App/website opened
  'app_install',        -- PWA installed
  'app_update',         -- App updated
  'login',              -- User logged in
  'logout',             -- User logged out
  'register',           -- New account created
  
  -- Content Activities
  'article_view',       -- Viewed article
  'article_read',       -- Read article (scrolled through)
  'article_write',      -- Started writing article
  'article_publish',    -- Published article
  'article_edit',       -- Edited article
  'article_delete',     -- Deleted article
  'article_share',      -- Shared article
  'article_bookmark',   -- Bookmarked article
  'article_unbookmark', -- Removed bookmark
  'article_like',       -- Liked article
  'article_unlike',     -- Removed like
  
  -- Interaction Activities
  'comment_add',        -- Added comment
  'comment_edit',         -- Edited comment
  'comment_delete',     -- Deleted comment
  'comment_like',       -- Liked comment
  'reaction_add',       -- Added reaction
  'reaction_remove',    -- Removed reaction
  'follow_user',        -- Followed user
  'unfollow_user',      -- Unfollowed user
  
  -- Profile Activities
  'profile_view',       -- Viewed profile
  'profile_edit',       -- Edited profile
  'profile_setup',      -- Completed profile setup
  
  -- Search/Explore
  'search',             -- Performed search
  'explore_view',       -- Viewed explore page
  
  -- Notifications
  'notification_open',  -- Opened notification
  'notification_read',  -- Marked notification as read
  
  -- VIP/Special
  'vip_post_view',      -- Viewed VIP post
  'admin_action'        -- Admin performed action
);

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES public.user_devices(device_id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type public.activity_type NOT NULL,
  activity_category TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN activity_type IN ('app_open', 'app_install', 'app_update', 'login', 'logout', 'register') THEN 'auth'
      WHEN activity_type IN ('article_view', 'article_read', 'article_write', 'article_publish', 'article_edit', 'article_delete', 'article_share', 'article_bookmark', 'article_unbookmark', 'article_like', 'article_unlike') THEN 'content'
      WHEN activity_type IN ('comment_add', 'comment_edit', 'comment_delete', 'comment_like', 'reaction_add', 'reaction_remove', 'follow_user', 'unfollow_user') THEN 'interaction'
      WHEN activity_type IN ('profile_view', 'profile_edit', 'profile_setup') THEN 'profile'
      WHEN activity_type IN ('search', 'explore_view') THEN 'discovery'
      WHEN activity_type IN ('notification_open', 'notification_read') THEN 'notification'
      ELSE 'other'
    END
  ) STORED,
  
  -- Context
  entity_id UUID, -- ID of the related entity (article_id, comment_id, etc.)
  entity_type TEXT, -- 'article', 'comment', 'user', 'profile'
  
  -- Metadata (flexible JSON for additional data)
  metadata JSONB DEFAULT '{}',
  
  -- Location/Context
  url TEXT,
  referrer TEXT,
  
  -- Performance
  time_spent_seconds INTEGER, -- Time spent on this activity (if applicable)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Partition key for efficient querying (optional, for future scaling)
  created_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_device_id ON public.activity_logs(device_id);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_category ON public.activity_logs(activity_category);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_created_date ON public.activity_logs(created_date DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_id, entity_type);
CREATE INDEX idx_activity_logs_composite ON public.activity_logs(user_id, activity_type, created_at DESC);

-- Partial index for recent activities (last 30 days) for faster queries
CREATE INDEX idx_activity_logs_recent ON public.activity_logs(created_at DESC) 
  WHERE created_at > (now() - interval '30 days');

-- ============================================
-- 4. REALTIME PRESENCE TABLE (for active status)
-- Lightweight table for real-time online status
-- ============================================
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  session_id UUID NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline', 'busy')),
  
  -- Last Activity
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- What they're doing (optional)
  current_activity TEXT,
  current_entity_id UUID,
  
  -- Heartbeat for real-time updates
  heartbeat_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_presence_status ON public.user_presence(status);
CREATE INDEX idx_user_presence_online ON public.user_presence(status) WHERE status = 'online';
CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen_at DESC);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- User Devices: Users can only see their own devices
CREATE POLICY "Users can view own devices"
  ON public.user_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can view all devices
CREATE POLICY "Admin can view all devices"
  ON public.user_devices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User Sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can view all sessions
CREATE POLICY "Admin can view all sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Activity Logs: Users can only see their own logs
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can view all activity logs
CREATE POLICY "Admin can view all activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User Presence: Users can see who's online (public info)
CREATE POLICY "Anyone can view online status"
  ON public.user_presence FOR SELECT
  TO public
  USING (true);

-- Only user can update their own presence
CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
  ON public.user_presence FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_devices_updated_at
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically end session on logout
CREATE OR REPLACE FUNCTION public.end_user_session()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_sessions
  SET 
    is_active = FALSE,
    ended_at = now(),
    duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  WHERE user_id = NEW.user_id 
    AND is_active = TRUE;
  
  -- Update presence to offline
  UPDATE public.user_presence
  SET 
    status = 'offline',
    last_seen_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate session duration when ended
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = FALSE AND OLD.is_active = TRUE AND NEW.ended_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_session_duration_trigger
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.calculate_session_duration();

-- ============================================
-- 7. ANALYTICS VIEWS
-- ============================================

-- View: Currently Online Users
CREATE OR REPLACE VIEW public.online_users AS
SELECT 
  up.user_id,
  up.device_id,
  up.session_id,
  up.status,
  up.last_seen_at,
  up.current_activity,
  p.display_name,
  p.avatar_url,
  ud.user_type,
  ud.is_pwa_installed
FROM public.user_presence up
LEFT JOIN public.profiles p ON up.user_id = p.id
LEFT JOIN public.user_devices ud ON up.device_id = ud.device_id
WHERE up.status IN ('online', 'away')
  AND up.last_seen_at > (now() - interval '5 minutes');

-- View: Daily Active Users (DAU)
CREATE OR REPLACE VIEW public.daily_active_users AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_sessions,
  activity_category,
  activity_type
FROM public.activity_logs
WHERE created_at > (now() - interval '30 days')
GROUP BY DATE(created_at), activity_category, activity_type
ORDER BY date DESC;

-- View: User Engagement Summary
CREATE OR REPLACE VIEW public.user_engagement_summary AS
SELECT 
  user_id,
  COUNT(*) as total_activities,
  COUNT(DISTINCT DATE(created_at)) as active_days,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity,
  COUNT(*) FILTER (WHERE created_at > (now() - interval '7 days')) as activities_last_7_days,
  COUNT(*) FILTER (WHERE created_at > (now() - interval '30 days')) as activities_last_30_days
FROM public.activity_logs
GROUP BY user_id;

-- ============================================
-- 8. REALTIME SUBSCRIPTIONS (for live presence)
-- ============================================
-- Enable realtime for presence table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Add publication for activity_logs (for admin dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- ============================================
-- 9. COMMENTS
-- ============================================
COMMENT ON TABLE public.user_devices IS 'Tracks user devices, installations, and device info';
COMMENT ON TABLE public.user_sessions IS 'Tracks user sessions with online status';
COMMENT ON TABLE public.activity_logs IS 'Comprehensive activity tracking for analytics';
COMMENT ON TABLE public.user_presence IS 'Real-time user presence status';
