import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FollowButton } from "@/components/FollowButton";
import { useAuth } from "@/hooks/useAuth";

interface Writer {
  id: string;
  display_name: string;
  avatar_url: string | null;
  specialty: string | null;
  article_count: number;
}

export function SuggestedWriters() {
  const { user } = useAuth();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWriters = async () => {
      // Get top writers by article count, excluding current user
      const { data: articles } = await supabase
        .from("articles")
        .select("author_id")
        .eq("status", "published");

      if (!articles || articles.length === 0) {
        setLoading(false);
        return;
      }

      // Count articles per author
      const counts: Record<string, number> = {};
      articles.forEach(a => {
        if (a.author_id !== user?.id) {
          counts[a.author_id] = (counts[a.author_id] || 0) + 1;
        }
      });

      const topAuthorIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      if (topAuthorIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, specialty")
        .in("id", topAuthorIds);

      if (profiles) {
        const writerList = profiles.map(p => ({
          ...p,
          article_count: counts[p.id] || 0,
        })).sort((a, b) => b.article_count - a.article_count);
        setWriters(writerList);
      }
      setLoading(false);
    };

    fetchWriters();
  }, [user?.id]);

  if (loading || writers.length === 0) return null;

  return (
    <div className="px-5 py-4">
      <h3 className="text-[12.5px] font-semibold text-muted-foreground mb-3">نویسندگان پیشنهادی</h3>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {writers.map((writer, i) => (
          <div
            key={writer.id}
            className="flex flex-col items-center gap-1.5 min-w-[80px] animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Link to={`/profile/${writer.id}`}>
              {writer.avatar_url ? (
                <img
                  src={writer.avatar_url}
                  alt={writer.display_name}
                  className="w-[48px] h-[48px] rounded-full object-cover ring-2 ring-border hover:ring-primary transition-all"
                  loading="lazy"
                />
              ) : (
                <div className="w-[48px] h-[48px] rounded-full bg-muted flex items-center justify-center ring-2 ring-border hover:ring-primary transition-all">
                  <span className="text-primary font-bold text-[16px]">
                    {writer.display_name?.charAt(0)}
                  </span>
                </div>
              )}
            </Link>
            <Link to={`/profile/${writer.id}`} className="text-[10.5px] font-medium text-foreground truncate max-w-[72px] text-center hover:text-primary transition-colors">
              {writer.display_name}
            </Link>
            <FollowButton userId={writer.id} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
