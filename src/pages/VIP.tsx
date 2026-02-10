import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Crown, Trophy, Award, Plus, Edit3, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

interface VIPPost {
  id: string;
  title: string;
  content: string;
  type: "editorial" | "competition" | "announcement";
  created_at: string;
}

const VIP_STORAGE_KEY = "nawbahar_vip_posts";

const VIP = () => {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [posts, setPosts] = useState<VIPPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editPost, setEditPost] = useState<Partial<VIPPost>>({});

  useEffect(() => {
    const saved = localStorage.getItem(VIP_STORAGE_KEY);
    if (saved) {
      try { setPosts(JSON.parse(saved)); } catch {}
    }
  }, []);

  const savePosts = (newPosts: VIPPost[]) => {
    setPosts(newPosts);
    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(newPosts));
  };

  const handleSave = () => {
    if (!editPost.title?.trim() || !editPost.content?.trim()) {
      toast({ title: "عنوان و محتوا الزامی است", variant: "destructive" });
      return;
    }

    if (editPost.id) {
      savePosts(posts.map(p => p.id === editPost.id ? { ...p, ...editPost } as VIPPost : p));
      toast({ title: "✅ ویرایش شد" });
    } else {
      const newPost: VIPPost = {
        id: crypto.randomUUID(),
        title: editPost.title,
        content: editPost.content,
        type: (editPost.type as VIPPost["type"]) || "announcement",
        created_at: new Date().toISOString(),
      };
      savePosts([newPost, ...posts]);
      toast({ title: "✅ مطلب اضافه شد" });
    }
    setEditPost({});
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    savePosts(posts.filter(p => p.id !== id));
    toast({ title: "حذف شد" });
  };

  const typeLabels: Record<string, string> = {
    editorial: "سرمقاله",
    competition: "مسابقه",
    announcement: "اطلاعیه",
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-5 animate-fade-in">
        {/* Hero */}
        <div className="text-center py-8 px-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-16 h-16 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute bottom-6 left-10 w-20 h-20 bg-accent/20 rounded-full blur-2xl" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Crown size={32} className="text-primary" />
            </div>
            <h1 className="text-xl font-black text-foreground mb-2">محتوای ویژه</h1>
            <p className="text-muted-foreground text-xs max-w-xs mx-auto leading-relaxed">
              سرمقاله‌ها، مسابقات و اطلاعیه‌های ویژه نوبهار
            </p>
          </div>
        </div>

        {/* Admin Add Button */}
        {isAdmin && (
          <Button
            onClick={() => { setIsEditing(true); setEditPost({ type: "announcement" }); }}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus size={16} />
            افزودن مطلب جدید
          </Button>
        )}

        {/* Edit Form */}
        {isAdmin && isEditing && (
          <Card className="border-primary/30">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="عنوان"
                value={editPost.title || ""}
                onChange={(e) => setEditPost(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="محتوا..."
                value={editPost.content || ""}
                onChange={(e) => setEditPost(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                {(["announcement", "editorial", "competition"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setEditPost(prev => ({ ...prev, type }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      editPost.type === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {typeLabels[type]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditPost({}); }}>انصراف</Button>
                <Button size="sm" onClick={handleSave} className="gap-1.5">
                  <Save size={14} />
                  ذخیره
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="pb-2 flex-row items-start justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {typeLabels[post.type]}
                    </span>
                    <CardTitle className="text-sm mt-2">{post.title}</CardTitle>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditPost(post); setIsEditing(true); }}
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Trophy size={16} className="text-primary" />
                  مسابقات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border/50">
                  <Trophy size={28} className="text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">به زودی اولین مسابقه نویسندگی اعلام می‌شود</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Award size={16} className="text-primary" />
                  سرمقاله‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border/50">
                  <Award size={28} className="text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">سرمقاله‌های منتخب به زودی منتشر می‌شوند</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VIP;
