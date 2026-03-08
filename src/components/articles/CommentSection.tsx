import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Send, ThumbsUp, CornerDownRight, MoreVertical, Flag, FileText } from "lucide-react";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn, toPersianNumber } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Comment } from "@/hooks/useComments";

interface ResponseArticle {
  id: string;
  title: string;
  created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
}

interface CommentSectionProps {
  comments: Comment[];
  loading: boolean;
  submitting: boolean;
  userId: string | null;
  onAddComment: (content: string, parentId?: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<void>;
  responses?: ResponseArticle[];
}

export function CommentSection({
  comments,
  loading,
  submitting,
  userId,
  onAddComment,
  onDeleteComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const responses = (arguments[0] as CommentSectionProps).responses || [];

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const handleSubmit = async () => {
    const success = await onAddComment(newComment);
    if (success) setNewComment("");
  };

  const handleReplySubmit = async (parentId: string) => {
    const success = await onAddComment(replyContent, parentId);
    if (success) {
      setReplyContent("");
      setReplyingTo(null);
      setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
    }
  };

  const handleLike = async (commentId: string) => {
    if (!userId) {
      toast({ title: "برای پسندیدن وارد شوید", variant: "destructive" });
      return;
    }
    const isLiked = likedComments[commentId];
    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
    }
    setLikedComments((prev) => ({ ...prev, [commentId]: !isLiked }));
  };

  const handleReport = async (commentId: string) => {
    if (!userId) return;
    const { error } = await supabase.from("reported_comments").insert({
      comment_id: commentId,
      reporter_id: userId,
      reason: "گزارش توسط کاربر",
    });
    if (error?.code === "23505") toast({ title: "قبلاً گزارش کرده‌اید" });
    else if (!error) toast({ title: "نظر گزارش شد" });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-5">
        نظرات {comments.length > 0 && (
          <span className="text-muted-foreground/50 font-normal">({toPersianNumber(comments.length)})</span>
        )}
      </h3>

      {/* Comment Input */}
      <div className="flex gap-2.5 mb-6">
        <Textarea
          placeholder={userId ? "نظر خود را بنویسید..." : "برای ثبت نظر وارد شوید"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!userId || submitting}
          className="min-h-[70px] resize-none text-sm bg-muted/30 border-border/50 focus:border-primary/30"
        />
        <Button
          onClick={handleSubmit}
          disabled={!userId || !newComment.trim() || submitting}
          size="icon"
          className="shrink-0 h-9 w-9 self-end"
        >
          <Send size={15} />
        </Button>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground/50">
          هنوز نظری ثبت نشده است
        </div>
      ) : (
        <div className="space-y-0">
          {topLevelComments.map((comment, i) => {
            const replies = getReplies(comment.id);
            const isExpanded = expandedReplies[comment.id];

            return (
              <div
                key={comment.id}
                className={cn(
                  "py-4 animate-fade-in",
                  i < topLevelComments.length - 1 && "border-b border-border/30"
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  <Link to={`/profile/${comment.user_id}`} className="flex-shrink-0">
                    {comment.author?.avatar_url ? (
                      <img src={comment.author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center">
                        <span className="text-primary text-xs font-semibold">
                          {comment.author?.display_name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${comment.user_id}`} className="text-[12.5px] font-semibold text-foreground hover:underline">
                        {comment.author?.display_name || "کاربر"}
                      </Link>
                      <span className="text-[10px] text-muted-foreground/40">
                        {getRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-[13.5px] text-foreground/85 leading-[1.9] mt-1">
                      {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={cn(
                          "flex items-center gap-1 text-[11px] transition-colors",
                          likedComments[comment.id] ? "text-primary" : "text-muted-foreground/40 hover:text-foreground"
                        )}
                      >
                        <ThumbsUp size={12} strokeWidth={1.5} fill={likedComments[comment.id] ? "currentColor" : "none"} />
                        <span>پسندیدن</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <CornerDownRight size={12} strokeWidth={1.5} />
                        <span>پاسخ</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground/30 hover:text-foreground p-0.5 focus:outline-none">
                            <MoreVertical size={13} strokeWidth={1.5} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[100px]">
                          {userId === comment.user_id && (
                            <DropdownMenuItem onClick={() => onDeleteComment(comment.id)} className="text-destructive text-xs gap-2">
                              <Trash2 size={12} />
                              حذف
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleReport(comment.id)} className="text-xs gap-2">
                            <Flag size={12} />
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
                          className="min-h-[50px] resize-none text-xs bg-muted/20"
                        />
                        <Button
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyContent.trim() || submitting}
                          size="sm"
                          className="self-end"
                        >
                          <Send size={13} />
                        </Button>
                      </div>
                    )}

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="mt-3">
                        {!isExpanded ? (
                          <button
                            onClick={() => setExpandedReplies((prev) => ({ ...prev, [comment.id]: true }))}
                            className="text-[11px] text-primary/70 hover:text-primary transition-colors"
                          >
                            مشاهده {toPersianNumber(replies.length)} پاسخ
                          </button>
                        ) : (
                          <div className="space-y-3 border-r-2 border-primary/10 pr-3 animate-fade-in">
                            {replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Link to={`/profile/${reply.user_id}`}>
                                  {reply.author?.avatar_url ? (
                                    <img src={reply.author.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center">
                                      <span className="text-primary text-[9px] font-semibold">
                                        {reply.author?.display_name?.charAt(0) || "?"}
                                      </span>
                                    </div>
                                  )}
                                </Link>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-foreground">
                                      {reply.author?.display_name || "کاربر"}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground/40">
                                      {getRelativeTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-foreground/80 leading-[1.8] mt-0.5">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => setExpandedReplies((prev) => ({ ...prev, [comment.id]: false }))}
                              className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
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
  );
}
