import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getRelativeTime } from "@/lib/relativeTime";
import { Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  content: string;
  created_at: string;
  reviewer_id: string;
  reviewer?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ProfileReviewsProps {
  profileId: string;
  isOwnProfile: boolean;
}

export function ProfileReviews({ profileId, isOwnProfile }: ProfileReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [profileId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profile_reviews")
      .select("id, content, created_at, reviewer_id")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const reviewerIds = [...new Set(data.map((r) => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, display_name, avatar_url")
        .in("id", reviewerIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      const enriched = data.map((r) => ({
        ...r,
        reviewer: profileMap.get(r.reviewer_id),
      }));

      setReviews(enriched);

      if (user) {
        const mine = data.find((r) => r.reviewer_id === user.id);
        setExistingReview(mine?.id || null);
      }
    } else {
      setReviews([]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !text.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("profile_reviews")
      .insert({ profile_id: profileId, reviewer_id: user.id, content: text.trim() });

    if (error) {
      toast({
        title: "خطا",
        description: error.message.includes("duplicate")
          ? "نظر تان قبلا ثبت شده است متاسفانه"
          : "خطا در ثبت نظر",
        variant: "destructive",
      });
    } else {
      setText("");
      await fetchReviews();
    }
    setSubmitting(false);
  };

  const handleDelete = async (reviewId: string) => {
    await supabase.from("profile_reviews").delete().eq("id", reviewId);
    await fetchReviews();
  };

  const canReview = user && !isOwnProfile && !existingReview;

  return (
    <div className="mt-6 pt-5 border-t border-border/30">
      <h3 className="text-[13px] font-bold text-foreground mb-3">
        نظرات درباره این نویسنده
      </h3>

      {/* Review input */}
      {canReview && (
        <div className="flex items-start gap-2 mb-4">
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="نظر شما درباره این نویسنده..."
              className="w-full text-[12px] bg-muted/30 border border-border/30 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/40 leading-relaxed"
              rows={2}
              dir="rtl"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-muted-foreground/40">
                {text.length}/۵۰۰
              </span>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={12} strokeWidth={1.5} />
                <span>{submitting ? "..." : "ثبت نظر"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-4">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/40 text-center py-3">
          هنوز نظری ثبت نشده
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-2">
              <Link to={`/profile/${review.reviewer_id}`} className="shrink-0">
                {review.reviewer?.avatar_url ? (
                  <img
                    src={review.reviewer.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary">
                      {review.reviewer?.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/profile/${review.reviewer_id}`}
                    className="text-[11.5px] font-semibold text-foreground hover:underline"
                  >
                    {review.reviewer?.display_name}
                  </Link>
                  <span className="text-[9px] text-muted-foreground/40">
                    {getRelativeTime(review.created_at)}
                  </span>
                  {user?.id === review.reviewer_id && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors mr-auto"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-foreground/75 leading-relaxed mt-0.5">
                  {review.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
