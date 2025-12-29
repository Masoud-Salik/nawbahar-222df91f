import { Home, Compass, Bookmark, User, PenTool } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", position: "left" },
  { icon: Compass, path: "/explore", position: "left" },
  { icon: PenTool, path: "/write", position: "center" },
  { icon: Bookmark, path: "/bookmarks", position: "right" },
  { icon: User, path: "/profile", position: "right" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map(({ icon: Icon, path, position }) => {
          const isActive = location.pathname === path;
          const isCenter = position === "center";

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
                size={24}
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
