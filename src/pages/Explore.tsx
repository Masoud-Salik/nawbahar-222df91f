import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Hash, X, User, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn, toPersianNumber } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";

const topics = [
  { id: "politics", label: "سیاست", emoji: "🏛️" },
  { id: "culture", label: "فرهنگ", emoji: "🎭" },
  { id: "science", label: "علم", emoji: "🔬" },
  { id: "society", label: "جامعه", emoji: "👥" },
  { id: "economy", label: "اقتصاد", emoji: "💰" },
  { id: "health", label: "سلامت", emoji: "🏥" },
];

const trendingHashtags = [
  "افغانستان", "ادبیات", "تاریخ", "هنر", "فناوری", "آموزش",
];

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  specialty: string | null;
}

const Explore = () => {
  const { articles, refetch } = usePublishedArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    if (category) setActiveTopic(category);
    if (tag) setActiveTag(tag);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) searchUsers(debouncedQuery);
    else setSuggestedUsers([]);
  }, [debouncedQuery]);

  const searchUsers = async (query: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, specialty")
      .ilike("display_name", `%${query}%`)
      .limit(5);
    setSuggestedUsers(data || []);
  };

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (activeTopic) result = result.filter(a => a.tags?.some(t => t.toLowerCase() === activeTopic.toLowerCase()));
    if (activeTag) result = result.filter(a => a.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase()));
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) ||
        a.author?.display_name?.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, activeTopic, activeTag, debouncedQuery]);

  const handleTopicClick = (topicId: string) => {
    const newTopic = activeTopic === topicId ? null : topicId;
    setActiveTopic(newTopic);
    setActiveTag(null);
    setSearchQuery("");
    setSearchParams(newTopic ? { category: newTopic } : {});
  };

  const handleHashtagClick = (hashtag: string) => {
    setActiveTag(activeTag === hashtag ? null : hashtag);
    setActiveTopic(null);
    setSearchQuery("");
    setSearchParams(activeTag !== hashtag ? { tag: hashtag } : {});
  };

  const clearFilters = () => { setSearchQuery(""); setActiveTopic(null); setActiveTag(null); setSearchParams({}); };
  const hasActiveFilters = searchQuery || activeTopic || activeTag;

  return (
    <AppLayout>
      <SEOHead
        title="کاوش"
        description="جستجو و کاوش مقالات تخصصی نوبهار. موضوعات سیاست، فرهنگ، علم، جامعه، اقتصاد و سلامت."
        ogUrl="/explore"
      />
      <div className="animate-fade-in">
        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={16} />
            <Input
              placeholder="جستجوی مقالات، نویسندگان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pr-9 bg-muted/30 border-0 rounded-lg h-9 text-[13px] focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/30"
            />
          </div>

          {suggestedUsers.length > 0 && isSearchFocused && (
            <div className="mt-2 bg-background border border-border rounded-lg overflow-hidden animate-slide-down">
              <p className="text-[10px] text-muted-foreground/50 px-3 py-1.5 font-medium">نویسندگان</p>
              {suggestedUsers.map((user) => (
                <Link key={user.id} to={`/profile/${user.id}`} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center">
                      <User size={12} className="text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{user.display_name}</p>
                    {user.specialty && <p className="text-[10px] text-muted-foreground/50 line-clamp-1">{user.specialty}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Topics */}
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center gap-1",
                  activeTopic === topic.id
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-[10px]">{topic.emoji}</span>
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] transition-all duration-200",
                  activeTag === hashtag
                    ? "bg-foreground text-background"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                <Hash size={9} />
                {hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="px-5 pb-2 animate-slide-down">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTopic && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  {topics.find(t => t.id === activeTopic)?.label}
                  <button onClick={() => handleTopicClick(activeTopic)} className="mr-0.5"><X size={9} /></button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  #{activeTag}
                  <button onClick={() => handleHashtagClick(activeTag)} className="mr-0.5"><X size={9} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-[10px] text-muted-foreground/40 hover:text-foreground">پاک کردن</button>
            </div>
          </div>
        )}

        {/* Results */}
        {hasActiveFilters && (
          <div className="border-t border-border/40 pt-1">
            <div className="px-5 py-2">
              <p className="text-[11px] text-muted-foreground/40">
                {filteredArticles.length > 0 ? `${toPersianNumber(filteredArticles.length)} نتیجه` : "نتیجه‌ای یافت نشد"}
              </p>
            </div>
            <div>
              {filteredArticles.map((article, index) => (
                <div key={article.id} className="border-b border-border animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <ArticleCard article={article} onDelete={refetch} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasActiveFilters && (
          <div className="px-5 py-12 text-center border-t border-border/40">
            <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-muted-foreground/25" />
            </div>
            <p className="text-[12px] text-muted-foreground/40">موضوعی را انتخاب کنید یا جستجو کنید</p>
          </div>
        )}

        {/* About link */}
        <div className="px-5 py-4 border-t border-border/40">
          <Link to="/about" className="flex items-center gap-1.5 text-[11px] text-muted-foreground/30 hover:text-foreground transition-colors">
            <Info size={12} />
            <span>درباره نوبهار</span>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Explore;