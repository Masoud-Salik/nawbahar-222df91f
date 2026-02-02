import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle, XCircle, FlaskConical, Scale, Pen, Clock, Lightbulb, Bot } from "lucide-react";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";

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
  { key: "science", label: "دقت علمی", icon: FlaskConical, max: 15 },
  { key: "ethics", label: "اخلاق", icon: Scale, max: 10 },
  { key: "writing", label: "نگارش", icon: Pen, max: 10 },
  { key: "timing", label: "به‌روز بودن", icon: Clock, max: 10 },
  { key: "innovation", label: "نوآوری", icon: Lightbulb, max: 5 },
];

// AI pre-review scoring based on content analysis
function generateAIScores(content: string, title: string) {
  const contentLength = content.length;
  const wordCount = content.split(/\s+/).length;
  
  // Content quality signals
  const hasScientificTerms = /علم|تحقیق|مطالعه|پژوهش|بررسی|آمار|داده|نتیجه|روش/i.test(content);
  const hasEthicalTerms = /اخلاق|ارزش|احترام|مسئولیت|انصاف|عدالت/i.test(content);
  const hasReferences = /منبع|مرجع|کتاب|مقاله|نقل/i.test(content);
  const hasParagraphs = (content.match(/\n\n/g) || []).length >= 3;
  const hasProperTitle = title.length >= 10 && title.length <= 100;
  
  // Calculate scores
  const scienceBase = hasScientificTerms ? 10 : 6;
  const scienceBonus = hasReferences ? 3 : 0;
  const science = Math.min(15, scienceBase + scienceBonus + Math.floor(Math.random() * 3));
  
  const ethicsBase = hasEthicalTerms ? 7 : 5;
  const ethics = Math.min(10, ethicsBase + Math.floor(Math.random() * 2));
  
  const writingBase = hasParagraphs ? 6 : 4;
  const writingBonus = wordCount > 300 ? 2 : 0;
  const writing = Math.min(10, writingBase + writingBonus + Math.floor(Math.random() * 2));
  
  const timingBase = 5; // Default - can be improved with date detection
  const timing = Math.min(10, timingBase + Math.floor(Math.random() * 3));
  
  const innovationBase = hasProperTitle && contentLength > 1000 ? 3 : 2;
  const innovation = Math.min(5, innovationBase + Math.floor(Math.random() * 2));
  
  return { science, ethics, writing, timing, innovation };
}

export function ReviewModal({ article, onClose, onComplete }: ReviewModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // AI scores - simulate pre-review
  const aiScores = generateAIScores(article.content, article.title);

  // Editor scores - start with AI scores or existing scores
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

  const handleApprove = async () => {
    setLoading(true);
    
    // Calculate final weight using the formula
    // Final Weight = (Author Trust × 0.25) + (AI × 0.25) + (Editor × 0.30) + (Engagement × 0.20)
    const aiTotal = Object.values(aiScores).reduce((sum, v) => sum + v, 0);
    const editorTotal = totalScore;
    const authorTrust = 50; // Default, would fetch from profile
    const engagement = 0; // Initial
    
    const finalWeight = Math.round(
      (authorTrust * 0.25) +
      (aiTotal * 0.25) +
      (editorTotal * 0.30) +
      (engagement * 0.20)
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
      await updateAuthorReputation(article.author_id);
      toast({ title: "موفق!", description: "مقاله منتشر شد" });
      onComplete();
    }
    setLoading(false);
  };

  const updateAuthorReputation = async (authorId: string) => {
    const { data: authorArticles } = await supabase
      .from("articles")
      .select("editorial_score_science, editorial_score_ethics")
      .eq("author_id", authorId)
      .eq("status", "published");

    if (authorArticles && authorArticles.length > 0) {
      const avgReputation = authorArticles.reduce((acc, a) => {
        const science = a.editorial_score_science || 0;
        const ethics = a.editorial_score_ethics || 0;
        return acc + ((science + ethics) / 25) * 100;
      }, 0) / authorArticles.length;

      // Also update trust score based on performance
      const trustScore = Math.min(100, Math.round(avgReputation));

      await supabase
        .from("profiles")
        .update({ 
          reputation_score: Math.round(avgReputation),
          trust_score: trustScore,
        })
        .eq("id", authorId);
    }
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
          <header className="sticky top-0 z-10 bg-card border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                <X size={24} strokeWidth={1.5} />
              </button>
              <h1 className="text-lg font-semibold">بررسی مقاله</h1>
              <div className="w-10" />
            </div>
          </header>

          <div className="p-4 space-y-6">
            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{article.profiles?.display_name || "ناشناس"}</span>
              <span>{getRelativeTime(article.created_at)}</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground">{article.title}</h2>

            {/* Content Preview */}
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">
              {article.content}
            </div>

            {/* Scoring Section */}
            <div className="border-t border-border pt-6 space-y-5">
              <h3 className="font-semibold text-lg">امتیازدهی</h3>

              {scoreLabels.map(({ key, label, icon: Icon, max }) => {
                const aiValue = aiScores[key as keyof typeof aiScores];
                const editorValue = scores[key as keyof typeof scores];
                const isActive = activeSlider === key;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={cn(
                          "transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-sm font-medium">{label}</span>
                        {/* AI Score indicator */}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <Bot size={10} />
                          {aiValue}/{max}
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold transition-colors",
                        isActive ? "text-primary" : "text-foreground"
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

              {/* Total Score */}
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">امتیاز ویرایشگر</div>
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
                    className="flex-1 h-12 gap-2 text-muted-foreground"
                    disabled={loading}
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="flex-1 h-12 gap-2"
                    disabled={loading}
                  >
                    <CheckCircle size={18} />
                    ثبت ارزیابی
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
