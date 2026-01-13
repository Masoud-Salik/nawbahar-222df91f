import { Info, Bell } from "lucide-react";
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
        "fixed top-0 left-0 right-0 z-40 bg-card border-b border-border safe-top transition-transform duration-200",
        !isVisible && "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between px-4 h-11 max-w-lg mx-auto">
        {/* Info - Left side */}
        <Link to="/about">
          <button 
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            <Info size={18} strokeWidth={1.5} />
          </button>
        </Link>

        {/* Logo - Center */}
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-foreground">
            نوبهار
          </span>
        </Link>

        {/* Notifications - Right side */}
        <Link to="/notifications" className="relative">
          <button 
            className={cn(
              "p-1.5 transition-colors focus:outline-none",
              unreadCount > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell size={18} strokeWidth={1.5} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-medium text-primary-foreground bg-primary rounded-full px-1">
              {unreadCount > 9 ? "۹+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
