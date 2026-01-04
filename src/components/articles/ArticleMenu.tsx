import { MoreHorizontal, Pencil, Trash2, Flag, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArticleMenuProps {
  articleId: string;
  authorId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: () => void;
}

export function ArticleMenu({ 
  articleId, 
  authorId, 
  currentUserId, 
  isAdmin = false,
  onDelete 
}: ArticleMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const isOwner = currentUserId === authorId;
  const canManage = isOwner || isAdmin;

  const handleEdit = () => {
    navigate(`/write?edit=${articleId}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;
      
      toast.success("مقاله با موفقیت حذف شد");
      onDelete?.();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("خطا در حذف مقاله");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("لینک کپی شد");
    }
  };

  const handleReport = () => {
    toast.info("گزارش شما ثبت شد");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-40 bg-popover border border-border z-50"
          onClick={(e) => e.preventDefault()}
        >
          {canManage ? (
            <>
              <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                <Pencil size={16} />
                <span>ویرایش</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 size={16} />
                <span>حذف</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleShare} className="gap-2 cursor-pointer">
                <Share2 size={16} />
                <span>اشتراک‌گذاری</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="gap-2 cursor-pointer">
                <Flag size={16} />
                <span>گزارش</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این مقاله برای همیشه حذف خواهد شد و قابل بازیابی نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "در حال حذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
