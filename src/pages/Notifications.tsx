import { AppLayout } from "@/components/layout/AppLayout";
import { useNotifications, NotificationSettings } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Settings, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { useState } from "react";

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart size={18} className="text-destructive" fill="currentColor" />;
    case "comment":
      return <MessageCircle size={18} className="text-primary" fill="currentColor" />;
    case "follow":
      return <UserPlus size={18} className="text-accent-foreground" />;
    default:
      return <Bell size={18} className="text-muted-foreground" />;
  }
}

function getNotificationText(type: string, actorName: string, articleTitle?: string) {
  switch (type) {
    case "like":
      return (
        <>
          <strong>{actorName}</strong> مقاله شما را پسندید
          {articleTitle && <span className="text-muted-foreground">: «{articleTitle}»</span>}
        </>
      );
    case "comment":
      return (
        <>
          <strong>{actorName}</strong> روی مقاله شما نظر داد
          {articleTitle && <span className="text-muted-foreground">: «{articleTitle}»</span>}
        </>
      );
    case "follow":
      return (
        <>
          <strong>{actorName}</strong> شما را دنبال کرد
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
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    settings,
    updateSettings
  } = useNotifications();
  
  const [showSettings, setShowSettings] = useState(false);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Bell size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">اعلان‌های شما</h2>
          <p className="text-muted-foreground text-sm mb-6">
            برای مشاهده اعلان‌ها وارد شوید
          </p>
          <Button onClick={() => navigate("/auth")}>
            ورود / ثبت نام
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-11 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">اعلان‌ها</h1>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs gap-1.5 text-primary"
              >
                <CheckCheck size={16} />
                خواندن همه
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
            >
              {showSettings ? <X size={18} /> : <Settings size={18} />}
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-muted/50 border-b border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold">تنظیمات اعلان‌ها</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">اعلان نظرات</span>
                <Switch 
                  checked={settings.comments}
                  onCheckedChange={(checked) => updateSettings({ comments: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">اعلان پسندها</span>
                <Switch 
                  checked={settings.likes}
                  onCheckedChange={(checked) => updateSettings({ likes: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">اعلان دنبال‌کننده‌ها</span>
                <Switch 
                  checked={settings.follows}
                  onCheckedChange={(checked) => updateSettings({ follows: checked })}
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">هنوز اعلانی ندارید</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors relative group",
                  !notification.is_read && "bg-primary/5"
                )}
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
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      {getNotificationText(
                        notification.type,
                        notification.actor?.display_name || "کاربر",
                        notification.article?.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </Link>
                
                {/* Delete button */}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
                
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
