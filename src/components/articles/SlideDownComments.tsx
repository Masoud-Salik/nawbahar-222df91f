import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronUp, Send, ThumbsUp, CornerDownRight, Trash2, Flag, MoreVertical, Globe, ImagePlus, X, Loader2 } from "lucide-react";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn, toPersianNumber } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { compressArticleImage } from "@/lib/imageCompression";
import { playSuccessSound, playSubmitSound, playClickSound, playErrorSound } from "@/lib/sounds";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  image_url?: string | null;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface SlideDownCommentsProps {
  isOpen: boolean;
  articleId: string;
  comments: Comment[];
  loading: boolean;
  submitting: boolean;
  userId: string | null;
  onAddComment: (content: string, parentId?: string, imageUrl?: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onClose: () => void;
  refetch: () => void;
}

export function SlideDownComments({
  isOpen,
  articleId,
  comments,
  loading,
  submitting,
  userId,
  onAddComment,
  onDeleteComment,
  onClose,
  refetch,
}: SlideDownCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishingPublic, setPublishingPublic] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressArticleImage(file);
      setCommentImage(compressed);
      setCommentImagePreview(URL.createObjectURL(compressed));
    } catch {
      toast({ title: "خطا در پردازش تصویر", variant: "destructive" });
    }
  };

  const uploadCommentImage = async (): Promise<string | null> => {
    if (!commentImage || !userId) return null;
    setUploadingImage(true);
    try {
      const fileExt = commentImage.name.split('.').pop() || 'jpg';
      const fileName = `comments/${userId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('article-covers').upload(fileName, commentImage);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('article-covers').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch {
      toast({ title: "خطا در آپلود تصویر", variant: "destructive" });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const clearImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    let imageUrl: string | undefined;
    if (commentImage) {
      const url = await uploadCommentImage();
      if (url) imageUrl = url;
    }
    const success = await onAddComment(newComment, undefined, imageUrl);
    if (success) {
      setNewComment("");
      clearImage();
    }
  };

  const handlePublishAsPublicComment = async () => {
    if (!newComment.trim() || !userId) return;
    setPublishingPublic(true);

    try {
      let imageUrl: string | undefined;
      if (commentImage) {
        const url = await uploadCommentImage();
        if (url) imageUrl = url;
      }

      // First save as normal comment
      const success = await onAddComment(newComment, undefined, imageUrl);
      if (!success) { setPublishingPublic(false); return; }

      // Then create as article (response) with AI review
      const { data: article, error } = await supabase.from("articles").insert({
        title: newComment.trim().slice(0, 100) + (newComment.length > 100 ? "…" : ""),
        content: newComment.trim(),
        author_id: userId,
        status: "pending",
        parent_article_id: articleId,
        cover_image_url: imageUrl || null,
      }).select("id").single();

      if (error) throw error;

      // Run AI evaluation
      const { data: evalData, error: evalError } = await supabase.functions.invoke("ai-score-article", {
        body: { title: newComment.trim().slice(0, 100), content: newComment.trim(), articleId: article.id },
      });

      if (evalError) {
        // Fail-open: publish anyway
        await supabase.from("articles").update({ status: "published" }).eq("id", article.id);
        toast({ title: "✅ نظر به صورت عمومی منتشر شد" });
        playSuccessSound();
      } else if (evalData.approved) {
        toast({ title: "✅ نظر به صورت عمومی منتشر شد" });
        playSuccessSound();
      } else {
        toast({
          title: "نظر عمومی در انتظار بررسی",
          description: evalData.rejection_reason || "محتوا نیاز به بازبینی دارد",
        });
      }

      setNewComment("");
      clearImage();
    } catch (error: any) {
      toast({ title: "خطا", description: "مشکلی پیش آمد", variant: "destructive" });
      playErrorSound();
    } finally {
      setPublishingPublic(false);
    }
  };

  const handlePublishAsResponse = () => {
    navigate(`/write?response_to=${articleId}`);
  };

  const handleReplySubmit = async (parentId: string) => {
    const success = await onAddComment(replyContent, parentId);
    if (success) {
      setReplyContent("");
      setReplyingTo(null);
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!userId) {
      toast({ title: "برای پسندیدن نظر وارد شوید", variant: "destructive" });
      return;
    }
    const isLiked = likedComments[commentId];
    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
      setLikedComments(prev => ({ ...prev, [commentId]: false }));
    } else {
      const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
      if (!error) setLikedComments(prev => ({ ...prev, [commentId]: true }));
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!userId) {
      toast({ title: "برای گزارش نظر وارد شوید", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("reported_comments").insert({
      comment_id: commentId,
      reporter_id: userId,
      reason: "گزارش توسط کاربر"
    });
    if (error) {
      if (error.code === "23505") toast({ title: "قبلاً گزارش کرده‌اید" });
      else toast({ title: "خطا در گزارش", variant: "destructive" });
    } else {
      toast({ title: "نظر گزارش شد" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-muted/20 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <span className="text-[13px] font-semibold text-foreground">
          نظرات {comments.length > 0 && <span className="text-muted-foreground font-normal">({toPersianNumber(comments.length)})</span>}
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
          <ChevronUp size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Comment Input */}
      <div className="px-4 py-3 border-b border-border/30">
        {/* Image preview */}
        {commentImagePreview && (
          <div className="relative mb-2 inline-block">
            <img src={commentImagePreview} alt="" className="h-16 rounded-lg object-cover" />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder={userId ? "نظر خود را بنویسید..." : "برای ثبت نظر وارد شوید"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!userId || submitting || publishingPublic}
              className="min-h-[50px] resize-none text-sm bg-background/50 pr-9"
            />
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={!userId}
              className="absolute top-2 right-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-30"
              title="افزودن تصویر"
            >
              <ImagePlus size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleSubmit}
              disabled={!userId || (!newComment.trim() && !commentImage) || submitting || uploadingImage}
              size="icon"
              className="shrink-0 h-8 w-8"
            >
              {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </Button>
            <Button
              onClick={handlePublishAsPublicComment}
              variant="ghost"
              size="icon"
              disabled={!userId || !newComment.trim() || publishingPublic}
              className="shrink-0 h-8 w-8 text-primary"
              title="نشر عمومی (بررسی هوش مصنوعی)"
            >
              {publishingPublic ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 flex items-center gap-1">
          <Globe size={9} />
          دکمه 🌐 نظر را هم ثبت و هم به عنوان مقاله عمومی منتشر می‌کند (پس از بررسی)
        </p>
      </div>

      {/* Comments List */}
      <div className="max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground animate-fade-in">
            هنوز نظری ثبت نشده است
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {topLevelComments.map((comment, i) => {
              const replies = getReplies(comment.id);
              const isExpanded = expandedReplies[comment.id];

              return (
                <div
                  key={comment.id}
                  className="px-4 py-3 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start gap-2">
                    {comment.author?.avatar_url ? (
                      <img src={comment.author.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-xs font-medium">
                          {comment.author?.display_name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {comment.author?.display_name || "کاربر"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {getRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-[13px] text-foreground leading-relaxed mt-1">
                        {comment.content}
                      </p>

                      {/* Comment image */}
                      {comment.image_url && (
                        <img
                          src={comment.image_url}
                          alt=""
                          className="mt-2 rounded-lg max-h-40 object-cover"
                          loading="lazy"
                        />
                      )}

                      {/* Comment Actions */}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            likedComments[comment.id] ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <ThumbsUp size={12} strokeWidth={1.5} fill={likedComments[comment.id] ? "currentColor" : "none"} />
                          <span>پسندیدن</span>
                        </button>

                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <CornerDownRight size={12} strokeWidth={1.5} />
                          <span>پاسخ</span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-0.5 focus:outline-none">
                              <MoreVertical size={14} strokeWidth={1.5} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[100px]">
                            {userId === comment.user_id && (
                              <DropdownMenuItem onClick={() => onDeleteComment(comment.id)} className="text-destructive text-xs">
                                <Trash2 size={12} className="ml-2" />
                                حذف
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleReportComment(comment.id)} className="text-xs">
                              <Flag size={12} className="ml-2" />
                              گزارش
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="mt-3 flex gap-2 animate-fade-in">
                          <Textarea
                            placeholder="پاسخ شما..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[50px] resize-none text-xs bg-background/50"
                          />
                          <Button
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={!replyContent.trim() || submitting}
                            size="sm"
                          >
                            <Send size={14} />
                          </Button>
                        </div>
                      )}

                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="mt-3">
                          {!isExpanded && (
                            <button
                              onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: true }))}
                              className="text-xs text-primary hover:underline"
                            >
                              مشاهده {toPersianNumber(replies.length)} پاسخ
                            </button>
                          )}
                          {isExpanded && (
                            <div className="space-y-3 border-r-2 border-primary/15 pr-3 animate-fade-in">
                              {replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-2">
                                  {reply.author?.avatar_url ? (
                                    <img src={reply.author.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-primary text-[10px] font-medium">
                                        {reply.author?.display_name?.charAt(0) || "?"}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-medium text-foreground">
                                        {reply.author?.display_name || "کاربر"}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {getRelativeTime(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-foreground leading-relaxed mt-0.5">
                                      {reply.content}
                                    </p>
                                    {reply.image_url && (
                                      <img src={reply.image_url} alt="" className="mt-1.5 rounded-lg max-h-32 object-cover" loading="lazy" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                بستن پاسخ‌ها
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
