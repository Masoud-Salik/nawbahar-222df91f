import { MoreVertical, Bookmark, Share2, Flag, Pencil, Trash2, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ArticleActionsMenuProps {
  articleId: string;
  authorId: string;
  articleTitle?: string;
  onDelete?: () => void;
}

const REPORT_REASONS = [
  "محتوای نادرست یا گمراه‌کننده",
  "محتوای توهین‌آمیز یا نفرت‌پراکنی",
  "نقض حق تألیف یا کپی",
  "اسپم یا تبلیغات",
  "سایر موارد",
];

export function ArticleActionsMenu({ articleId, authorId, articleTitle, onDelete }: ArticleActionsMenuProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportStep, setReportStep] = useState<0 | 1 | 2>(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [bookmarkChecked, setBookmarkChecked] = useState(false);

  // Only get userId on mount — don't check bookmark yet
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Check bookmark status lazily when menu opens
  const checkBookmark = useCallback(async () => {
    if (bookmarkChecked || !userId) return;
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle();
    setIsBookmarked(!!bookmark);
    setBookmarkChecked(true);
  }, [articleId, userId, bookmarkChecked]);

  useEffect(() => {
    if (isOpen) checkBookmark();
  }, [isOpen, checkBookmark]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("touchstart", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("touchstart", close);
    };
  }, [isOpen]);

  const isOwner = userId === authorId;

  const handleSave = async () => {
    if (!userId) {
      toast({ title: "برای ذخیره باید وارد شوید", variant: "destructive" });
      return;
    }
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("article_id", articleId).eq("user_id", userId);
      setIsBookmarked(false);
      toast({ title: "از ذخیره‌ها حذف شد" });
    } else {
      await supabase.from("bookmarks").insert({ article_id: articleId, user_id: userId });
      setIsBookmarked(true);
      toast({ title: "ذخیره شد" });
    }
    setIsOpen(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      await navigator.share({ title: articleTitle || "مقاله", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
    setIsOpen(false);
  };

  const handleEdit = () => {
    setIsOpen(false);
    navigate(`/write?edit=${articleId}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("articles").delete().eq("id", articleId);
      if (error) throw error;
      toast({ title: "مقاله حذف شد" });
      onDelete?.();
    } catch {
      toast({ title: "خطا در حذف مقاله", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleNotInterested = () => {
    try {
      const hidden = JSON.parse(localStorage.getItem("hidden_articles") || "[]");
      if (!hidden.includes(articleId)) {
        hidden.push(articleId);
        localStorage.setItem("hidden_articles", JSON.stringify(hidden));
      }
    } catch { /* ignore */ }
    toast({ title: "این نوع مقالات کمتر نمایش داده خواهد شد" });
    setIsOpen(false);
    onDelete?.();
  };

  const handleReportStart = () => {
    setIsOpen(false);
    setReportStep(1);
  };

  const handleReportConfirm = () => {
    setReportStep(2);
  };

  const handleReportSubmit = async () => {
    if (!userId || !selectedReason) return;
    const reason = reportNote.trim()
      ? `${selectedReason} — ${reportNote.trim()}`
      : selectedReason;

    const { error } = await supabase.from("reported_comments").insert({
      comment_id: articleId,
      reporter_id: userId,
      reason,
    });
    if (error?.code === "23505") {
      toast({ title: "قبلاً گزارش کرده‌اید" });
    } else if (error) {
      toast({ title: "خطا در ثبت گزارش", variant: "destructive" });
    } else {
      toast({ title: "گزارش ثبت شد", description: "با تشکر از گزارش شما" });
    }
    setReportStep(0);
    setSelectedReason(null);
    setReportNote("");
  };

  const closeReport = () => {
    setReportStep(0);
    setSelectedReason(null);
    setReportNote("");
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
            <MoreVertical size={16} strokeWidth={1.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleSave} className="gap-3 text-sm">
            <Bookmark size={14} strokeWidth={1.5} />
            <span>{isBookmarked ? "حذف از ذخیره‌ها" : "ذخیره"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare} className="gap-3 text-sm">
            <Share2 size={14} strokeWidth={1.5} />
            <span>اشتراک‌گذاری</span>
          </DropdownMenuItem>

          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit} className="gap-3 text-sm">
                <Pencil size={14} strokeWidth={1.5} />
                <span>ویرایش</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsOpen(false); setShowDeleteDialog(true); }} className="gap-3 text-sm text-destructive focus:text-destructive">
                <Trash2 size={14} strokeWidth={1.5} />
                <span>حذف</span>
              </DropdownMenuItem>
            </>
          )}

          {!isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNotInterested} className="gap-3 text-sm">
                <EyeOff size={14} strokeWidth={1.5} />
                <span>علاقه‌مند نیستم</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReportStart} className="gap-3 text-sm text-destructive focus:text-destructive">
                <Flag size={14} strokeWidth={1.5} />
                <span>گزارش</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              این مقاله برای همیشه حذف خواهد شد و قابل بازیابی نیست. آیا مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "در حال حذف..." : "بله، حذف شود"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reportStep === 1} onOpenChange={(open) => !open && closeReport()}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>گزارش مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این مقاله را گزارش دهید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleReportConfirm}>
              بله، ادامه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reportStep === 2} onOpenChange={(open) => !open && closeReport()}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>علت گزارش</AlertDialogTitle>
            <AlertDialogDescription>
              لطفاً دلیل گزارش خود را انتخاب کنید
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-right text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedReason === reason
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/30"
                }`}
              >
                {reason}
              </button>
            ))}
            <Textarea
              placeholder="توضیحات اضافی (اختیاری)..."
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="min-h-[60px] resize-none text-sm mt-2"
            />
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReportSubmit}
              disabled={!selectedReason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ثبت گزارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
