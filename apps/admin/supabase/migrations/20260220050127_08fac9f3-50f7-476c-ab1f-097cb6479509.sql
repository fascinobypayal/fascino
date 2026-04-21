
-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IN (SELECT id FROM admin_profiles)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IN (SELECT id FROM admin_profiles)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IN (SELECT id FROM admin_profiles)
);

-- Admin write policies for product_images table
CREATE POLICY "Admin can manage product images"
ON public.product_images FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Admin write policies for product_customizations table
CREATE POLICY "Admin can manage product customizations"
ON public.product_customizations FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Admin write policies for product_customization_settings table
CREATE POLICY "Admin can manage customization settings"
ON public.product_customization_settings FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Admin write policies for collection_products table
CREATE POLICY "Admin can manage collection products"
ON public.collection_products FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Public read for collection_products
CREATE POLICY "Anyone can view collection products"
ON public.collection_products FOR SELECT
USING (true);
