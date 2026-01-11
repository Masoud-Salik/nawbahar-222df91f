import { Link } from "react-router-dom";
import { CornerDownLeft } from "lucide-react";

interface ResponseArticle {
  id: string;
  title: string;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface ResponseArticlesProps {
  responses: ResponseArticle[];
}

export function ResponseArticles({ responses }: ResponseArticlesProps) {
  if (responses.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h3 className="flex items-center gap-2 text-base font-medium text-foreground mb-6">
        <CornerDownLeft size={18} strokeWidth={1.5} className="text-muted-foreground" />
        <span>پاسخ‌ها و مقالات مرتبط</span>
        <span className="text-sm text-muted-foreground">({responses.length})</span>
      </h3>
      <div className="space-y-4">
        {responses.map((response) => (
          <Link
            key={response.id}
            to={`/article/${response.id}`}
            className="block p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <h4 className="font-medium text-foreground leading-relaxed mb-2 line-clamp-2">
              {response.title}
            </h4>
            {response.author && (
              <div className="flex items-center gap-2">
                {response.author.avatar_url ? (
                  <img
                    src={response.author.avatar_url}
                    alt={response.author.display_name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">
                      {response.author.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {response.author.display_name}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
