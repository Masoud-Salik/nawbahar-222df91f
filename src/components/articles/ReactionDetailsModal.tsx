import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { REACTION_LABELS, type ReactionKey } from "@/hooks/useCardReactions";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { getRelativeTime } from "@/lib/relativeTime";
import { toPersianNumber } from "@/lib/utils";
import { X } from "lucide-react";

interface ReactionDetail {
  user_id: string;
  reaction_type: string;
  created_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

interface ReactionDetailsModalProps {
  articleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReactionDetailsModal({ articleId, isOpen, onClose }: ReactionDetailsModalProps) {
  const [reactions, setReactions] = useState<ReactionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    
    const fetchReactions = async () => {
      const { data } = await supabase
        .from("reactions")
        .select("user_id, reaction_type, created_at")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) {
        setReactions([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setReactions(data.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || undefined,
      })));
      setLoading(false);
    };

    fetchReactions();
  }, [articleId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideScroll = (e: Event) => {
      if (contentRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("scroll", handleOutsideScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleOutsideScroll, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeCounts: Record<string, number> = {};
  reactions.forEach(r => {
    typeCounts[r.reaction_type] = (typeCounts[r.reaction_type] || 0) + 1;
  });

  const filteredReactions = activeFilter
    ? reactions.filter(r => r.reaction_type === activeFilter)
    : reactions;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/15 backdrop-blur-[2px] animate-fade-in" />
      <div
        ref={contentRef}
        className="relative w-full max-w-md bg-card rounded-t-2xl border border-border shadow-lg animate-slide-up max-h-[65vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">واکنش‌ها</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
              !activeFilter ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            همه {toPersianNumber(reactions.length)}
          </button>
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const IconComponent = REACTION_SVG_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 flex items-center gap-1 ${
                    activeFilter === type ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {IconComponent ? <IconComponent size={14} strokeWidth={1.5} /> : <span>{type}</span>}
                  <span>{toPersianNumber(count)}</span>
                </button>
              );
            })}
        </div>

        {/* Reaction list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredReactions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">واکنشی ثبت نشده</div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredReactions.map((reaction, i) => {
                const IconComponent = REACTION_SVG_ICONS[reaction.reaction_type];
                return (
                  <div
                    key={`${reaction.user_id}-${reaction.reaction_type}`}
                    className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {reaction.profile?.avatar_url ? (
                      <img src={reaction.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">
                          {reaction.profile?.display_name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        {reaction.profile?.display_name || "کاربر"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {getRelativeTime(reaction.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {IconComponent && <IconComponent size={18} strokeWidth={1.5} className="text-muted-foreground" />}
                      <span className="text-[10px] text-muted-foreground">
                        {REACTION_LABELS[reaction.reaction_type] || reaction.reaction_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
