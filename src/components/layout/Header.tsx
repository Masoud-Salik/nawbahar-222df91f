import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { toPersianNumber } from "@/lib/utils";

export function Header() {
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border safe-top">
      <div className="flex items-center justify-between px-4 h-11 max-w-lg mx-auto">
        <Link to="/" className="flex items-center gap-1.5">
          <div className="w-6.5 h-6.5 rounded-md bg-primary flex items-center justify-center">
            <span className="text-[13px] font-black text-primary-foreground leading-none">ن</span>
          </div>
          <span className="text-[15px] font-black tracking-tight text-foreground leading-none">
            نوبهار
          </span>
        </Link>

        <Link 
          to="/notifications" 
          className="relative text-muted-foreground/45 hover:text-foreground transition-colors"
        >
          <Bell size={20} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center text-[7px] font-bold text-accent-foreground bg-accent rounded-full px-0.5 ring-2 ring-background">
              {unreadCount > 9 ? "۹+" : toPersianNumber(unreadCount)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
