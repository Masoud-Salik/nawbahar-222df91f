import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineFallback } from "@/components/OfflineFallback";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Settings, Trash2, X, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, toPersianNumber } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart size={16} className="text-destructive" fill="currentColor" />;
    case "comment":
      return <MessageCircle size={16} className="text-primary" fill="currentColor" />;
    case "follow":
      return <UserPlus size={16} className="text-foreground" />;
    case "new_article":
      return <Bell size={16} className="text-primary" />;
    default:
      return <Bell size={16} className="text-muted-foreground" />;
  }
}

function getNotificationText(type: string, actorName: string, articleTitle?: string) {
  switch (type) {
    case "like":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> مقاله شما را پسندید
          {articleTitle && <span className="text-muted-foreground/60 block text-[11px] mt-0.5 line-clamp-1">«{articleTitle}»</span>}
        </>
      );
    case "comment":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> نظر داد
          {articleTitle && <span className="text-muted-foreground/60 block text-[11px] mt-0.5 line-clamp-1">«{articleTitle}»</span>}
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
          {articleTitle && <span className="text-muted-foreground/60 block text-[11px] mt-0.5 line-clamp-1">«{articleTitle}»</span>}
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
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Bell size={28} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-bold mb-2">اعلان‌ها</h2>
          <p className="text-muted-foreground text-[13px] mb-6 max-w-[240px] leading-relaxed">
            برای دریافت اعلان وارد شوید
          </p>
          <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-full px-6 h-9 text-[13px]">
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
        <div className="sticky top-11 z-30 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <h1 className="text-[15px] font-bold">اعلان‌ها</h1>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[11px] gap-1 text-primary h-8">
                <CheckCheck size={13} />
                خواندن همه
              </Button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-muted-foreground/45 hover:text-foreground transition-colors"
            >
              {showSettings ? <X size={17} strokeWidth={1.5} /> : <Settings size={17} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b border-border px-5 py-4 space-y-3 animate-slide-down">
            <h3 className="text-[12px] font-bold text-muted-foreground">تنظیمات اعلان‌ها</h3>
            <div className="space-y-2">
              {isSupported && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <BellRing size={14} className="text-muted-foreground" />
                    <div>
                      <span className="text-[13px]">اعلان‌های پوش</span>
                      <p className="text-[10px] text-muted-foreground/50">دریافت اعلان خارج از اپ</p>
                    </div>
                  </div>
                  <Switch checked={isSubscribed} onCheckedChange={handlePushToggle} disabled={permission === 'denied'} />
                </div>
              )}
              {permission === 'denied' && (
                <p className="text-[10px] text-destructive">اعلان‌ها در تنظیمات مرورگر مسدود شده‌اند.</p>
              )}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-muted-foreground" />
                  <span className="text-[13px]">نظرات جدید</span>
                </div>
                <Switch checked={settings.comments} onCheckedChange={(checked) => updateSettings({ comments: checked })} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-muted-foreground" />
                  <span className="text-[13px]">پسندها</span>
                </div>
                <Switch checked={settings.likes} onCheckedChange={(checked) => updateSettings({ likes: checked })} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <UserPlus size={14} className="text-muted-foreground" />
                  <span className="text-[13px]">دنبال‌کننده‌ها</span>
                </div>
                <Switch checked={settings.follows} onCheckedChange={(checked) => updateSettings({ follows: checked })} />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <BellOff size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-[13px] text-muted-foreground">هنوز اعلانی ندارید</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-3.5 border-b border-border/40 transition-colors relative group animate-slide-up",
                  !notification.is_read && "bg-primary/[0.03]"
                )}
                style={{ animationDelay: `${Math.min(index * 25, 150)}ms` }}
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
                  className="flex items-start gap-3 flex-1 min-w-0"
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-relaxed">
                      {getNotificationText(notification.type, notification.actor?.display_name || "کاربر", notification.article?.title)}
                    </p>
                    <p className="text-[11px] text-muted-foreground/40 mt-1">{getRelativeTime(notification.created_at)}</p>
                  </div>
                </Link>
                
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground/30 hover:text-destructive"
                  aria-label="حذف اعلان"
                >
                  <Trash2 size={13} />
                </button>
                
                {!notification.is_read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </OfflineFallback>
    </AppLayout>
  );
};

export default Notifications;