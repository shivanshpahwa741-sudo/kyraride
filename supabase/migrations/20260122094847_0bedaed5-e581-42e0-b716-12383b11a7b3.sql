-- Recreate the view with SECURITY INVOKER (non-definer)
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_name,
  review_text,
  image_url,
  rating,
  created_at
FROM public.reviews;

-- Grant access to the view
GRANT SELECT ON public.public_reviews TO anon, authenticated;

COMMENT ON VIEW public.public_reviews IS 'Public-facing reviews view that excludes user_id for privacy';