-- Drop the permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- The notification triggers use SECURITY DEFINER which bypasses RLS entirely
-- So we don't need any INSERT policy for regular users - they should never insert directly
-- The triggers handle all notification creation securely