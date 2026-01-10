-- Fix overly permissive RLS policy on notifications
-- Drop the old permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive policy that allows inserts only from triggers (SECURITY DEFINER functions)
-- Since triggers run with SECURITY DEFINER, they bypass RLS, so we don't need an INSERT policy for users
-- Users should never directly insert notifications - only the system triggers should

-- However, we need to allow the SECURITY DEFINER functions to work
-- The triggers already use SECURITY DEFINER which bypasses RLS, so no INSERT policy is needed for regular users