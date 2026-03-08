import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSolarShort } from "@/lib/solarHijri";
import { toPersianNumber } from "@/lib/utils";
import defaultCover from "@/assets/default-cover.jpg";
import { MessageCircle, Eye } from "lucide-react";

interface RelatedArticle {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  view_count: number | null;
  author_id: string;
  comment_count?: number;
  reaction_count?: number;
}

interface RelatedArticlesProps {
  articleId: string;
  tags: string[];
  authorId: string;
}

export function RelatedArticles({ articleId, tags, authorId }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<RelatedArticle[]>([]);

  useEffect(() => {
    fetchRelated();
  }, [articleId]);

  const fetchRelated = async () => {
    const { data } = await supabase
      .from("articles")
      .select("id, title, content, cover_image_url, created_at, author_id, view_count")
      .eq("status", "published")
      .neq("id", articleId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return;

    // Score by relevance
    const scored = data.map((a) => {
      let score = 0;
      if (a.author_id === authorId) score += 3;
      return { ...a, score };
    });

    if (tags.length > 0) {
      const ids = data.map((a) => a.id);
      const { data: tagData } = await supabase
        .from("articles")
        .select("id, tags")
        .in("id", ids);

      if (tagData) {
        const tagMap = new Map(tagData.map((t) => [t.id, t.tags || []]));
        scored.forEach((a) => {
          const aTags = tagMap.get(a.id) || [];
          tags.forEach((tag) => {
            if (aTags.includes(tag)) a.score += 1;
          });
        });
      }
    }

    const top = scored
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (top.length < 3) {
      const existing = new Set(top.map((a) => a.id));
      for (const a of scored) {
        if (!existing.has(a.id) && top.length < 4) {
          top.push(a);
          existing.add(a.id);
        }
      }
    }

    // Fetch comment & reaction counts
    const topIds = top.map((a) => a.id);
    const [commentsRes, reactionsRes] = await Promise.all([
      supabase.from("comments").select("article_id").in("article_id", topIds),
      supabase.from("reactions").select("article_id").in("article_id", topIds),
    ]);

    const commentCounts = new Map<string, number>();
    const reactionCounts = new Map<string, number>();
    (commentsRes.data || []).forEach((c) => {
      commentCounts.set(c.article_id, (commentCounts.get(c.article_id) || 0) + 1);
    });
    (reactionsRes.data || []).forEach((r) => {
      reactionCounts.set(r.article_id, (reactionCounts.get(r.article_id) || 0) + 1);
    });

    setArticles(
      top.map((a) => ({
        ...a,
        comment_count: commentCounts.get(a.id) || 0,
        reaction_count: reactionCounts.get(a.id) || 0,
      }))
    );
  };

  if (articles.length === 0) return null;

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  return (
    <div className="mt-10 pt-8 border-t border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4 px-1">نوشتارهای مرتبط</h3>
      <div className="divide-y divide-border/30">
        {articles.map((a) => {
          const coverImage = a.cover_image_url || defaultCover;
          const excerpt = stripHtml(a.content).slice(0, 80).trim();

          return (
            <Link
              key={a.id}
              to={`/article/${a.id}`}
              className="block py-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex gap-3.5">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-extrabold text-foreground leading-[1.75] line-clamp-2 group-hover:text-primary transition-colors">
                    {a.title}
                  </h4>
                  <p className="text-[12.5px] text-muted-foreground/40 leading-[1.7] line-clamp-2 mt-1">
                    {excerpt}{excerpt.length >= 80 ? "…" : ""}
                  </p>
                </div>
                <div className="w-[88px] h-[60px] flex-shrink-0 rounded overflow-hidden bg-muted/15 self-start mt-0.5">
                  <img
                    src={coverImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/45">
                <span>{formatSolarShort(a.created_at)}</span>
                {(a.view_count ?? 0) > 0 && (
                  <>
                    <span className="text-muted-foreground/20">·</span>
                    <span className="flex items-center gap-0.5">
                      <Eye size={11} strokeWidth={1.3} />
                      {toPersianNumber(a.view_count ?? 0)}
                    </span>
                  </>
                )}
                {(a.comment_count ?? 0) > 0 && (
                  <>
                    <span className="text-muted-foreground/20">·</span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle size={11} strokeWidth={1.3} />
                      {toPersianNumber(a.comment_count ?? 0)}
                    </span>
                  </>
                )}
                {(a.reaction_count ?? 0) > 0 && (
                  <>
                    <span className="text-muted-foreground/20">·</span>
                    <span>{toPersianNumber(a.reaction_count ?? 0)} واکنش</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
