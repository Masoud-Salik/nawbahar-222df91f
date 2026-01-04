import { cn } from "@/lib/utils";
import { BadgeCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl: string | null;
  specialty: string | null;
  reputationScore: number;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

function getReputationRing(score: number): string {
  if (score >= 90) return "ring-4 ring-yellow-500";
  if (score >= 70) return "ring-4 ring-green-500";
  if (score >= 50) return "ring-4 ring-blue-500";
  return "ring-2 ring-muted";
}

function getReputationColor(score: number): string {
  if (score >= 90) return "text-yellow-500";
  if (score >= 70) return "text-green-500";
  if (score >= 50) return "text-blue-500";
  return "text-muted-foreground";
}

export function ProfileHeader({
  displayName,
  avatarUrl,
  specialty,
  reputationScore,
  isOwnProfile,
  onEditClick,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center py-8 px-4 bg-card rounded-2xl border border-border/60">
      {/* Avatar with Reputation Ring */}
      <div className={cn("rounded-full p-1", getReputationRing(reputationScore))}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-3xl">
              {displayName?.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Name & Badge */}
      <div className="flex items-center gap-2 mt-4">
        <h2 className="text-xl font-bold">{displayName}</h2>
        {reputationScore >= 70 && (
          <BadgeCheck
            size={20}
            className={cn(getReputationColor(reputationScore))}
          />
        )}
      </div>

      {/* Specialty */}
      {specialty && (
        <p className="text-muted-foreground text-sm mt-1">{specialty}</p>
      )}

      {/* Reputation Score */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm text-muted-foreground">امتیاز اعتبار:</span>
        <span className={cn("font-bold", getReputationColor(reputationScore))}>
          {reputationScore}
        </span>
      </div>

      {/* Edit Button */}
      {isOwnProfile && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="mt-4 gap-2"
        >
          <Settings size={16} />
          ویرایش پروفایل
        </Button>
      )}
    </div>
  );
}
