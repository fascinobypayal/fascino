-- Allow admins to insert notifications (for approve/reject actions)
CREATE POLICY "Admin can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admin_profiles)
);
