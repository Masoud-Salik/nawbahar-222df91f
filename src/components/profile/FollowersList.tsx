import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FollowersListProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  specialty: string | null;
}

export function FollowersList({ isOpen, onClose, userId, type }: FollowersListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Use SECURITY DEFINER RPC functions to bypass follows RLS
    const rpcName = type === "followers" ? "get_follower_ids" : "get_following_ids";
    const { data: userIds } = await supabase.rpc(rpcName as any, { target_user_id: userId });

    if (userIds && (userIds as string[]).length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, specialty")
        .in("id", userIds as string[]);
      
      setUsers(profiles || []);
    } else {
      setUsers([]);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[70vh]">
        <DialogHeader>
          <DialogTitle>{type === "followers" ? "دنبال‌کنندگان" : "دنبال‌شده‌ها"}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {type === "followers" ? "هنوز دنبال‌کننده‌ای ندارید" : "هنوز کسی را دنبال نکرده‌اید"}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {profile.display_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {profile.display_name}
                    </p>
                    {profile.specialty && (
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.specialty}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
