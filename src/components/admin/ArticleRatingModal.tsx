import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FlaskConical, Scale, Pen, Clock, Lightbulb } from "lucide-react";

interface ArticleRatingModalProps {
  articleId: string;
  authorId: string;
  open: boolean;
  onClose: () => void;
  currentScores?: {
    science: number;
    ethics: number;
    writing: number;
    timing: number;
    innovation: number;
  };
}

const scoreLabels = [
  { key: "science", label: "دقت علمی", icon: FlaskConical, max: 15 },
  { key: "ethics", label: "اخلاق", icon: Scale, max: 10 },
  { key: "writing", label: "نگارش", icon: Pen, max: 10 },
  { key: "timing", label: "به‌روز بودن", icon: Clock, max: 10 },
  { key: "innovation", label: "نوآوری", icon: Lightbulb, max: 5 },
];

export function ArticleRatingModal({
  articleId,
  authorId,
  open,
  onClose,
  currentScores,
}: ArticleRatingModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({
    science: currentScores?.science || 0,
    ethics: currentScores?.ethics || 0,
    writing: currentScores?.writing || 0,
    timing: currentScores?.timing || 0,
    innovation: currentScores?.innovation || 0,
  });

  const totalScore = Object.values(scores).reduce((acc, v) => acc + v, 0);
  const maxScore = scoreLabels.reduce((acc, s) => acc + s.max, 0);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update article scores
      const { error: articleError } = await supabase
        .from("articles")
        .update({
          editorial_score_science: scores.science,
          editorial_score_ethics: scores.ethics,
          editorial_score_writing: scores.writing,
          editorial_score_timing: scores.timing,
          editorial_score_innovation: scores.innovation,
          total_feed_rank: totalScore,
        })
        .eq("id", articleId);

      if (articleError) throw articleError;

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

      toast({
        title: "موفق!",
        description: "امتیازات مقاله ثبت شد",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>امتیازدهی مقاله</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {scoreLabels.map((score) => {
            const Icon = score.icon;
            const value = scores[score.key as keyof typeof scores];
            return (
              <div key={score.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-primary" />
                    <span className="text-sm font-medium">{score.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {value} / {score.max}
                  </span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([v]) =>
                    setScores((prev) => ({ ...prev, [score.key]: v }))
                  }
                  max={score.max}
                  step={1}
                  className="w-full"
                />
              </div>
            );
          })}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold">مجموع امتیاز</span>
              <span className="text-lg font-bold text-primary">
                {totalScore} / {maxScore}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "در حال ذخیره..." : "ثبت امتیاز"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
