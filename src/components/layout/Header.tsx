import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";

export function Header() {
  const isVisible = useScrollDirection();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-b border-border safe-top transition-transform duration-300",
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

        {/* Notification Bell - Left (RTL) */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
}
