
-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Customers can read their own notifications
CREATE POLICY "Customers can view own notifications"
ON public.notifications
FOR SELECT
USING (recipient_type = 'CUSTOMER' AND recipient_id = auth.uid());

-- Customers can mark their own notifications as read
CREATE POLICY "Customers can update own notifications"
ON public.notifications
FOR UPDATE
USING (recipient_type = 'CUSTOMER' AND recipient_id = auth.uid());
