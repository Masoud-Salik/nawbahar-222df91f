import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Hash, X, User, TrendingUp, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn, toPersianNumber } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { SuggestedWriters } from "@/components/profile/SuggestedWriters";

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

  // Trending articles: sorted by engagement (reactions + comments + views)
  const trendingArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => ((b.reaction_count || 0) + (b.comment_count || 0) + (b.view_count || 0)) - ((a.reaction_count || 0) + (a.comment_count || 0) + (a.view_count || 0)))
      .slice(0, 8);
  }, [articles]);

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
  const hasActiveFilters = debouncedQuery || activeTopic || activeTag;

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
              className="pr-9 bg-muted/30 border-0 rounded-xl h-10 text-[13px] focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {suggestedUsers.length > 0 && isSearchFocused && (
            <div className="mt-2 bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm animate-slide-down">
              <p className="text-[10px] text-muted-foreground/50 px-3 py-1.5 font-medium border-b border-border/30">نویسندگان</p>
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
        <div className="px-5 pb-2">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 flex items-center gap-1.5 flex-shrink-0",
                  activeTopic === topic.id
                    ? "bg-foreground text-background"
                    : "bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-[12px]">{topic.emoji}</span>
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-1">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] transition-all duration-200",
                  activeTag === hashtag
                    ? "bg-foreground text-background"
                    : "text-muted-foreground/45 hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Hash size={8} strokeWidth={2} />
                {hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters bar */}
        {hasActiveFilters && (
          <div className="px-5 pb-2 animate-slide-down">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTopic && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  {topics.find(t => t.id === activeTopic)?.emoji} {topics.find(t => t.id === activeTopic)?.label}
                  <button onClick={() => handleTopicClick(activeTopic)} className="mr-0.5"><X size={9} /></button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  #{activeTag}
                  <button onClick={() => handleHashtagClick(activeTag)} className="mr-0.5"><X size={9} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors">پاک کردن</button>
            </div>
          </div>
        )}

        {/* Results or Trending */}
        {hasActiveFilters ? (
          <div className="border-t border-border/30">
            <div className="px-5 py-2">
              <p className="text-[11px] text-muted-foreground/40">
                {filteredArticles.length > 0 ? `${toPersianNumber(filteredArticles.length)} نتیجه` : "نتیجه‌ای یافت نشد"}
              </p>
            </div>
            <div className="divide-y divide-border/30">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={refetch} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="border-t border-border/30">
              {/* Trending section heading */}
              <div className="flex items-center gap-1.5 px-5 pt-4 pb-2">
                <Flame size={14} strokeWidth={1.5} className="text-muted-foreground/40" />
                <span className="text-[12px] font-semibold text-muted-foreground/50">پرطرفدارترین‌ها</span>
              </div>
              <div className="divide-y divide-border/30">
                {trendingArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} onDelete={refetch} />
                ))}
              </div>
            </div>
            <div className="mt-6 px-5">
              <SuggestedWriters />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
