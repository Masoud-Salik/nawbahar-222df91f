import { House, Search, Crown, Bell, CircleUserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { icon: House, path: "/" },
  { icon: Search, path: "/explore" },
  { icon: Crown, path: "/vip" },
  { icon: Bell, path: "/notifications", isBell: true },
  { icon: CircleUserRound, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 no-print">
      <div className="bg-background border-t border-border safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-11">
          {navItems.map(({ icon: Icon, path, isBell }) => {
            const isActive = location.pathname === path ||
              (path === "/profile" && location.pathname.startsWith("/profile"));

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "relative flex items-center justify-center flex-1 h-full transition-colors duration-150 focus:outline-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/45"
                )}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    className="transition-all duration-150"
                  />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center text-[7px] font-bold text-accent-foreground bg-accent rounded-full px-0.5 ring-2 ring-background">
                      {unreadCount > 9 ? "۹+" : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
