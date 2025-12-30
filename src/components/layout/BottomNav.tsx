import { Home, Compass, Bookmark, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Calligraphy Pen (Qalam) SVG Icon
const QalamIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Compass, path: "/explore", label: "کاوش" },
  { icon: null, path: "/write", label: "نوشتن", isCenter: true },
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
                <QalamIcon size={20} />
              </Link>
            );
          }

          return (
            <Link
              key={path}
              to={path}
              className={cn("nav-icon", isActive && "active")}
            >
              {Icon && (
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive ? "currentColor" : "none"}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
