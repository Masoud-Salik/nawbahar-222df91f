import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like" | "comment" | "follow";
  article_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    display_name: string;
    avatar_url: string | null;
  };
  article?: {
    title: string;
  };
}

const NOTIFICATION_SETTINGS_KEY = 'nawbahar_notification_settings';

export interface NotificationSettings {
  comments: boolean;
  likes: boolean;
  follows: boolean;
  enabled: boolean;
}

const defaultSettings: NotificationSettings = {
  comments: true,
  likes: true,
  follows: true,
  enabled: true,
};

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch { /* defaults */ }
    }
  }, []);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all unread notifications
    const { data: unreadData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    // Fetch 10 most recent notifications
    const { data: recentData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Merge: all unread + recent 10, deduplicated
    const allUnread = unreadData || [];
    const recent10 = recentData || [];
    const merged = new Map<string, typeof allUnread[0]>();
    [...allUnread, ...recent10].forEach(n => merged.set(n.id, n));
    const notifData = Array.from(merged.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (notifData.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Get unique actor IDs and article IDs
    const actorIds = [...new Set(notifData.map(n => n.actor_id))];
    const articleIds = [...new Set(notifData.filter(n => n.article_id).map(n => n.article_id!))];

    const [actorsRes, articlesRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", actorIds),
      articleIds.length > 0
        ? supabase.from("articles").select("id, title").in("id", articleIds)
        : Promise.resolve({ data: [] }),
    ]);

    const actorsMap = new Map((actorsRes.data || []).map(a => [a.id, a]));
    const articlesMap = new Map((articlesRes.data || []).map(a => [a.id, a]));

    const transformed: Notification[] = notifData.map(n => ({
      ...n,
      type: n.type as "like" | "comment" | "follow",
      actor: actorsMap.get(n.actor_id),
      article: n.article_id ? articlesMap.get(n.article_id) : undefined,
    }));

    // Filter based on settings
    const filtered = settings.enabled 
      ? transformed.filter(n => {
          if (n.type === 'comment' && !settings.comments) return false;
          if (n.type === 'like' && !settings.likes) return false;
          if (n.type === 'follow' && !settings.follows) return false;
          return true;
        })
      : transformed;

    const dedupedNotifications = Array.from(new Map(filtered.map((n) => [n.id, n])).values());
    setNotifications(dedupedNotifications);
    setUnreadCount(dedupedNotifications.filter(n => !n.is_read).length);
    setLoading(false);
  }, [user, settings]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => { 
        import("@/lib/sounds").then(m => m.playNotificationSound());
        fetchNotifications(); 
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase.from("notifications").delete().eq("id", notificationId);
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== notificationId);
    });
  };

  return { 
    notifications, unreadCount, loading, 
    markAsRead, markAllAsRead, deleteNotification,
    settings, updateSettings, refetch: fetchNotifications 
  };
}
