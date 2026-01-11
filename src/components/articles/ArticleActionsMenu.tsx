import { MoreHorizontal, Bookmark, UserPlus, Share2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [articleId, authorId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    setUserId(uid || null);

    if (uid) {
      // Check bookmark status
      const { data: bookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", uid)
        .maybeSingle();
      setIsBookmarked(!!bookmark);

      // Check follow status
      if (uid !== authorId) {
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", uid)
          .eq("following_id", authorId)
          .maybeSingle();
        setIsFollowing(!!follow);
      }
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
  };

  const handleFollow = async () => {
    if (!userId) {
      toast({ title: "برای دنبال کردن باید وارد شوید", variant: "destructive" });
      return;
    }

    if (userId === authorId) {
      toast({ title: "نمی‌توانید خودتان را دنبال کنید" });
      return;
    }

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", authorId);
      setIsFollowing(false);
      toast({ title: "دنبال نمی‌کنید" });
    } else {
      await supabase.from("follows").insert({ follower_id: userId, following_id: authorId });
      setIsFollowing(true);
      toast({ title: "دنبال می‌کنید" });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      await navigator.share({ title: articleTitle || "مقاله", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
  };

  const handleReport = () => {
    toast({ title: "گزارش ثبت شد", description: "با تشکر از گزارش شما" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal size={18} strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleSave} className="gap-3">
          <Bookmark size={16} strokeWidth={1.5} />
          <span>{isBookmarked ? "حذف از ذخیره‌ها" : "ذخیره مقاله"}</span>
        </DropdownMenuItem>
        {userId !== authorId && (
          <DropdownMenuItem onClick={handleFollow} className="gap-3">
            <UserPlus size={16} strokeWidth={1.5} />
            <span>{isFollowing ? "لغو دنبال کردن" : "دنبال کردن نویسنده"}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleShare} className="gap-3">
          <Share2 size={16} strokeWidth={1.5} />
          <span>اشتراک‌گذاری</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReport} className="gap-3 text-destructive">
          <Flag size={16} strokeWidth={1.5} />
          <span>گزارش</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
