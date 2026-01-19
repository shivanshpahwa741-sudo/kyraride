
-- Drop existing storage policies for review-images bucket
DROP POLICY IF EXISTS "Anyone can view review images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;

-- Create new policies that allow anyone (including anonymous) to upload and view
CREATE POLICY "Public read access for review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Public insert access for review images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-images');

CREATE POLICY "Public update access for review images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'review-images');
