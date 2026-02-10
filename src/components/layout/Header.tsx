import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

export function Header() {
  const isVisible = useScrollDirection();
  const { unreadCount } = useNotifications();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/30 safe-top transition-transform duration-300",
        !isVisible && "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
        {/* Logo - Right side (RTL) */}
        <Link to="/" className="flex items-center group">
          <span className="text-lg font-black tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
            نوبهار
          </span>
          <span className="text-[9px] font-medium text-primary/60 mr-1.5 mt-1">β</span>
        </Link>

        {/* Notifications - Left side */}
        <Link to="/notifications" className="relative p-2 -ml-2">
          <button 
            className={cn(
              "p-1.5 transition-all duration-200 focus:outline-none rounded-full hover:bg-muted",
              unreadCount > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={`اعلانات ${unreadCount > 0 ? `(${unreadCount} خوانده نشده)` : ''}`}
          >
            <Bell size={18} strokeWidth={1.5} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary rounded-full px-1 animate-scale-in">
              {unreadCount > 9 ? "۹+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
