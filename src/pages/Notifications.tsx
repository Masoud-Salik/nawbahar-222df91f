import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineFallback } from "@/components/OfflineFallback";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, UserPlus, Bell, CheckCheck,
  Settings, X, BellOff, BellRing, ThumbsUp, Lightbulb, Smile, Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, toPersianNumber } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { REACTION_LABELS } from "@/hooks/useCardReactions";

/** Fetch latest comment content by actor on article */
function useNotificationExtras(notifications: any[]) {
  const [extras, setExtras] = useState<Record<string, { commentPreview?: string; reactionType?: string }>>({});

  useEffect(() => {
    const commentNotifs = notifications.filter(n => n.type === "comment" && n.article_id && n.actor_id);
    const reactionNotifs = notifications.filter(n => n.type === "like" && n.article_id && n.actor_id);

    if (commentNotifs.length === 0 && reactionNotifs.length === 0) return;

    const fetchExtras = async () => {
      const result: Record<string, { commentPreview?: string; reactionType?: string }> = {};

      // Fetch comment previews
      if (commentNotifs.length > 0) {
        const pairs = commentNotifs.map(n => `(${JSON.stringify(n.article_id)}, ${JSON.stringify(n.actor_id)})`);
        // Fetch latest comments by these actors on these articles
        for (const n of commentNotifs.slice(0, 20)) {
          const { data } = await supabase
            .from("comments")
            .select("content")
            .eq("article_id", n.article_id)
            .eq("user_id", n.actor_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (data && data[0]) {
            const content = data[0].content;
            result[n.id] = { commentPreview: content.length > 60 ? content.slice(0, 60) + "…" : content };
          }
        }
      }

      // Fetch reaction types
      if (reactionNotifs.length > 0) {
        for (const n of reactionNotifs.slice(0, 20)) {
          const { data } = await supabase
            .from("reactions")
            .select("reaction_type")
            .eq("article_id", n.article_id)
            .eq("user_id", n.actor_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (data && data[0]) {
            result[n.id] = { ...result[n.id], reactionType: data[0].reaction_type };
          }
        }
      }

      setExtras(result);
    };

    fetchExtras();
  }, [notifications]);

  return extras;
}

const REACTION_ICON_MAP: Record<string, React.ElementType> = {
  like: ThumbsUp,
  love: Heart,
  insightful: Lightbulb,
  laugh: Smile,
  sad: Frown,
};

function getNotificationIcon(type: string, reactionType?: string) {
  const s = 10;
  const sw = 1.8;
  const cls = "text-muted-foreground/60";
  if (type === "like" && reactionType) {
    const Icon = REACTION_ICON_MAP[reactionType] || ThumbsUp;
    return <Icon size={s} strokeWidth={sw} className={cls} />;
  }
  switch (type) {
    case "like":
      return <ThumbsUp size={s} strokeWidth={sw} className={cls} />;
    case "comment":
      return <MessageCircle size={s} strokeWidth={sw} className={cls} />;
    case "follow":
      return <UserPlus size={s} strokeWidth={sw} className={cls} />;
    case "new_article":
      return <Bell size={s} strokeWidth={sw} className={cls} />;
    default:
      return <Bell size={s} strokeWidth={sw} className="text-muted-foreground/40" />;
  }
}

function getNotificationText(
  type: string,
  actorName: string,
  articleTitle?: string,
  extras?: { commentPreview?: string; reactionType?: string }
) {
  const reactionLabel = extras?.reactionType ? REACTION_LABELS[extras.reactionType] : null;

  switch (type) {
    case "like":
      return (
        <>
          <strong className="font-medium">{actorName}</strong>
          {reactionLabel
            ? <> واکنش <span className="text-foreground/70 font-medium">«{reactionLabel}»</span> نشان داد</>
            : <> واکنش نشان داد</>
          }
          {articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    case "comment":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> نظر داد
          {extras?.commentPreview && (
            <span className="text-muted-foreground/60 block text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
              «{extras.commentPreview}»
            </span>
          )}
          {!extras?.commentPreview && articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    case "follow":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> شما را دنبال کرد
        </>
      );
    case "new_article":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> مقاله جدیدی منتشر کرد
          {articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    default:
      return <span>اعلان جدید</span>;
  }
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification,
    settings, updateSettings
  } = useNotifications();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
  const extras = useNotificationExtras(notifications);

  const [showSettings, setShowSettings] = useState(false);

  const handlePushToggle = async (checked: boolean) => {
    if (checked) await subscribe();
    else await unsubscribe();
  };

  if (!user) {
    return (
      <AppLayout>
        <SEOHead title="اعلانات" description="اعلانات نوبهار" ogUrl="/notifications" noIndex />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Bell size={22} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-[15px] font-bold mb-1.5">اعلان‌ها</h2>
          <p className="text-muted-foreground text-[12px] mb-5 max-w-[220px] leading-relaxed">
            برای دریافت اعلان وارد شوید
          </p>
          <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-full px-5 h-8 text-[12px]">
            ورود / ثبت نام
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="اعلانات" description="اعلانات نوبهار" ogUrl="/notifications" noIndex />
      <OfflineFallback>
        <div className="min-h-screen animate-fade-in">
          {/* Header */}
          <div className="sticky top-11 z-30 bg-background border-b border-border/60 px-5 py-2.5 flex items-center justify-between">
            <h1 className="text-[14px] font-bold">اعلان‌ها</h1>
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-md"
                >
                  <CheckCheck size={12} />
                  <span>خواندن همه</span>
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors rounded-md"
              >
                {showSettings ? <X size={16} strokeWidth={1.5} /> : <Settings size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Settings Panel — compact & refined */}
          {showSettings && (
            <div className="border-b border-border/40 px-5 py-3 animate-slide-down">
              <div className="space-y-0">
                {isSupported && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <BellRing size={13} className="text-muted-foreground/50" />
                      <div>
                        <span className="text-[12px]">اعلان‌های پوش</span>
                        <p className="text-[10px] text-muted-foreground/40 leading-tight">دریافت خارج از اپ</p>
                      </div>
                    </div>
                    <Switch checked={isSubscribed} onCheckedChange={handlePushToggle} disabled={permission === 'denied'} />
                  </div>
                )}
                {permission === 'denied' && (
                  <div className="text-[10px] text-muted-foreground/60 bg-muted/40 rounded-lg px-3 py-2 mb-1">
                    <p>اعلان‌ها در مرورگر مسدود شده‌اند.</p>
                    <p className="mt-0.5 text-muted-foreground/40 leading-relaxed">
                      برای فعال‌سازی، روی آیکون قفل 🔒 کنار آدرس سایت کلیک کنید و اعلان‌ها را مجاز کنید.
                    </p>
                  </div>
                )}
                {[
                  { key: "comments" as const, icon: MessageCircle, label: "نظرات" },
                  { key: "likes" as const, icon: Heart, label: "واکنش‌ها" },
                  { key: "follows" as const, icon: UserPlus, label: "دنبال‌کننده‌ها" },
                ].map(({ key, icon: Icon, label }) => (
                  <div key={key} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} className="text-muted-foreground/50" />
                      <span className="text-[12px]">{label}</span>
                    </div>
                    <Switch
                      checked={settings[key]}
                      onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <BellOff size={20} className="text-muted-foreground/35" />
              </div>
              <p className="text-[12px] text-muted-foreground/60">هنوز اعلانی ندارید</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => {
                const extra = extras[notification.id];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-2.5 px-5 py-3 border-b border-border/30 transition-colors relative group",
                      !notification.is_read && "bg-primary/[0.025]",
                      index < 8 && "animate-slide-up"
                    )}
                    style={index < 8 ? { animationDelay: `${index * 20}ms` } : undefined}
                  >
                    <Link
                      to={
                        notification.type === "follow"
                          ? `/profile/${notification.actor_id}`
                          : notification.article_id
                          ? `/article/${notification.article_id}`
                          : "#"
                      }
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      className="flex items-start gap-2.5 flex-1 min-w-0"
                    >
                      {/* Actor avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        {notification.actor?.avatar_url ? (
                          <img
                            src={notification.actor.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-[10px] font-bold text-muted-foreground/60">
                              {notification.actor?.display_name?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}
                        {/* Type badge on avatar */}
                        <div className="absolute -bottom-0.5 -left-0.5 w-[18px] h-[18px] rounded-full bg-background flex items-center justify-center shadow-sm border border-border/30 overflow-hidden">
                          {getNotificationIcon(notification.type, extra?.reactionType)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] leading-relaxed">
                          {getNotificationText(
                            notification.type,
                            notification.actor?.display_name || "کاربر",
                            notification.article?.title,
                            extra
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground/35 mt-0.5">
                          {getRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </Link>

                    {/* Unread dot */}
                    {!notification.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2.5 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </OfflineFallback>
    </AppLayout>
  );
};

export default Notifications;
