CREATE OR REPLACE FUNCTION public.validate_profile_review()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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