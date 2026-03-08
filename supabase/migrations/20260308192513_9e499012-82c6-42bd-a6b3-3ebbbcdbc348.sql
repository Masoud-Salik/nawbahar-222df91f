ALTER TABLE public.vip_posts 
ADD COLUMN image_url text DEFAULT NULL,
ADD COLUMN link_url text DEFAULT NULL,
ADD COLUMN link_label text DEFAULT NULL;