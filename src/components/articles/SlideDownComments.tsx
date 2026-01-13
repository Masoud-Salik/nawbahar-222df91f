import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronUp, Send, ThumbsUp, CornerDownRight, Trash2, Flag, MoreVertical } from "lucide-react";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  onAddComment: (content: string, parentId?: string) => Promise<boolean>;
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
  const { toast } = useToast();

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const handleSubmit = async () => {
    const success = await onAddComment(newComment);
    if (success) {
      setNewComment("");
    }
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
      if (!error) {
        setLikedComments(prev => ({ ...prev, [commentId]: true }));
      }
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
      if (error.code === "23505") {
        toast({ title: "قبلاً گزارش کرده‌اید" });
      } else {
        toast({ title: "خطا در گزارش", variant: "destructive" });
      }
    } else {
      toast({ title: "نظر گزارش شد" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-border bg-muted/30 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          نظرات {comments.length > 0 && `(${comments.length})`}
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <ChevronUp size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Comment Input */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <Textarea
            placeholder={userId ? "نظر خود را بنویسید..." : "برای ثبت نظر وارد شوید"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!userId || submitting}
            className="min-h-[60px] resize-none text-sm"
          />
          <Button
            onClick={handleSubmit}
            disabled={!userId || !newComment.trim() || submitting}
            size="icon"
            className="shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            هنوز نظری ثبت نشده است
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topLevelComments.map((comment) => {
              const replies = getReplies(comment.id);
              const isExpanded = expandedReplies[comment.id];
              
              return (
                <div key={comment.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    {comment.author?.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
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
                      <p className="text-sm text-foreground leading-relaxed mt-1">
                        {comment.content}
                      </p>
                      
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
                        <div className="mt-3 flex gap-2">
                          <Textarea
                            placeholder="پاسخ شما..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[50px] resize-none text-xs"
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
                              className="text-xs text-primary"
                            >
                              مشاهده {replies.length} پاسخ
                            </button>
                          )}
                          
                          {isExpanded && (
                            <div className="space-y-3 border-r-2 border-border pr-3">
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
                                  </div>
                                </div>
                              ))}
                              <button 
                                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}
                                className="text-xs text-muted-foreground"
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
