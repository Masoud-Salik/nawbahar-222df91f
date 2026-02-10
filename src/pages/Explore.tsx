import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Hash, X, User, Sparkles, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
      <div className="space-y-4 animate-fade-in">
        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={17} />
            <Input
              placeholder="جستجوی مقالات، نویسندگان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pr-10 bg-muted/50 border-border/30 rounded-xl h-10 text-sm focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
            />
          </div>

          {suggestedUsers.length > 0 && isSearchFocused && (
            <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-lg animate-slide-down">
              <p className="text-[10px] text-muted-foreground px-3 py-1.5 bg-muted/50 font-medium">نویسندگان</p>
              {suggestedUsers.map((user) => (
                <Link key={user.id} to={`/profile/${user.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center">
                      <User size={14} className="text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.display_name}</p>
                    {user.specialty && <p className="text-[11px] text-muted-foreground line-clamp-1">{user.specialty}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Topics */}
        <div className="px-4">
          <h2 className="text-xs font-bold text-muted-foreground mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles size={12} className="text-primary" />
            موضوعات
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5",
                  activeTopic === topic.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-[11px]">{topic.emoji}</span>
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="px-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <TrendingUp size={12} className="text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">هشتگ‌های داغ</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all duration-200",
                  activeTag === hashtag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-secondary-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Hash size={10} />
                {hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* About link */}
        <div className="px-4">
          <Link to="/about" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-2">
            <Info size={14} />
            <span>درباره نوبهار</span>
          </Link>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="px-4 animate-slide-down">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTopic && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-medium">
                  {topics.find(t => t.id === activeTopic)?.emoji} {topics.find(t => t.id === activeTopic)?.label}
                  <button onClick={() => handleTopicClick(activeTopic)} className="mr-1"><X size={10} /></button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-medium">
                  #{activeTag}
                  <button onClick={() => handleHashtagClick(activeTag)} className="mr-1"><X size={10} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-[11px] text-destructive hover:underline font-medium">پاک کردن</button>
            </div>
          </div>
        )}

        {/* Results */}
        {hasActiveFilters && (
          <div className="border-t border-border/30 pt-3">
            <div className="px-4 mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                {filteredArticles.length > 0 ? `${filteredArticles.length} نتیجه` : "نتیجه‌ای یافت نشد"}
              </p>
            </div>
            <div className="space-y-3 px-3">
              {filteredArticles.map((article, index) => (
                <div key={article.id} className="animate-slide-up" style={{ animationDelay: `${index * 40}ms` }}>
                  <ArticleCard article={article} onDelete={refetch} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasActiveFilters && (
          <div className="px-4 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground">موضوعی را انتخاب کنید یا جستجو کنید</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
