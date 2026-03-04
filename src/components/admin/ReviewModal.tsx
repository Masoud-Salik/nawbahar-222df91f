import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle, XCircle, FlaskConical, Scale, Pen, Clock, Lightbulb, Bot, Eye, ArrowLeft } from "lucide-react";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface AdminArticle {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status: string;
  created_at: string;
  total_feed_rank: number | null;
  view_count?: number | null;
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
  { key: "science", label: "دقت علمی", icon: FlaskConical, max: 15, color: "text-blue-500" },
  { key: "ethics", label: "اخلاق", icon: Scale, max: 10, color: "text-emerald-500" },
  { key: "writing", label: "نگارش", icon: Pen, max: 10, color: "text-amber-500" },
  { key: "timing", label: "به‌روز بودن", icon: Clock, max: 10, color: "text-violet-500" },
  { key: "innovation", label: "نوآوری", icon: Lightbulb, max: 5, color: "text-rose-500" },
];

// AI pre-review scoring based on content analysis
function generateAIScores(content: string, title: string) {
  const wordCount = content.split(/\s+/).length;
  const hasScientificTerms = /علم|تحقیق|مطالعه|پژوهش|بررسی|آمار|داده|نتیجه|روش/i.test(content);
  const hasEthicalTerms = /اخلاق|ارزش|احترام|مسئولیت|انصاف|عدالت/i.test(content);
  const hasReferences = /منبع|مرجع|کتاب|مقاله|نقل/i.test(content);
  const hasParagraphs = (content.match(/\n\n/g) || []).length >= 3;
  const hasProperTitle = title.length >= 10 && title.length <= 100;
  
  const science = Math.min(15, (hasScientificTerms ? 10 : 6) + (hasReferences ? 3 : 0) + Math.floor(Math.random() * 3));
  const ethics = Math.min(10, (hasEthicalTerms ? 7 : 5) + Math.floor(Math.random() * 2));
  const writing = Math.min(10, (hasParagraphs ? 6 : 4) + (wordCount > 300 ? 2 : 0) + Math.floor(Math.random() * 2));
  const timing = Math.min(10, 5 + Math.floor(Math.random() * 3));
  const innovation = Math.min(5, (hasProperTitle && content.length > 1000 ? 3 : 2) + Math.floor(Math.random() * 2));
  
  return { science, ethics, writing, timing, innovation };
}

