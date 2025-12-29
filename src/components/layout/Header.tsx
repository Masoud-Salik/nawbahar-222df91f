import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-card/98 backdrop-blur-xl border-b border-border safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Notification Bell - Left */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* Logo - Center/Right */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">ف</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Fetrat
          </span>
        </Link>

        {/* Spacer for balance */}
        <div className="w-10" />
      </div>
    </header>
  );
}
