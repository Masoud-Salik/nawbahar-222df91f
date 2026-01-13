-- Add author trust score column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100);

-- Add AI scores columns to articles for AI pre-review
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS ai_score_science smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_score_ethics smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_score_writing smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_score_timing smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_score_innovation smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_weight smallint DEFAULT 0;

-- Create index for faster feed queries with final weight
CREATE INDEX IF NOT EXISTS idx_articles_final_weight ON public.articles(final_weight DESC) WHERE status = 'published';

-- Add unique constraint for comment_likes to prevent duplicate likes
ALTER TABLE public.comment_likes DROP CONSTRAINT IF EXISTS comment_likes_user_comment_unique;
ALTER TABLE public.comment_likes ADD CONSTRAINT comment_likes_user_comment_unique UNIQUE (user_id, comment_id);

-- Add unique constraint for reported_comments to prevent duplicate reports
ALTER TABLE public.reported_comments DROP CONSTRAINT IF EXISTS reported_comments_user_comment_unique;
ALTER TABLE public.reported_comments ADD CONSTRAINT reported_comments_user_comment_unique UNIQUE (reporter_id, comment_id);