import { AppLayout } from "@/components/layout/AppLayout";
import { Bookmark, WifiOff } from "lucide-react";

const Bookmarks = () => {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Bookmark size={36} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Your Library</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-4">
          Articles you save will appear here. They're available offline so you can read anytime.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-full">
          <WifiOff size={14} />
          <span>Works Offline</span>
        </div>
      </div>
    </AppLayout>
  );
};

export default Bookmarks;
