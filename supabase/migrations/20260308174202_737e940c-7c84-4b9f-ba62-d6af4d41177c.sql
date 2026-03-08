CREATE TABLE public.profile_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, reviewer_id)
);

ALTER TABLE public.profile_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Anyone can view profile reviews"
  ON public.profile_reviews FOR SELECT
  USING (true);

-- Authenticated users can add reviews (not on themselves)
CREATE POLICY "Users can add reviews for others"
  ON public.profile_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id AND profile_id != reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.profile_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.profile_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Content length validation trigger
CREATE OR REPLACE FUNCTION public.validate_profile_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF length(NEW.content) > 500 THEN
    RAISE EXCEPTION 'Review content too long (max 500 chars)';
  END IF;
  IF length(trim(NEW.content)) = 0 THEN
    RAISE EXCEPTION 'Review content cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_review_trigger
  BEFORE INSERT OR UPDATE ON public.profile_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_review();