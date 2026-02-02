import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send, ImagePlus, X, CornerUpRight, FileText, Bold, Italic, List, Quote } from "lucide-react";
import { compressArticleImage } from "@/lib/imageCompression";
import { sanitizeError, validation } from "@/lib/errorHandler";
import type { User } from "@supabase/supabase-js";

const DRAFT_KEY = "nobahar_draft";

const ArticleEditor = () => {
  const [searchParams] = useSearchParams();
  const responseToId = searchParams.get("response_to");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [parentArticle, setParentArticle] = useState<{ id: string; title: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load draft on mount
  useEffect(() => {
    if (!responseToId) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title) setTitle(draft.title);
          if (draft.content) setContent(draft.content);
        } catch (e) {
          console.error("Failed to load draft:", e);
        }
      }
    }
  }, [responseToId]);

  // Auto-save draft (only for non-response articles)
  useEffect(() => {
    if (!responseToId) {
      const draft = { title, content };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [title, content, responseToId]);

  // Fetch parent article if this is a response
  useEffect(() => {
    if (responseToId) {
      fetchParentArticle(responseToId);
    }
  }, [responseToId]);

  const fetchParentArticle = async (id: string) => {
    const { data } = await supabase
      .from("articles")
      .select("id, title")
      .eq("id", id)
      .maybeSingle();
    
    if (data) {
      setParentArticle(data);
    }
  };

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
    // Validate title
    const titleError = validation.title.validate(title);
    if (titleError) {
      toast({ title: "خطا", description: titleError, variant: "destructive" });
      return;
    }

    // Validate content
    const contentError = validation.content.validate(content);
    if (contentError) {
      toast({ title: "خطا", description: contentError, variant: "destructive" });
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

      // Insert article with PUBLISHED status
      const { error } = await supabase.from("articles").insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        status: "published",
        cover_image_url: coverImageUrl,
        parent_article_id: responseToId || null,
        tags: [],
      });

      if (error) throw error;

      // Clear draft on successful publish
      if (!responseToId) {
        localStorage.removeItem(DRAFT_KEY);
      }

      toast({
        title: "موفق!",
        description: responseToId ? "پاسخ شما منتشر شد" : "مقاله شما منتشر شد",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "خطا",
        description: sanitizeError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "در حال فشرده‌سازی...",
        description: "تصویر در حال بهینه‌سازی است",
      });

      const compressedFile = await compressArticleImage(file);
      
      setCoverImage(compressedFile);
      setCoverPreview(URL.createObjectURL(compressedFile));
      
      toast({
        title: "موفق",
        description: `تصویر بهینه شد: ${Math.round(compressedFile.size / 1024)} کیلوبایت`,
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در پردازش تصویر پیش آمد",
        variant: "destructive",
      });
    }
  };

  const handleTextFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setContent(prev => prev ? prev + "\n\n" + text : text);
      
      // Try to extract title from first line if empty
      if (!title.trim()) {
        const firstLine = text.split('\n')[0].trim();
        if (firstLine.length > 0 && firstLine.length < 100) {
          setTitle(firstLine);
        }
      }

      toast({
        title: "موفق",
        description: "محتوای فایل بارگذاری شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در خواندن فایل پیش آمد",
        variant: "destructive",
      });
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simple formatting helpers
  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    
    setContent(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate("/")}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-medium text-foreground">
            {responseToId ? "نوشتن پاسخ" : "نوشتن مقاله"}
          </h1>
          <Button
            onClick={handlePublish}
            disabled={loading || !title.trim() || !content.trim()}
            size="sm"
            className="gap-1.5 h-8 px-3"
          >
            <Send size={14} strokeWidth={1.5} />
            {loading ? "..." : "انتشار"}
          </Button>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-screen-md mx-auto px-4 py-4 pb-24">
        <div className="space-y-4">
          {/* Response indicator */}
          {parentArticle && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5 bg-muted/50 rounded-lg">
              <CornerUpRight size={14} strokeWidth={1.5} />
              <span>در پاسخ به:</span>
              <Link 
                to={`/article/${parentArticle.id}`} 
                className="text-foreground hover:underline line-clamp-1"
              >
                {parentArticle.title}
              </Link>
            </div>
          )}

          {/* File inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={textFileInputRef}
            type="file"
            accept=".txt,.md,.rtf"
            onChange={handleTextFileUpload}
            className="hidden"
          />

          {/* Toolbar */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="افزودن تصویر"
            >
              <ImagePlus size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => textFileInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="بارگذاری فایل متنی"
            >
              <FileText size={18} strokeWidth={1.5} />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => insertFormat("**")}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="پررنگ"
            >
              <Bold size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => insertFormat("*")}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="مورب"
            >
              <Italic size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => insertFormat("\n- ", "")}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="لیست"
            >
              <List size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => insertFormat("\n> ", "")}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="نقل قول"
            >
              <Quote size={18} strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Cover Image Preview */}
          {coverPreview && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" />
              <button
                onClick={removeCoverImage}
                className="absolute top-2 left-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}
          
          <Input
            placeholder="عنوان..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent h-auto py-2"
          />

          <Textarea
            ref={textareaRef}
            placeholder="متن مقاله خود را اینجا بنویسید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[50vh] border-0 resize-none px-0 focus-visible:ring-0 bg-transparent text-base"
            style={{ lineHeight: '2.2' }}
          />
        </div>
      </main>
    </div>
  );
};

export default ArticleEditor;