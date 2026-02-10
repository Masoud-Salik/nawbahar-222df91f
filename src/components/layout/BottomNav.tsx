import { Home, Compass, User, PenLine, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Compass, path: "/explore", label: "کاوش" },
  { icon: PenLine, path: "/write", label: "نوشتن" },
  { icon: Sparkles, path: "/vip", label: "ویژه" },
  { icon: User, path: "/profile", label: "پروفایل" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/30 safe-bottom no-print">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {navItems.map(({ icon: Icon, path, label }) => {
          const isActive = location.pathname === path || 
            (path === "/profile" && location.pathname.startsWith("/profile"));

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-all duration-200 focus:outline-none rounded-lg min-h-[48px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground/60 hover:text-foreground active:scale-95"
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-[9px] transition-opacity duration-200",
                isActive ? "font-semibold" : "font-normal"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
