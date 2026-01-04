import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send, ImagePlus, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const ArticleEditor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      let coverImageUrl = null;
      
      // Upload cover image if exists
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('article-covers')
          .upload(fileName, coverImage);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('article-covers')
          .getPublicUrl(fileName);
        
        coverImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("articles").insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        status: "published",
        cover_image_url: coverImageUrl,
      });

      if (error) throw error;

      toast({
        title: "موفق!",
        description: "مقاله شما با موفقیت منتشر شد",
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

  const MAX_IMAGE_SIZE = 300 * 1024; // 300KB

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "خطا",
        description: "حجم تصویر بیش از حد مجاز است. لطفاً تصویری کمتر از ۳۰۰ کیلوبایت انتخاب کنید.",
        variant: "destructive",
      });
      return;
    }

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          {/* Cover Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {coverPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={coverPreview} alt="Cover" className="w-full h-48 object-cover" />
              <button
                onClick={removeCoverImage}
                className="absolute top-2 left-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ImagePlus size={28} />
              <span className="text-sm">افزودن تصویر کاور</span>
            </button>
          )}
          
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