export function ReviewModal({ article, onClose, onComplete }: ReviewModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const { toast } = useToast();

  const aiScores = generateAIScores(article.content, article.title);

  const [scores, setScores] = useState({
    science: article.editorial_score_science ?? aiScores.science,
    ethics: article.editorial_score_ethics ?? aiScores.ethics,
    writing: article.editorial_score_writing ?? aiScores.writing,
    timing: article.editorial_score_timing ?? aiScores.timing,
    innovation: article.editorial_score_innovation ?? aiScores.innovation,
  });

  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const maxPossibleScore = 50;
  const scorePercent = Math.round((totalScore / maxPossibleScore) * 100);

  const handleApprove = async () => {
    setLoading(true);
    
    const aiTotal = Object.values(aiScores).reduce((sum, v) => sum + v, 0);
    const editorTotal = totalScore;
    const authorTrust = 50;
    const engagement = 0;
    
    const finalWeight = Math.round(
      (authorTrust * 0.25) + (aiTotal * 0.25) + (editorTotal * 0.30) + (engagement * 0.20)
    );

    const { error } = await supabase
      .from("articles")
      .update({
        status: "published",
        editorial_score_science: scores.science,
        editorial_score_ethics: scores.ethics,
        editorial_score_writing: scores.writing,
        editorial_score_timing: scores.timing,
        editorial_score_innovation: scores.innovation,
        ai_score_science: aiScores.science,
        ai_score_ethics: aiScores.ethics,
        ai_score_writing: aiScores.writing,
        ai_score_timing: aiScores.timing,
        ai_score_innovation: aiScores.innovation,
        total_feed_rank: editorTotal,
        final_weight: finalWeight,
      })
      .eq("id", article.id);

    if (error) {
      toast({ title: "خطا", description: "خطا در انتشار مقاله", variant: "destructive" });
    } else {
      const reputationUpdated = await updateAuthorReputation(article.author_id);
      toast({
        title: "✅ موفق!",
        description: reputationUpdated
          ? "مقاله با موفقیت منتشر شد"
          : "مقاله منتشر شد؛ اما امتیاز اعتباری نویسنده بروزرسانی نشد",
      });
      onComplete();
    }
    setLoading(false);
  };

  const handleSaveScores = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("articles")
      .update({
        editorial_score_science: scores.science,
        editorial_score_ethics: scores.ethics,
        editorial_score_writing: scores.writing,
        editorial_score_timing: scores.timing,
        editorial_score_innovation: scores.innovation,
        total_feed_rank: totalScore,
      })
      .eq("id", article.id);

    if (error) {
      toast({ title: "خطا", description: "خطا در ذخیره امتیازات", variant: "destructive" });
    } else {
      const reputationUpdated = await updateAuthorReputation(article.author_id);
      toast({
        title: "✅ ذخیره شد",
        description: reputationUpdated
          ? "امتیازات با موفقیت ثبت شد"
          : "امتیازات ثبت شد؛ اما امتیاز اعتباری نویسنده بروزرسانی نشد",
      });
      onComplete();
    }
    setLoading(false);
  };

  const updateAuthorReputation = async (authorId: string) => {
    const { data: authorArticles, error: authorArticlesError } = await supabase
      .from("articles")
      .select("editorial_score_science, editorial_score_ethics")
      .eq("author_id", authorId)
      .eq("status", "published");

    if (authorArticlesError) {
      console.error("Error fetching author articles for reputation:", authorArticlesError);
      return false;
    }

    if (!authorArticles || authorArticles.length === 0) return true;

    const avgReputation = authorArticles.reduce((acc, a) => {
      const science = a.editorial_score_science || 0;
      const ethics = a.editorial_score_ethics || 0;
      return acc + ((science + ethics) / 25) * 100;
    }, 0) / authorArticles.length;

    const trustScore = Math.min(100, Math.round(avgReputation));

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ reputation_score: Math.round(avgReputation), trust_score: trustScore })
      .eq("id", authorId);

    if (updateProfileError) {
      console.error("Error updating author reputation:", updateProfileError);
      return false;
    }

    return true;
  };

  const handleReject = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("articles")
      .update({ status: "rejected" })
      .eq("id", article.id);

    if (error) {
      toast({ title: "خطا", description: "خطا در رد مقاله", variant: "destructive" });
    } else {
      toast({ title: "انجام شد", description: "مقاله رد شد" });
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-full max-w-screen-md mx-auto bg-background">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={22} strokeWidth={1.5} />
              </button>
              <h1 className="text-base font-semibold">بررسی مقاله</h1>
              <Link
                to={`/article/${article.id}`}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="مشاهده مقاله"
              >
                <Eye size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </header>

          <div className="p-4 space-y-6 pb-24">
            {/* Meta */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-xs font-semibold">
                    {article.profiles?.display_name?.charAt(0) || "؟"}
                  </span>
                </div>
                <span className="font-medium text-foreground">{article.profiles?.display_name || "ناشناس"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  article.status === "pending" ? "bg-warning/10 text-warning" :
                  article.status === "published" ? "bg-primary/10 text-primary" :
                  "bg-destructive/10 text-destructive"
                )}>
                  {article.status === "pending" ? "در انتظار" :
                   article.status === "published" ? "منتشر شده" : "رد شده"}
                </span>
                <span>{getRelativeTime(article.created_at)}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground leading-relaxed">{article.title}</h2>

            {/* Content Preview */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <div className={cn(
                "text-sm text-foreground leading-relaxed whitespace-pre-wrap",
                !showFullContent && "line-clamp-6"
              )}>
                {article.content}
              </div>
              {article.content.length > 400 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-xs text-primary mt-3 hover:underline"
                >
                  {showFullContent ? "نمایش کمتر" : "نمایش کامل متن..."}
                </button>
              )}
            </div>

            {/* Word count info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{article.content.split(/\s+/).length.toLocaleString("fa-IR")} کلمه</span>
              <span>{Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200))} دقیقه مطالعه</span>
              {article.view_count != null && article.view_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {article.view_count.toLocaleString("fa-IR")} بازدید
                </span>
              )}
            </div>

            {/* Scoring Section */}
            <div className="border-t border-border pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">امتیازدهی ویرایشگر</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  <Bot size={12} />
                  <span>پیش‌ارزیابی هوش مصنوعی</span>
                </div>
              </div>

              {scoreLabels.map(({ key, label, icon: Icon, max, color }) => {
                const aiValue = aiScores[key as keyof typeof aiScores];
                const editorValue = scores[key as keyof typeof scores];
                const isActive = activeSlider === key;
                const isModified = editorValue !== aiValue;

                return (
                  <div key={key} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={cn(
                          "transition-colors",
                          isActive ? color : "text-muted-foreground"
                        )} />
                        <span className="text-sm font-medium">{label}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <Bot size={9} />
                          {aiValue}/{max}
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm font-bold transition-colors tabular-nums",
                        isActive ? color : isModified ? "text-primary" : "text-foreground"
                      )}>
                        {editorValue} / {max}
                      </span>
                    </div>
                    <Slider
                      value={[editorValue]}
                      max={max}
                      step={1}
                      onValueChange={([value]) => setScores(prev => ({ ...prev, [key]: value }))}
                      onPointerDown={() => setActiveSlider(key)}
                      onPointerUp={() => setActiveSlider(null)}
                      className="w-full"
                    />
                  </div>
                );
              })}

              {/* Total Score Display */}
              <div className="bg-gradient-to-l from-primary/10 to-primary/5 rounded-xl p-5 text-center border border-primary/10">
                <div className="text-xs text-muted-foreground mb-2">امتیاز نهایی ویرایشگر</div>
                <div className="text-4xl font-black text-primary tabular-nums">
                  {totalScore}
                  <span className="text-base text-muted-foreground font-normal">/{maxPossibleScore}</span>
                </div>
                <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {scorePercent >= 80 ? "عالی ✨" : scorePercent >= 60 ? "خوب 👍" : scorePercent >= 40 ? "متوسط" : "نیاز به بهبود"}
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
                    className="resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {article.status === "pending" ? (
                  <>
                    <Button
                      onClick={handleReject}
                      variant="outline"
                      className="flex-1 h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                      disabled={loading}
                    >
                      <XCircle size={16} />
                      رد مقاله
                    </Button>
                    <Button
                      onClick={handleApprove}
                      className="flex-1 h-12 gap-2"
                      disabled={loading}
                    >
                      <CheckCircle size={16} />
                      {loading ? "در حال ثبت..." : "تایید و انتشار"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleSaveScores}
                    className="flex-1 h-12 gap-2"
                    disabled={loading}
                  >
                    <CheckCircle size={16} />
                    {loading ? "در حال ذخیره..." : "ثبت امتیازات"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}