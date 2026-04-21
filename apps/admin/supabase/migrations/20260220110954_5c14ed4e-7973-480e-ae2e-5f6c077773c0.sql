
-- Allow admins to manage FAQs (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin can manage faqs"
ON public.faqs
FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Allow admins to view all FAQs (including inactive)
CREATE POLICY "Admin can view all faqs"
ON public.faqs
FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_profiles));
