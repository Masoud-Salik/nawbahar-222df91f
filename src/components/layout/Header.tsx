import { Bell, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

export function Header() {
  const isVisible = useScrollDirection();
  const { theme, toggleTheme } = useTheme();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-card border-b border-border safe-top transition-transform duration-300",
        !isVisible && "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Logo - Right (RTL) */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">ک</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            کلک
          </span>
        </Link>

        {/* Actions - Left (RTL) */}
        <div className="flex items-center gap-1">
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun size={20} strokeWidth={1.5} />
            ) : (
              <Moon size={20} strokeWidth={1.5} />
            )}
          </Button>

          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
            <Bell size={22} strokeWidth={1.5} />
            <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}
