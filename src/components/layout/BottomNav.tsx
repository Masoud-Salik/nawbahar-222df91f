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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {navItems.map(({ icon: Icon, path, label }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-colors duration-150 focus:outline-none",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
              />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
