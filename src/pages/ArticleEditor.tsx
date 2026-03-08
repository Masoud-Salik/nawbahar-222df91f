import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send, ImagePlus, X, CornerUpRight, FileText, Bold, Italic, List, Quote, Hash, ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { compressArticleImage } from "@/lib/imageCompression";
import { sanitizeError, validation } from "@/lib/errorHandler";
import { toPersianNumber } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const DRAFT_KEY = "nobahar_draft";

const SUGGESTED_TAGS = [
  "سیاست", "فرهنگ", "علم", "جامعه", "اقتصاد", "سلامت",
  "افغانستان", "ادبیات", "تاریخ", "هنر", "فناوری", "آموزش",
];

interface AIResult {
  approved: boolean;
  rejection_reason: string;
  scores: { science: number; ethics: number; writing: number; timing: number; innovation: number };
  avg_percent: number;
}

const ArticleEditor = () => {
  const [searchParams] = useSearchParams();
  const responseToId = searchParams.get("response_to");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [parentArticle, setParentArticle] = useState<{ id: string; title: string } | null>(null);
  
  // AI Review state
  const [reviewState, setReviewState] = useState<"idle" | "reviewing" | "result">("idle");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  
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
          if (draft.tags) setTags(draft.tags);
        } catch (e) { /* ignore */ }
      }
    }
  }, [responseToId]);

  // Auto-save draft
  useEffect(() => {
    if (!responseToId) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, tags }));
    }
  }, [title, content, tags, responseToId]);

  useEffect(() => {
    if (responseToId) {
      supabase.from("articles").select("id, title").eq("id", responseToId).maybeSingle()
        .then(({ data }) => { if (data) setParentArticle(data); });
    }
  }, [responseToId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) navigate("/auth");
      else setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session?.user) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handlePublish = async () => {
    const titleError = validation.title.validate(title);
    if (titleError) { toast({ title: "خطا", description: titleError, variant: "destructive" }); return; }
    const contentError = validation.content.validate(content);
    if (contentError) { toast({ title: "خطا", description: contentError, variant: "destructive" }); return; }
    if (!user) { navigate("/auth"); return; }

    setLoading(true);
    setReviewState("reviewing");

    try {
      // Step 1: Upload cover image if any
      let coverImageUrl = null;
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('article-covers').upload(fileName, coverImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('article-covers').getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      }

      // Step 2: Insert as pending
      const { data: insertedArticle, error } = await supabase.from("articles").insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        status: "pending",
        cover_image_url: coverImageUrl,
        parent_article_id: responseToId || null,
        tags,
      }).select("id").single();

      if (error) throw error;

      // Step 3: Call AI evaluation (this will update status to published or rejected)
      const { data: evalData, error: evalError } = await supabase.functions.invoke("ai-score-article", {
        body: { title: title.trim(), content: content.trim(), articleId: insertedArticle.id },
      });

      if (evalError) {
        // If AI fails, still publish (fail-open for now)
        await supabase.from("articles").update({ status: "published" }).eq("id", insertedArticle.id);
        toast({ title: "✅ مقاله منتشر شد", description: "ارزیابی هوش مصنوعی در دسترس نبود" });
        if (!responseToId) localStorage.removeItem(DRAFT_KEY);
        navigate("/");
        return;
      }

      setAiResult(evalData);
      setReviewState("result");

      if (evalData.approved) {
        if (!responseToId) localStorage.removeItem(DRAFT_KEY);
      }
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
      setReviewState("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleResultClose = () => {
    if (aiResult?.approved) {
      navigate("/");
    } else {
      setReviewState("idle");
      setAiResult(null);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast({ title: "در حال فشرده‌سازی...", description: "تصویر در حال بهینه‌سازی است" });
      const compressedFile = await compressArticleImage(file);
      setCoverImage(compressedFile);
      setCoverPreview(URL.createObjectURL(compressedFile));
      toast({ title: "✅ موفق", description: `تصویر بهینه شد: ${Math.round(compressedFile.size / 1024)} KB` });
    } catch {
      toast({ title: "خطا", description: "مشکلی در پردازش تصویر پیش آمد", variant: "destructive" });
    }
  };

  const handleTextFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setContent(prev => prev ? prev + "\n\n" + text : text);
      if (!title.trim()) {
        const firstLine = text.split('\n')[0].trim();
        if (firstLine.length > 0 && firstLine.length < 100) setTitle(firstLine);
      }
      toast({ title: "✅ موفق", description: "محتوای فایل بارگذاری شد" });
    } catch {
      toast({ title: "خطا", description: "مشکلی در خواندن فایل پیش آمد", variant: "destructive" });
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    setContent(content.substring(0, start) + prefix + selectedText + suffix + content.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const scoreLabels = [
    { key: "science", label: "علمی", max: 15 },
    { key: "ethics", label: "اخلاقی", max: 10 },
    { key: "writing", label: "نگارش", max: 10 },
    { key: "timing", label: "به‌روز بودن", max: 10 },
    { key: "innovation", label: "نوآوری", max: 5 },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-11 max-w-screen-md mx-auto">
          <button onClick={() => navigate("/")} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-medium text-foreground">
            {responseToId ? "نوشتن پاسخ" : "نوشتن مقاله"}
          </h1>
          <Button 
            onClick={handlePublish} 
            disabled={loading || !title.trim() || !content.trim()} 
            size="sm" 
            className="gap-1.5 h-8 px-4"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} strokeWidth={1.5} />
            )}
            {loading ? "بررسی..." : "انتشار"}
          </Button>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-screen-md mx-auto px-4 py-4 pb-24">
        <div className="space-y-4">
          {/* Response indicator */}
          {parentArticle && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-primary/5 rounded-xl border border-primary/10">
              <CornerUpRight size={14} strokeWidth={1.5} className="text-primary" />
              <span>در پاسخ به:</span>
              <Link to={`/article/${parentArticle.id}`} className="text-foreground hover:underline line-clamp-1 font-medium">
                {parentArticle.title}
              </Link>
            </div>
          )}

          {/* File inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          <input ref={textFileInputRef} type="file" accept=".txt,.md,.rtf" onChange={handleTextFileUpload} className="hidden" />

          {/* Toolbar */}
          <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded-xl border border-border/50">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" title="افزودن تصویر">
              <ImagePlus size={18} strokeWidth={1.5} />
            </button>
            <button onClick={() => textFileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" title="بارگذاری فایل">
              <FileText size={18} strokeWidth={1.5} />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={() => insertFormat("**")} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" title="پررنگ">
              <Bold size={18} strokeWidth={1.5} />
            </button>
            <button onClick={() => insertFormat("*")} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" title="مورب">
              <Italic size={18} strokeWidth={1.5} />
            </button>
            <button onClick={() => insertFormat("\n- ", "")} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" title="لیست">
              <List size={18} strokeWidth={1.5} />
            </button>
            <button onClick={() => insertFormat("\n> ", "")} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" title="نقل قول">
              <Quote size={18} strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Cover Image Preview */}
          {coverPreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" />
              <button onClick={removeCoverImage} className="absolute top-2 left-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors">
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}
          
          <Input
            placeholder="عنوان..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent h-auto py-3"
            maxLength={300}
          />

          <Textarea
            ref={textareaRef}
            placeholder="متن مقاله خود را اینجا بنویسید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[50vh] border-0 resize-none px-0 focus-visible:ring-0 bg-transparent text-base"
            style={{ lineHeight: '2.2' }}
          />

          {/* Tags Section */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">برچسب‌ها</span>
              <span className="text-[10px] text-muted-foreground">({tags.length}/5)</span>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive ml-0.5 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {tags.length < 5 && (
              <div className="flex gap-2">
                <Input
                  placeholder="برچسب جدید..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                  className="h-9 text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()} className="h-9 shrink-0">
                  افزودن
                </Button>
              </div>
            )}
            
            {tags.length < 5 && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-[11px] hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Word count footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>{wordCount.toLocaleString("fa-IR")} کلمه</span>
            <span>~{readTime} دقیقه مطالعه</span>
          </div>
        </div>
      </main>

      {/* AI Review Loading */}
      <AlertDialog open={reviewState === "reviewing"}>
        <AlertDialogContent className="max-w-xs text-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">بررسی مقاله</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <ShieldCheck size={20} className="absolute inset-0 m-auto text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  هوش مصنوعی در حال بررسی محتوا و کیفیت مقاله شماست...
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Review Result */}
      <AlertDialog open={reviewState === "result"} onOpenChange={() => handleResultClose()}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {aiResult?.approved ? (
                <>
                  <ShieldCheck size={20} className="text-green-600" />
                  مقاله تأیید شد
                </>
              ) : (
                <>
                  <ShieldX size={20} className="text-destructive" />
                  مقاله تأیید نشد
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {aiResult?.approved ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    مقاله شما با موفقیت منتشر شد ✅
                  </p>
                ) : (
                  <p className="text-sm text-destructive/80 mb-4 leading-relaxed">
                    {aiResult?.rejection_reason}
                  </p>
                )}

                {/* Score breakdown */}
                {aiResult?.scores && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground/60 mb-2">نمره‌دهی هوش مصنوعی:</p>
                    {scoreLabels.map(({ key, label, max }) => {
                      const score = aiResult.scores[key];
                      const percent = (score / max) * 100;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-16 text-left">{label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent >= 60 ? "bg-green-500" : percent >= 40 ? "bg-yellow-500" : "bg-destructive"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 w-8 text-left">
                            {toPersianNumber(score)}/{toPersianNumber(max)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <span className="text-[11px] font-medium text-foreground">میانگین کل</span>
                      <span className={`text-[12px] font-bold ${
                        (aiResult.avg_percent || 0) >= 60 ? "text-green-600" : (aiResult.avg_percent || 0) >= 40 ? "text-yellow-600" : "text-destructive"
                      }`}>
                        {toPersianNumber(aiResult.avg_percent || 0)}٪
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleResultClose}>
              {aiResult?.approved ? "بازگشت به خانه" : "بازگشت و ویرایش"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArticleEditor;
