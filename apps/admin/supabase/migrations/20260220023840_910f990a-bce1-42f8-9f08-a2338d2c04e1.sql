
-- Create hero-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload to hero-images bucket
CREATE POLICY "Admin can upload hero images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images'
  AND auth.uid() IN (SELECT id FROM admin_profiles)
);

-- Allow admins to update hero images
CREATE POLICY "Admin can update hero images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hero-images'
  AND auth.uid() IN (SELECT id FROM admin_profiles)
);

-- Allow admins to delete hero images
CREATE POLICY "Admin can delete hero images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hero-images'
  AND auth.uid() IN (SELECT id FROM admin_profiles)
);

-- Allow public read access to hero images
CREATE POLICY "Public can view hero images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-images');

-- Add admin read policy for collections (needed for link dropdown)
CREATE POLICY "Admin can manage collections"
ON public.collections
FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Add public read for published collections
CREATE POLICY "Anyone can view published collections"
ON public.collections
FOR SELECT
USING (is_published = true);
