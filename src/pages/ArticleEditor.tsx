import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const ArticleEditor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً عنوان و متن مقاله را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("articles").insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "موفق!",
        description: "مقاله شما با موفقیت ثبت شد و در انتظار بررسی است",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی در ثبت مقاله پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/98 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-lg font-semibold">نوشتن مقاله</h1>
          <Button
            onClick={handlePublish}
            disabled={loading || !title.trim() || !content.trim()}
            size="sm"
            className="gap-2"
          >
            <Send size={16} />
            {loading ? "در حال ثبت..." : "انتشار"}
          </Button>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-screen-md mx-auto p-4 pb-20">
        <div className="space-y-4">
          <Input
            placeholder="عنوان مقاله..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
          />
          <Textarea
            placeholder="متن مقاله خود را اینجا بنویسید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60vh] border-0 resize-none px-0 focus-visible:ring-0 bg-transparent text-base leading-relaxed"
          />
        </div>
      </main>
    </div>
  );
};

export default ArticleEditor;
