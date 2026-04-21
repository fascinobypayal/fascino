CREATE POLICY "Admins can update own profile"
ON public.admin_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);