import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send, ImagePlus, X, CornerUpRight, FileText, Bold, Italic, List, Quote, Hash, ShieldCheck, ShieldX, Loader2, Save, CalendarClock, Link2, Search, ChevronUp, SpellCheck } from "lucide-react";
import { compressArticleImage } from "@/lib/imageCompression";
import { sanitizeError, validation } from "@/lib/errorHandler";
import { playSuccessSound } from "@/lib/sounds";
import { toPersianNumber } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { useArticleSearch, addCitation } from "@/hooks/useCitations";
import { usePublishingCapacity } from "@/hooks/usePublishingCapacity";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
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
  "وطن", "ادبیات", "تاریخ", "هنر", "فناوری", "آموزش",
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
  const editId = searchParams.get("edit");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parentArticle, setParentArticle] = useState<{ id: string; title: string } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // AI Review state
  const [reviewState, setReviewState] = useState<"idle" | "reviewing" | "result">("idle");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // Proofreading state
  interface ProofIssue { word: string; suggestion: string; type: "spelling" | "grammar" | "style"; reason: string; }
  const [proofIssues, setProofIssues] = useState<ProofIssue[]>([]);
  const [proofActive, setProofActive] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ProofIssue | null>(null);

  // Citations state
  const [citedArticles, setCitedArticles] = useState<{ id: string; title: string }[]>([]);
  const [citationSearchQuery, setCitationSearchQuery] = useState("");
  const [showCitationSearch, setShowCitationSearch] = useState(false);
  const { results: citationResults, searching: citationSearching, searchArticles } = useArticleSearch();
  const { stats: capacityStats, canPublish, loading: capacityLoading } = usePublishingCapacity();
  const { loading: authLoading, isAuthenticated } = useProtectedRoute();
  const { user } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing article for editing
  useEffect(() => {
    if (editId) {
      setIsEditMode(true);
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("articles")
          .select("title, content, tags, cover_image_url, parent_article_id, author_id")
          .eq("id", editId)
          .maybeSingle();

        if (error || !data) {
          toast({ title: "مقاله پیدا نشد", variant: "destructive" });
          navigate("/", { replace: true });
          return;
        }

        if (data.author_id !== session.user.id) {
          toast({ title: "دسترسی غیرمجاز", description: "تنها نویسنده مقاله می‌تواند آن را ویرایش کند.", variant: "destructive" });
          navigate("/", { replace: true });
          return;
        }

        setTitle(data.title || "");
        setContent(data.content || "");
        setTags(data.tags || []);
        if (data.cover_image_url) setCoverPreview(data.cover_image_url);
        if (data.parent_article_id) {
          const { data: parent, error: parentError } = await supabase.from("articles").select("id, title").eq("id", data.parent_article_id).maybeSingle();
          if (!parentError && parent) setParentArticle(parent);
        }
      });

      // Load existing citations
      supabase.from("citations").select("cited_article_id").eq("source_article_id", editId)
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            const ids = data.map(c => c.cited_article_id);
            const { data: articles } = await supabase.from("articles").select("id, title").in("id", ids);
            if (articles) setCitedArticles(articles);
          }
        });
    }
  }, [editId, navigate, toast]);

  // Load draft on mount (only for new articles)
  useEffect(() => {
    if (!responseToId && !editId) {
      const savedDraft = storage.get(DRAFT_KEY, null);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title) setTitle(draft.title);
          if (draft.content) setContent(draft.content);
          if (draft.tags) setTags(draft.tags);
        } catch (e) { /* ignore */ }
      }
    }
  }, [responseToId, editId]);

  // Auto-save draft
  useEffect(() => {
    if (!responseToId) {
      storage.set(DRAFT_KEY, JSON.stringify({ title, content, tags }));
    }
  }, [title, content, tags, responseToId]);

  useEffect(() => {
    if (responseToId) {
      supabase.from("articles").select("id, title").eq("id", responseToId).maybeSingle()
        .then(({ data }) => { if (data) setParentArticle(data); });
    }
  }, [responseToId]);

  // Remove old auth logic - handled by useProtectedRoute

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return null; // useProtectedRoute handles redirect
  }

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
      let coverImageUrl = coverPreview;
      if (coverImage) {
        // Compress image before upload
        const compressedImage = await compressArticleImage(coverImage, {
          maxSizeKB: 800,
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.82,
        });
        
        const fileExt = compressedImage.name.split('.').pop() || 'webp';
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('article-covers').upload(fileName, compressedImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('article-covers').getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      }

      let articleId: string;

      if (isEditMode && editId) {
        const { error } = await supabase.from("articles").update({
          title: title.trim(),
          content: content.trim(),
          cover_image_url: coverImageUrl,
          tags,
          status: "pending",
        }).eq("id", editId).eq("author_id", user.id);
        if (error) throw error;
        articleId = editId;
      } else {
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
        articleId = insertedArticle.id;
      }

      // Save citations
      if (citedArticles.length > 0) {
        // Remove old citations if editing
        if (isEditMode && editId) {
          await supabase.from("citations").delete().eq("source_article_id", editId);
        }
        for (const cited of citedArticles) {
          await addCitation(articleId, cited.id);
        }
      }

      // Step 3: Call AI evaluation
      const { data: evalData, error: evalError } = await supabase.functions.invoke("ai-score-article", {
        body: { title: title.trim(), content: content.trim(), articleId },
      });

      if (evalError) {
        await supabase.from("articles").update({ status: "published" }).eq("id", articleId);
        toast({ title: "✅ مقاله منتشر شد", description: "ارزیابی هوش مصنوعی در دسترس نبود" });
        playSuccessSound();
        if (!responseToId && !isEditMode) localStorage.removeItem(DRAFT_KEY);
        navigate("/");
        return;
      }

      setAiResult(evalData);
      setReviewState("result");

      if (evalData.approved) {
        if (!responseToId && !isEditMode) localStorage.removeItem(DRAFT_KEY);
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

  // Citation search handler
  const handleCitationSearch = (query: string) => {
    setCitationSearchQuery(query);
    if (query.length >= 2) {
      searchArticles(query);
    }
  };

  const addCitedArticle = (article: { id: string; title: string }) => {
    if (!citedArticles.find(a => a.id === article.id)) {
      setCitedArticles(prev => [...prev, article]);
    }
    setCitationSearchQuery("");
    setShowCitationSearch(false);
  };

  const removeCitedArticle = (id: string) => {
    setCitedArticles(prev => prev.filter(a => a.id !== id));
  };

  // Proofreading
  const handleProofread = async () => {
    if (!content.trim() || content.trim().length < 10) {
      toast({ title: "متن کوتاه است", description: "حداقل چند جمله بنویسید", variant: "destructive" });
      return;
    }
    setProofLoading(true);
    setProofActive(true);
    setProofIssues([]);
    setSelectedIssue(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-proofread", {
        body: { text: content },
      });
      if (error) throw error;
      setProofIssues(data?.issues || []);
      if (!data?.issues?.length) {
        toast({ title: "✅ متن شما مشکلی ندارد!" });
      }
    } catch {
      toast({ title: "خطا در بررسی ویراستاری", variant: "destructive" });
      setProofActive(false);
    } finally {
      setProofLoading(false);
    }
  };

  const applyProofFix = (issue: ProofIssue) => {
    setContent(prev => prev.replace(issue.word, issue.suggestion));
    setProofIssues(prev => prev.filter(i => i.word !== issue.word));
    setSelectedIssue(null);
  };

  const dismissProofIssue = (issue: ProofIssue) => {
    setProofIssues(prev => prev.filter(i => i.word !== issue.word));
    setSelectedIssue(null);
  };

  // Build highlighted content for proofreading overlay
  const getHighlightedContent = () => {
    if (!proofActive || proofIssues.length === 0) return null;
    let result = content;
    const parts: { text: string; issue?: ProofIssue }[] = [];
    let remaining = result;
    
    // Sort issues by position in text (first occurrence)
    const sortedIssues = [...proofIssues].sort((a, b) => {
      const posA = remaining.indexOf(a.word);
      const posB = remaining.indexOf(b.word);
      return posA - posB;
    });

    for (const issue of sortedIssues) {
      const idx = remaining.indexOf(issue.word);
      if (idx === -1) continue;
      if (idx > 0) parts.push({ text: remaining.slice(0, idx) });
      parts.push({ text: issue.word, issue });
      remaining = remaining.slice(idx + issue.word.length);
    }
    if (remaining) parts.push({ text: remaining });
    return parts;
  };
  const scoreLabels = [
    { key: "science", label: "علمی", max: 15 },
    { key: "ethics", label: "اخلاقی", max: 10 },
    { key: "writing", label: "نگارش", max: 10 },
    { key: "timing", label: "به‌روز بودن", max: 10 },
    { key: "innovation", label: "نوآوری", max: 5 },
  ] as const;

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleSaveDraft = async () => {
    const titleError = validation.title.validate(title);
    if (titleError) { toast({ title: "خطا", description: titleError, variant: "destructive" }); return; }
    if (!user) { navigate("/auth"); return; }

    setLoading(true);
    try {
      let coverImageUrl = coverPreview;
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('article-covers').upload(fileName, coverImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('article-covers').getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      }

      if (isEditMode && editId) {
        await supabase.from("articles").update({
          title: title.trim(), content: content.trim(), cover_image_url: coverImageUrl, tags, status: "pending",
        }).eq("id", editId);
      } else {
        await supabase.from("articles").insert({
          title: title.trim(), content: content.trim() || " ", author_id: user.id, status: "pending",
          cover_image_url: coverImageUrl, parent_article_id: responseToId || null, tags,
        });
      }
      localStorage.removeItem(DRAFT_KEY);
      toast({ title: "✅ پیش‌نویس ذخیره شد" });
      navigate("/profile");
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePublish = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({ title: "خطا", description: "لطفاً تاریخ و ساعت انتشار را وارد کنید", variant: "destructive" });
      return;
    }
    const titleError = validation.title.validate(title);
    if (titleError) { toast({ title: "خطا", description: titleError, variant: "destructive" }); return; }
    const contentError = validation.content.validate(content);
    if (contentError) { toast({ title: "خطا", description: contentError, variant: "destructive" }); return; }
    if (!user) { navigate("/auth"); return; }

    setLoading(true);
    try {
      let coverImageUrl = coverPreview;
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('article-covers').upload(fileName, coverImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('article-covers').getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      }

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      if (isEditMode && editId) {
        await supabase.from("articles").update({
          title: title.trim(), content: content.trim(), cover_image_url: coverImageUrl, tags,
          status: "pending", scheduled_at: scheduledAt,
        } as any).eq("id", editId);
      } else {
        await supabase.from("articles").insert({
          title: title.trim(), content: content.trim(), author_id: user.id, status: "pending",
          cover_image_url: coverImageUrl, parent_article_id: responseToId || null, tags,
          scheduled_at: scheduledAt,
        } as any);
      }
      localStorage.removeItem(DRAFT_KEY);
      toast({ title: "✅ مقاله برای انتشار زمان‌بندی شد", description: `تاریخ: ${scheduledDate} ساعت: ${scheduledTime}` });
      navigate("/profile");
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [showExtras, setShowExtras] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12 max-w-screen-md mx-auto">
          <button
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSaveDraft}
              disabled={loading || !title.trim()}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-colors disabled:opacity-30 flex items-center gap-1.5"
              title="ذخیره پیش‌نویس"
            >
              <Save size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">پیش‌نویس</span>
            </button>
            <Button 
              onClick={handlePublish} 
              disabled={loading || !title.trim() || !content.trim()} 
              size="sm" 
              className="gap-1.5 h-8 px-4"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={1.5} />}
              انتشار
            </Button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-screen-md mx-auto px-4 pt-3 pb-28">
        {/* Response indicator */}
        {parentArticle && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5 mb-3 bg-primary/5 rounded-lg border border-primary/10">
            <CornerUpRight size={13} className="text-primary shrink-0" />
            <span>پاسخ به:</span>
            <Link to={`/article/${parentArticle.id}`} className="text-foreground hover:underline line-clamp-1 font-medium">
              {parentArticle.title}
            </Link>
          </div>
        )}

        {/* File inputs (hidden) */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <input ref={textFileInputRef} type="file" accept=".txt,.md,.rtf" onChange={handleTextFileUpload} className="hidden" />

        {/* Cover Image Preview */}
        {coverPreview && (
          <div className="relative rounded-xl overflow-hidden mb-3">
            <img src={coverPreview} alt="Cover" className="w-full h-36 object-cover" />
            <button onClick={removeCoverImage} className="absolute top-2 left-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors">
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Title */}
        <Input
          placeholder="عنوان مقاله..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-bold border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 bg-transparent h-auto py-3 placeholder:text-muted-foreground/30"
          maxLength={300}
        />

        {/* Inline Toolbar */}
        <div className="flex items-center gap-0.5 py-2 border-b border-border/20">
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors" title="تصویر کاور">
            <ImagePlus size={16} strokeWidth={1.5} />
          </button>
          <button onClick={() => textFileInputRef.current?.click()} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors" title="بارگذاری فایل">
            <FileText size={16} strokeWidth={1.5} />
          </button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <button onClick={() => insertFormat("**")} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors" title="پررنگ">
            <Bold size={16} strokeWidth={1.5} />
          </button>
          <button onClick={() => insertFormat("*")} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors" title="مورب">
            <Italic size={16} strokeWidth={1.5} />
          </button>
          <button onClick={() => insertFormat("\n- ", "")} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors" title="لیست">
            <List size={16} strokeWidth={1.5} />
          </button>
          <button onClick={() => insertFormat("\n> ", "")} className="p-1.5 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors" title="نقل قول">
            <Quote size={16} strokeWidth={1.5} />
          </button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <button
            onClick={proofActive ? () => { setProofActive(false); setProofIssues([]); setSelectedIssue(null); } : handleProofread}
            disabled={proofLoading}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
              proofActive ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-foreground"
            }`}
            title="ویراستاری هوشمند"
          >
            {proofLoading ? <Loader2 size={16} className="animate-spin" /> : <SpellCheck size={16} strokeWidth={1.5} />}
          </button>
          <div className="flex-1" />
          {proofActive && proofIssues.length > 0 && (
            <span className="text-[10px] text-destructive/70 ml-2">{toPersianNumber(proofIssues.length)} مورد</span>
          )}
          <span className="text-[10px] text-muted-foreground/30">{toPersianNumber(wordCount)} کلمه</span>
        </div>

        {/* Content area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="متن مقاله خود را بنویسید..."
            value={content}
            onChange={(e) => { setContent(e.target.value); if (proofActive) { setProofActive(false); setProofIssues([]); } }}
            className={`min-h-[45vh] border-0 resize-none px-0 focus-visible:ring-0 bg-transparent text-[15px] placeholder:text-muted-foreground/25 ${proofActive && proofIssues.length > 0 ? "opacity-0 absolute inset-0" : ""}`}
            style={{ lineHeight: '2.2' }}
          />

          {/* Proofreading overlay */}
          {proofActive && proofIssues.length > 0 && (() => {
            const parts = getHighlightedContent();
            if (!parts) return null;
            return (
              <div
                className="min-h-[45vh] text-[15px] text-foreground whitespace-pre-wrap cursor-text"
                style={{ lineHeight: '2.2' }}
                onClick={() => textareaRef.current?.focus()}
              >
                {parts.map((part, i) => 
                  part.issue ? (
                    <span
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setSelectedIssue(selectedIssue?.word === part.issue!.word ? null : part.issue!); }}
                      className={`relative cursor-pointer border-b-2 transition-colors ${
                        part.issue.type === "spelling" ? "border-destructive/60 bg-destructive/8" :
                        part.issue.type === "grammar" ? "border-yellow-500/60 bg-yellow-500/8" :
                        "border-blue-500/60 bg-blue-500/8"
                      } ${selectedIssue?.word === part.issue.word ? "ring-2 ring-primary/30 rounded-sm" : ""}`}
                    >
                      {part.text}
                      {/* Tooltip */}
                      {selectedIssue?.word === part.issue.word && (
                        <span className="absolute bottom-full right-0 mb-1 z-10 w-56 p-2.5 bg-popover border border-border rounded-lg shadow-lg text-right animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <span className="flex items-center gap-1.5 mb-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              part.issue!.type === "spelling" ? "bg-destructive" :
                              part.issue!.type === "grammar" ? "bg-yellow-500" : "bg-blue-500"
                            }`} />
                            <span className="text-[10px] text-muted-foreground">
                              {part.issue!.type === "spelling" ? "املایی" : part.issue!.type === "grammar" ? "دستوری" : "سبکی"}
                            </span>
                          </span>
                          <span className="block text-[11px] text-muted-foreground leading-relaxed mb-2">{part.issue!.reason}</span>
                          <span className="flex gap-1.5">
                            <button
                              onClick={() => applyProofFix(part.issue!)}
                              className="flex-1 text-[11px] px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                            >
                              ← {part.issue!.suggestion}
                            </button>
                            <button
                              onClick={() => dismissProofIssue(part.issue!)}
                              className="text-[11px] px-2 py-1 text-muted-foreground rounded-md hover:bg-muted transition-colors"
                            >
                              رد
                            </button>
                          </span>
                        </span>
                      )}
                    </span>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </div>
            );
          })()}
        </div>

        {/* Extras Toggle */}
        <button
          onClick={() => setShowExtras(!showExtras)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-muted-foreground/50 hover:text-muted-foreground border-t border-border/20 transition-colors"
        >
          {showExtras ? "بستن تنظیمات" : "برچسب، ارجاع و زمان‌بندی"}
          <ChevronUp size={14} className={`transition-transform ${showExtras ? "" : "rotate-180"}`} />
        </button>

        {showExtras && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {/* Tags - Compact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-muted-foreground/50" />
                <span className="text-xs font-medium text-muted-foreground">برچسب‌ها</span>
                <span className="text-[10px] text-muted-foreground/40">({tags.length}/۵)</span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/8 text-primary rounded-full text-[11px] font-medium">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
              {tags.length < 5 && (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="برچسب..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                      <button key={tag} onClick={() => addTag(tag)} className="px-2 py-0.5 bg-muted/60 text-muted-foreground/60 rounded-full text-[10px] hover:bg-primary/10 hover:text-primary transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Citations - Compact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-muted-foreground/50" />
                  <span className="text-xs font-medium text-muted-foreground">ارجاعات</span>
                  {citedArticles.length > 0 && <span className="text-[10px] text-muted-foreground/40">({toPersianNumber(citedArticles.length)})</span>}
                </div>
                <button onClick={() => setShowCitationSearch(!showCitationSearch)} className="text-[10px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                  <Search size={10} /> افزودن
                </button>
              </div>
              {showCitationSearch && (
                <div className="space-y-1.5 animate-fade-in">
                  <Input placeholder="جستجوی مقاله..." value={citationSearchQuery} onChange={(e) => handleCitationSearch(e.target.value)} className="h-8 text-xs" autoFocus />
                  {citationSearching && <div className="flex justify-center py-1"><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}
                  {citationResults.filter(r => !citedArticles.find(c => c.id === r.id)).length > 0 && (
                    <div className="border border-border/30 rounded-lg overflow-hidden divide-y divide-border/20 max-h-[150px] overflow-y-auto">
                      {citationResults.filter(r => !citedArticles.find(c => c.id === r.id)).map(article => (
                        <button key={article.id} onClick={() => addCitedArticle(article)} className="w-full text-right px-3 py-1.5 text-[11px] hover:bg-muted/50 transition-colors line-clamp-1">{article.title}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {citedArticles.length > 0 && (
                <div className="space-y-1">
                  {citedArticles.map(article => (
                    <div key={article.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/20 rounded-md">
                      <Link2 size={10} className="text-primary/40 shrink-0" />
                      <span className="text-[11px] text-foreground/80 flex-1 line-clamp-1">{article.title}</span>
                      <button onClick={() => removeCitedArticle(article.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule - Compact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock size={14} className="text-muted-foreground/50" />
                <span className="text-xs font-medium text-muted-foreground">زمان‌بندی انتشار</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-8 px-2 text-xs bg-background border border-border/50 rounded-md flex-1" />
                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-8 px-2 text-xs bg-background border border-border/50 rounded-md w-24" />
                <Button size="sm" variant="outline" className="h-8 text-xs px-3 shrink-0" onClick={handleSchedulePublish} disabled={loading || !scheduledDate || !scheduledTime}>
                  تنظیم
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Review Loading */}
      <AlertDialog open={reviewState === "reviewing"}>
        <AlertDialogContent className="max-w-xs text-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-sm">بررسی مقاله</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="flex flex-col items-center gap-3 py-3">
                <div className="relative">
                  <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <ShieldCheck size={16} className="absolute inset-0 m-auto text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">
                  در حال بررسی کیفیت مقاله...
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
            <AlertDialogTitle className="flex items-center gap-2 text-sm">
              {aiResult?.approved ? (
                <><ShieldCheck size={18} className="text-green-600" /> مقاله تأیید شد</>
              ) : (
                <><ShieldX size={18} className="text-destructive" /> مقاله تأیید نشد</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {aiResult?.approved ? (
                  <p className="text-xs text-muted-foreground mb-3">مقاله شما با موفقیت منتشر شد ✅</p>
                ) : (
                  <p className="text-xs text-destructive/80 mb-3 leading-relaxed">{aiResult?.rejection_reason}</p>
                )}
                {aiResult?.scores && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground/50 mb-1.5">امتیازدهی:</p>
                    {scoreLabels.map(({ key, label, max }) => {
                      const score = aiResult.scores[key];
                      const percent = (score / max) * 100;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 text-left">{label}</span>
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent >= 60 ? "bg-green-500" : percent >= 40 ? "bg-yellow-500" : "bg-destructive"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground/50 w-7 text-left">
                            {toPersianNumber(score)}/{toPersianNumber(max)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
                      <span className="text-[10px] font-medium text-foreground">میانگین</span>
                      <span className={`text-[11px] font-bold ${
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
            <AlertDialogAction onClick={handleResultClose} className="text-xs">
              {aiResult?.approved ? "بازگشت به خانه" : "بازگشت و ویرایش"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArticleEditor;
