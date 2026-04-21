-- Enable RLS on faqs table
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active FAQs
CREATE POLICY "Anyone can view active faqs"
ON public.faqs
FOR SELECT
USING (is_active = true);
