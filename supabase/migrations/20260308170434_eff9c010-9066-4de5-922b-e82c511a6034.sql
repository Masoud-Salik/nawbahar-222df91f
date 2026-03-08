ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;
ALTER TABLE public.reactions ADD CONSTRAINT reactions_reaction_type_check 
CHECK (reaction_type = ANY (ARRAY['like'::text, 'clap'::text, 'love'::text, 'insightful'::text, 'fire'::text, 'laugh'::text, 'sad'::text]));