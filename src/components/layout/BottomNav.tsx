import { Home, Compass, Bookmark, User, PenTool } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Compass, path: "/explore", label: "کاوش" },
  { icon: PenTool, path: "/write", label: "نوشتن", isCenter: true },
  { icon: Bookmark, path: "/bookmarks", label: "کتابخانه" },
  { icon: User, path: "/profile", label: "نمایه" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {navItems.map(({ icon: Icon, path, isCenter }) => {
          const isActive = location.pathname === path;

          if (isCenter) {
            return (
              <Link key={path} to={path} className="nav-write">
                <Icon size={22} strokeWidth={2} />
              </Link>
            );
          }

          return (
            <Link
              key={path}
              to={path}
              className={cn("nav-icon", isActive && "active")}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                fill={isActive ? "currentColor" : "none"}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
