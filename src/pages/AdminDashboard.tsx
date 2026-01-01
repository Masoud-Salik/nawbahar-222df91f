import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock, FileText, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSolarShort } from "@/lib/solarHijri";
import { ReviewModal } from "@/components/admin/ReviewModal";

interface AdminArticle {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status: string;
  created_at: string;
  total_feed_rank: number | null;
  editorial_score_science: number | null;
  editorial_score_ethics: number | null;
  editorial_score_writing: number | null;
  editorial_score_timing: number | null;
  editorial_score_innovation: number | null;
  profiles?: { display_name: string } | null;
}

const AdminDashboard = () => {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchArticles(activeTab as "pending" | "published" | "rejected");
    }
  }, [isAdmin, activeTab]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "دسترسی غیرمجاز",
        description: "شما دسترسی ادمین ندارید",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
  };

  const fetchArticles = async (status: "pending" | "published" | "rejected") => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        content,
        author_id,
        status,
        created_at,
        total_feed_rank,
        editorial_score_science,
        editorial_score_ethics,
        editorial_score_writing,
        editorial_score_timing,
        editorial_score_innovation,
        profiles:author_id(display_name)
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت مقالات",
        variant: "destructive",
      });
    } else {
      const transformed: AdminArticle[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        author_id: item.author_id,
        status: item.status,
        created_at: item.created_at,
        total_feed_rank: item.total_feed_rank,
        editorial_score_science: item.editorial_score_science,
        editorial_score_ethics: item.editorial_score_ethics,
        editorial_score_writing: item.editorial_score_writing,
        editorial_score_timing: item.editorial_score_timing,
        editorial_score_innovation: item.editorial_score_innovation,
        profiles: item.profiles,
      }));
      setArticles(transformed);
    }
    setLoading(false);
  };

  const handleReviewComplete = () => {
    setSelectedArticle(null);
    fetchArticles(activeTab as "pending" | "published" | "rejected");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate("/")}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-lg font-semibold">داشبورد ادمین</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-md mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock size={16} />
              در انتظار
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2">
              <CheckCircle size={16} />
              منتشر شده
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle size={16} />
              رد شده
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">مقاله‌ای موجود نیست</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{article.profiles?.display_name || "ناشناس"}</span>
                      <span>{formatSolarShort(article.created_at)}</span>
                    </div>
                    {article.total_feed_rank && (
                      <div className="mt-2 text-xs text-primary">
                        امتیاز کل: {article.total_feed_rank}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Modal */}
      {selectedArticle && (
        <ReviewModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onComplete={handleReviewComplete}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
