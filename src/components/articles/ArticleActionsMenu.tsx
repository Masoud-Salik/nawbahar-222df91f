import { MoreVertical, Bookmark, Share2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface ArticleActionsMenuProps {
  articleId: string;
  authorId: string;
  articleTitle?: string;
}

export function ArticleActionsMenu({ articleId, authorId, articleTitle }: ArticleActionsMenuProps) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [articleId]);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    setUserId(uid || null);

    if (uid) {
      const { data: bookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", uid)
        .maybeSingle();
      setIsBookmarked(!!bookmark);
    }
  };

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

  const handleReport = () => {
    toast({ title: "گزارش ثبت شد", description: "با تشکر از گزارش شما" });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
          <MoreVertical size={16} strokeWidth={1.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleSave} className="gap-3 text-sm">
          <Bookmark size={14} strokeWidth={1.5} />
          <span>{isBookmarked ? "حذف از ذخیره‌ها" : "ذخیره"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="gap-3 text-sm">
          <Share2 size={14} strokeWidth={1.5} />
          <span>اشتراک‌گذاری</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReport} className="gap-3 text-sm text-destructive">
          <Flag size={14} strokeWidth={1.5} />
          <span>گزارش</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
