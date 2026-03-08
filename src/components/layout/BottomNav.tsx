import { House, Search, Crown, PenLine, CircleUserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: House, path: "/" },
  { icon: Search, path: "/explore" },
  { icon: Crown, path: "/vip" },
  { icon: PenLine, path: "/write" },
  { icon: CircleUserRound, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 no-print">
      <div className="bg-background border-t border-border safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-11">
          {navItems.map(({ icon: Icon, path }) => {
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
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className="transition-all duration-150"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
