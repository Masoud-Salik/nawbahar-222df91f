import { Home, Compass, Star, User, PenTool } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/" },
  { icon: Compass, path: "/explore" },
  { icon: PenTool, path: "/write" },
  { icon: Star, path: "/vip" },
  { icon: User, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-12">
        {navItems.map(({ icon: Icon, path }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center justify-center p-2.5 transition-colors duration-150",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                size={22}
                strokeWidth={1.5}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
