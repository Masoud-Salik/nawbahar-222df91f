-- 1. Update follows policy to require authentication
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by authenticated users"
ON public.follows FOR SELECT
TO authenticated
USING (true);

-- 2. Add constraints for article content validation (check if not exists manually)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_title_length') THEN
        ALTER TABLE public.articles ADD CONSTRAINT check_title_length CHECK (length(title) <= 300);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_content_length') THEN
        ALTER TABLE public.articles ADD CONSTRAINT check_content_length CHECK (length(content) <= 100000);
    END IF;
END $$;

-- 3. Add constraint for comment length
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_comment_length') THEN
        ALTER TABLE public.comments ADD CONSTRAINT check_comment_length CHECK (length(content) <= 2000);
    END IF;
END $$;