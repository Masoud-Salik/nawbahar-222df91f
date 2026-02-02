import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validation } from "@/lib/errorHandler";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export function useComments(articleId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchComments();
  }, [articleId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const fetchComments = async () => {
    setLoading(true);
    
    // Fetch comments including parent_id for nested replies
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, parent_id")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (error || !commentsData) {
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    // Fetch profiles for those users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.id, p])
    );

    const transformed: Comment[] = commentsData.map((item) => {
      const profile = profilesMap.get(item.user_id);
      return {
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        user_id: item.user_id,
        parent_id: item.parent_id,
        author: profile ? {
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        } : undefined,
      };
    });
    
    setComments(transformed);
    setLoading(false);
  };

  const addComment = async (content: string, parentId?: string) => {
    if (!userId) {
      toast({
        title: "نیاز به ورود",
        description: "برای ثبت نظر باید وارد شوید",
        variant: "destructive",
      });
      return false;
    }

    // Validate comment content
    const commentError = validation.comment.validate(content);
    if (commentError) {
      toast({
        title: "خطا",
        description: commentError,
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId || null,
    });

    if (error) {
      toast({
        title: "خطا",
        description: "مشکلی در ثبت نظر پیش آمد",
        variant: "destructive",
      });
      setSubmitting(false);
      return false;
    }

    toast({ title: parentId ? "پاسخ ثبت شد" : "نظر شما ثبت شد" });
    await fetchComments();
    setSubmitting(false);
    return true;
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
      toast({ title: "نظر حذف شد" });
    }
  };

  return {
    comments,
    loading,
    submitting,
    userId,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
}