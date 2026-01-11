import { Eye, MessageCircle, CornerDownLeft } from "lucide-react";

interface ArticleBottomSignalsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
}

export function ArticleBottomSignals({ 
  viewCount, 
  commentCount, 
  responseCount 
}: ArticleBottomSignalsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-4 text-muted-foreground">
      <div className="flex items-center gap-1.5 text-sm">
        <Eye size={16} strokeWidth={1.5} />
        <span>{viewCount}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <MessageCircle size={16} strokeWidth={1.5} />
        <span>{commentCount}</span>
      </div>
      {responseCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <CornerDownLeft size={16} strokeWidth={1.5} />
          <span>{responseCount}</span>
        </div>
      )}
    </div>
  );
}
