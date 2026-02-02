import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff size={16} />
      <span>شما آفلاین هستید. در حال نمایش محتوای ذخیره شده...</span>
    </div>
  );
}
