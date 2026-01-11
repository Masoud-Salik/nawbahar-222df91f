-- Add response article system (parent_article_id)
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS parent_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL;

-- Add view count column
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create reactions table (replaces likes for articles)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('liked', 'disliked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS on reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Anyone can view reactions" 
ON public.reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add reactions" 
ON public.reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" 
ON public.reactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Index for faster response article queries
CREATE INDEX IF NOT EXISTS idx_articles_parent ON public.articles(parent_article_id);

-- Index for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_article ON public.reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(article_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = article_uuid;
END;
$$;