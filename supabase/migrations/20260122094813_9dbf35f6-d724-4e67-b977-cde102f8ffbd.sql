-- Create a public view for reviews that excludes sensitive user_id
CREATE VIEW public.public_reviews AS
SELECT 
  id,
  user_name,
  review_text,
  image_url,
  rating,
  created_at
FROM public.reviews;

-- Grant access to the view for anon and authenticated roles
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.public_reviews IS 'Public-facing reviews view that excludes user_id for privacy';