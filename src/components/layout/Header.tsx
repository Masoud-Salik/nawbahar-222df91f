import { Info, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground h-8 w-8"
          >
            <Info size={18} strokeWidth={1.5} />
          </Button>
        </Link>

        {/* Logo - Center */}
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-foreground">
            نوبهار
          </span>
        </Link>

        {/* Notifications - Right side */}
        <Link to="/notifications" className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground h-8 w-8"
          >
            <Bell size={18} strokeWidth={1.5} />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-medium text-primary-foreground bg-primary rounded-full px-1">
              {unreadCount > 9 ? "۹+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
