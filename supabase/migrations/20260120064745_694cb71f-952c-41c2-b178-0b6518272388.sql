-- Fix overly permissive RLS policy on bookings
-- Replace WITH CHECK (true) with proper validation via edge function only
DROP POLICY IF EXISTS "Bookings can be inserted via edge function" ON public.bookings;

-- Only allow inserts from edge functions using service role (no direct client inserts)
CREATE POLICY "No direct client insert to bookings"
ON public.bookings FOR INSERT
WITH CHECK (false);