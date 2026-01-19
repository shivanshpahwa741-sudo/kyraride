-- Drop the restrictive policies and replace with permissive ones
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;

-- Create PERMISSIVE policies (default behavior when using CREATE POLICY)
CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Anyone can insert reviews" 
ON public.reviews 
FOR INSERT 
TO public
WITH CHECK (true);