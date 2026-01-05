-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can create articles" ON public.articles;

-- Create new INSERT policy that enforces pending status
CREATE POLICY "Users can create articles with pending status" 
ON public.articles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = author_id 
  AND status = 'pending'::article_status
);

-- Update the UPDATE policy to only allow admins to change status
DROP POLICY IF EXISTS "Users can update their own articles" ON public.articles;

-- Users can update their own articles but cannot change status to published
CREATE POLICY "Users can update their own articles" 
ON public.articles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  -- Admins can do anything
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  -- Authors can update but status must remain pending or be their original status
  (auth.uid() = author_id AND status IN ('pending'::article_status, 'rejected'::article_status))
);