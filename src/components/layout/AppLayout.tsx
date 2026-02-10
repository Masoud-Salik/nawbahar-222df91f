import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
  className?: string;
}

export function AppLayout({ children, hideHeader, hideNav, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <Header />}
      <main 
        className={`${!hideNav ? 'pb-16' : ''} ${!hideHeader ? 'pt-12' : ''} max-w-[540px] mx-auto ${className || ''}`}
        role="main"
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
