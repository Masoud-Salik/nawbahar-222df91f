import { Home, Search, BookOpen, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function BottomNav() {
  const location = useLocation();
  const isVisible = useScrollDirection();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", session.user.id)
          .single();
        setAvatarUrl(data?.avatar_url || null);
      }
    };
    loadAvatar();
  }, []);

  const isProfileActive = location.pathname === "/profile" || location.pathname.startsWith("/profile");
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 no-print transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-background border-t border-border/60 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-12">
          {/* Home */}
          <NavItem to="/" active={isActive("/")} label="خانه">
            <Home
              size={21}
              strokeWidth={isActive("/") ? 2.2 : 1.4}
              fill={isActive("/") ? "currentColor" : "none"}
            />
          </NavItem>

          {/* Search */}
          <NavItem to="/explore" active={isActive("/explore")} label="جستجو">
            <Search
              size={21}
              strokeWidth={isActive("/explore") ? 2.2 : 1.4}
            />
          </NavItem>

          {/* Write - Center prominent */}
          <Link
            to="/write"
            className="flex items-center justify-center flex-1 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md group"
            aria-label="نوشتن مقاله"
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
              isActive("/write")
                ? "bg-foreground text-background scale-105"
                : "bg-muted text-muted-foreground group-active:scale-90 group-active:bg-foreground/15"
            )}>
              <Plus size={20} strokeWidth={2} />
            </div>
          </Link>

          {/* VIP */}
          <NavItem to="/vip" active={isActive("/vip")} label="ویژه">
            <BookOpen
              size={21}
              strokeWidth={isActive("/vip") ? 2.2 : 1.4}
              fill={isActive("/vip") ? "currentColor" : "none"}
            />
          </NavItem>

          {/* Profile */}
          <Link
            to="/profile"
            className="flex items-center justify-center flex-1 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md group"
            aria-label="پروفایل"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={cn(
                  "w-[22px] h-[22px] rounded-full object-cover transition-all duration-200",
                  isProfileActive
                    ? "ring-[1.5px] ring-foreground scale-110"
                    : "opacity-45 group-active:opacity-70 group-active:scale-90"
                )}
              />
            ) : (
              <div className={cn(
                "w-[22px] h-[22px] rounded-full bg-muted-foreground/20 flex items-center justify-center transition-all duration-200",
                isProfileActive
                  ? "ring-[1.5px] ring-foreground scale-110"
                  : "group-active:scale-90 group-active:bg-muted-foreground/30"
              )}>
                <span className="text-[9px] text-muted-foreground font-bold">؟</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

/** Reusable nav item with tactile press feedback */
function NavItem({ to, active, children, label }: { to: string; active: boolean; children: React.ReactNode; label?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-center flex-1 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md group transition-colors duration-200",
        active ? "text-foreground" : "text-muted-foreground/40"
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300 group-active:scale-90">
        {children}
      </div>
    </Link>
  );
}
