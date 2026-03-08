import { Bell, Settings, Info, Moon, Sun, Type, LogOut, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toPersianNumber, cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

export function Header() {
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('textSize') as any) || 'base';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(`text-${textSize}`);
    localStorage.setItem('textSize', textSize);
  }, [textSize]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  const textSizes = [
    { key: 'sm' as const, label: 'ک' },
    { key: 'base' as const, label: 'م' },
    { key: 'lg' as const, label: 'ب' },
    { key: 'xl' as const, label: 'خ' },
  ];

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

        <div className="flex items-center gap-1">
          <Link 
            to="/notifications" 
            className="relative flex items-center justify-center w-9 h-9 text-muted-foreground/45 hover:text-foreground transition-colors"
          >
            <Bell size={20} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center text-[7px] font-bold text-accent-foreground bg-accent rounded-full px-0.5 ring-2 ring-background">
                {unreadCount > 9 ? "۹+" : toPersianNumber(unreadCount)}
              </span>
            )}
          </Link>

          {/* Settings Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-9 h-9 text-muted-foreground/45 hover:text-foreground transition-colors"
              aria-label="تنظیمات"
            >
              <Settings size={19} strokeWidth={1.5} className={cn("transition-transform duration-300", menuOpen && "rotate-90")} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-lg animate-scale-in origin-top-left z-50 overflow-hidden">
                {/* Theme Toggle */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Moon size={15} strokeWidth={1.5} className="text-muted-foreground" /> : <Sun size={15} strokeWidth={1.5} className="text-muted-foreground" />}
                    <span className="text-[12.5px] text-foreground">حالت تاریک</span>
                  </div>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className={cn(
                      "w-10 h-[22px] rounded-full transition-colors relative",
                      isDark ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span className={cn(
                      "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-background shadow-sm transition-all",
                      isDark ? 'left-[2px]' : 'right-[2px]'
                    )} />
                  </button>
                </div>

                {/* Text Size */}
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <Type size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    <span className="text-[12.5px] text-foreground">اندازه متن</span>
                  </div>
                  <div className="flex gap-1">
                    {textSizes.map((ts) => (
                      <button
                        key={ts.key}
                        onClick={() => setTextSize(ts.key)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200",
                          textSize === ts.key
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {ts.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Panel */}
                {isAdmin && (
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                    className="w-full px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/50"
                  >
                    <Shield size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    پنل مدیریت
                  </button>
                )}

                {/* About */}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/about"); }}
                  className="w-full px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/50"
                >
                  <Info size={15} strokeWidth={1.5} className="text-muted-foreground" />
                  درباره نوبهار
                </button>

                {/* Install */}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/install"); }}
                  className="w-full px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/50"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  نصب اپلیکیشن
                </button>

                {/* Sign Out */}
                {user && (
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut size={15} strokeWidth={1.5} />
                    خروج از حساب
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
