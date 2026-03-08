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
    <div className="min-h-screen bg-background flex flex-col">
      {!hideHeader && <Header />}
      <main 
        className={`${!hideNav ? 'pb-20' : ''} max-w-[540px] mx-auto w-full flex-1 ${className || ''}`}
        role="main"
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
