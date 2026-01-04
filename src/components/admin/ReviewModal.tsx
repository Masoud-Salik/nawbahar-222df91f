import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle, XCircle, FlaskConical, Scale, Pen, Clock, Lightbulb } from "lucide-react";
import { formatSolarShort } from "@/lib/solarHijri";

interface AdminArticle {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status: string;
  created_at: string;
  total_feed_rank: number | null;
  editorial_score_science: number | null;
  editorial_score_ethics: number | null;
  editorial_score_writing: number | null;
  editorial_score_timing: number | null;
  editorial_score_innovation: number | null;
  profiles?: { display_name: string } | null;
}

interface ReviewModalProps {
  article: AdminArticle;
  onClose: () => void;
  onComplete: () => void;
}

const scoreLabels = [
  { key: "science", label: "علمی", icon: FlaskConical, max: 15, weight: 3 },
  { key: "ethics", label: "اخلاقی", icon: Scale, max: 10, weight: 2 },
  { key: "writing", label: "نگارش", icon: Pen, max: 10, weight: 1 },
  { key: "timing", label: "زمان‌بندی", icon: Clock, max: 10, weight: 1 },
  { key: "innovation", label: "نوآوری", icon: Lightbulb, max: 5, weight: 1 },
];

export function ReviewModal({ article, onClose, onComplete }: ReviewModalProps) {
  const [scores, setScores] = useState({
    science: article.editorial_score_science || 0,
    ethics: article.editorial_score_ethics || 0,
    writing: article.editorial_score_writing || 0,
    timing: article.editorial_score_timing || 0,
    innovation: article.editorial_score_innovation || 0,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalScore = 
    scores.science * 3 + 
    scores.ethics * 2 + 
    scores.writing + 
    scores.timing + 
    scores.innovation;

  const maxPossibleScore = 15 * 3 + 10 * 2 + 10 + 10 + 5; // 90

  const handleApprove = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("articles")
      .update({
        status: "published",
        editorial_score_science: scores.science,
        editorial_score_ethics: scores.ethics,
        editorial_score_writing: scores.writing,
        editorial_score_timing: scores.timing,
        editorial_score_innovation: scores.innovation,
        total_feed_rank: totalScore,
      })
      .eq("id", article.id);

    if (error) {
      toast({
        title: "خطا",
        description: "خطا در انتشار مقاله",
        variant: "destructive",
      });
    } else {
      // Update author's reputation score
      await updateAuthorReputation(article.author_id);
      
      toast({
        title: "موفق!",
        description: "مقاله با موفقیت منتشر شد",
      });
      onComplete();
    }
    setLoading(false);
  };

  const updateAuthorReputation = async (authorId: string) => {
    // Calculate author's new reputation (avg of science + ethics across all articles)
    const { data: authorArticles } = await supabase
      .from("articles")
      .select("editorial_score_science, editorial_score_ethics")
      .eq("author_id", authorId)
      .eq("status", "published");

    if (authorArticles && authorArticles.length > 0) {
      const avgReputation = authorArticles.reduce((acc, article) => {
        const science = article.editorial_score_science || 0;
        const ethics = article.editorial_score_ethics || 0;
        // Normalize: science is out of 15, ethics out of 10 = 25 total
        // Convert to 0-100 scale
        return acc + ((science + ethics) / 25) * 100;
      }, 0) / authorArticles.length;

      await supabase
        .from("profiles")
        .update({ reputation_score: Math.round(avgReputation) })
        .eq("id", authorId);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("articles")
      .update({
        status: "rejected",
      })
      .eq("id", article.id);

    if (error) {
      toast({
        title: "خطا",
        description: "خطا در رد مقاله",
        variant: "destructive",
      });
    } else {
      toast({
        title: "انجام شد",
        description: "مقاله رد شد",
      });
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-full max-w-screen-md mx-auto bg-background">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-card border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
              <h1 className="text-lg font-semibold">بررسی مقاله</h1>
              <div className="w-10" />
            </div>
          </header>

          {/* Article Content */}
          <div className="p-4 space-y-6">
            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{article.profiles?.display_name || "ناشناس"}</span>
              <span>{formatSolarShort(article.created_at)}</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground">{article.title}</h2>

            {/* Content */}
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>

            {/* Scoring Section */}
            <div className="border-t border-border pt-6 space-y-6">
              <h3 className="font-semibold text-lg">امتیازدهی</h3>

              {scoreLabels.map(({ key, label, icon: Icon, max, weight }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-primary" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        (×{weight})
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {scores[key as keyof typeof scores]} / {max}
                    </span>
                  </div>
                  <Slider
                    value={[scores[key as keyof typeof scores]]}
                    max={max}
                    step={1}
                    onValueChange={([value]) =>
                      setScores((prev) => ({ ...prev, [key]: value }))
                    }
                    className="w-full"
                  />
                </div>
              ))}

              {/* Total Score */}
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">امتیاز کل</div>
                <div className="text-3xl font-bold text-primary">
                  {totalScore}
                  <span className="text-lg text-muted-foreground">/{maxPossibleScore}</span>
                </div>
              </div>

              {/* Reject Reason */}
              {article.status === "pending" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">دلیل رد (اختیاری)</label>
                  <Textarea
                    placeholder="توضیحات برای نویسنده..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {article.status === "pending" && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1 h-12 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={loading}
                  >
                    <XCircle size={18} />
                    رد کردن
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="flex-1 h-12 gap-2"
                    disabled={loading}
                  >
                    <CheckCircle size={18} />
                    تأیید و انتشار
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
