-- Add rating column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5);

-- Drop the existing delete policy (it uses auth.uid which doesn't work with current auth)
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- No public delete policy - only service role (edge functions) can delete