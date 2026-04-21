-- Allow authenticated users to insert their own customer record
CREATE POLICY "Customers can insert their own profile"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow anyone to read product_customizations (public catalog data)
CREATE POLICY "Anyone can view product customizations"
ON public.product_customizations
FOR SELECT
USING (true);

-- Allow anyone to read product_customization_settings
CREATE POLICY "Anyone can view customization settings"
ON public.product_customization_settings
FOR SELECT
USING (true);