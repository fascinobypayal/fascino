CREATE POLICY "Anyone can view home config"
ON public.home_config
FOR SELECT
USING (true);