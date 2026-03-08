import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Crown, Plus, Edit3, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { SEOHead } from "@/components/SEOHead";

interface VIPPost {
  id: string;
  title: string;
  content: string;
  type: string;
  author_id: string | null;
  created_at: string;
}

const VIP = () => {
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<VIPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editPost, setEditPost] = useState<Partial<VIPPost>>({});

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vip_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSave = async () => {
    if (!editPost.title?.trim() || !editPost.content?.trim()) {
      toast({ title: "عنوان و محتوا الزامی است", variant: "destructive" });
      return;
    }

    if (editPost.id) {
      const { error } = await supabase
        .from("vip_posts")
        .update({ title: editPost.title, content: editPost.content, type: editPost.type || "announcement" })
        .eq("id", editPost.id);
      if (error) { toast({ title: "خطا", description: error.message, variant: "destructive" }); return; }
      toast({ title: "ویرایش شد ✅" });
    } else {
      const { error } = await supabase
        .from("vip_posts")
        .insert({ title: editPost.title, content: editPost.content, type: editPost.type || "announcement", author_id: user?.id });
      if (error) { toast({ title: "خطا", description: error.message, variant: "destructive" }); return; }
      toast({ title: "مطلب اضافه شد ✅" });
    }
    setEditPost({});
    setIsEditing(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vip_posts").delete().eq("id", id);
    if (!error) { toast({ title: "حذف شد" }); fetchPosts(); }
  };

  const typeLabels: Record<string, string> = {
    editorial: "سرمقاله",
    competition: "مسابقه",
    announcement: "اطلاعیه",
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="sticky top-11 z-30 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <h1 className="text-[15px] font-bold flex items-center gap-2">
            <Crown size={17} strokeWidth={1.5} className="text-muted-foreground/45" />
            محتوای ویژه
          </h1>
          {isAdmin && (
            <button
              onClick={() => { setIsEditing(true); setEditPost({ type: "announcement" }); }}
              className="p-2 text-muted-foreground/45 hover:text-foreground transition-colors"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Edit Form */}
        {isAdmin && isEditing && (
          <div className="px-5 py-4 border-b border-border space-y-3 animate-slide-down">
            <Input
              placeholder="عنوان"
              value={editPost.title || ""}
              onChange={(e) => setEditPost(prev => ({ ...prev, title: e.target.value }))}
              className="bg-muted/30 border-0 h-9 text-[13px]"
            />
            <Textarea
              placeholder="محتوا..."
              value={editPost.content || ""}
              onChange={(e) => setEditPost(prev => ({ ...prev, content: e.target.value }))}
              className="bg-muted/30 border-0 min-h-[80px] text-[13px]"
            />
            <div className="flex gap-1.5">
              {(["announcement", "editorial", "competition"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setEditPost(prev => ({ ...prev, type }))}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                    editPost.type === type ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditPost({}); }} className="text-[12px] h-8">انصراف</Button>
              <Button size="sm" onClick={handleSave} className="text-[12px] h-8 gap-1">
                <Save size={12} />
                ذخیره
              </Button>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length > 0 ? (
          <div>
            {posts.map((post) => (
              <div key={post.id} className="px-5 py-5 border-b border-border/40 animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                      {typeLabels[post.type] || post.type}
                    </span>
                    <h3 className="text-[15px] font-extrabold text-foreground leading-relaxed mt-1">{post.title}</h3>
                    <p className="text-[13px] text-muted-foreground/60 leading-[1.9] mt-2 whitespace-pre-wrap">{post.content}</p>
                    <p className="text-[10px] text-muted-foreground/30 mt-3">{getRelativeTime(post.created_at)}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        onClick={() => { setEditPost(post); setIsEditing(true); }}
                        className="p-1.5 text-muted-foreground/30 hover:text-foreground transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <Crown size={24} className="text-muted-foreground/25" />
            </div>
            <p className="text-[13px] text-muted-foreground/40">محتوای ویژه به زودی منتشر می‌شود</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VIP;