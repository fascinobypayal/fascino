
-- RLS for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Recipients can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Notification settings table for admin preferences
CREATE TABLE public.notification_settings (
  admin_id uuid NOT NULL PRIMARY KEY,
  new_orders boolean NOT NULL DEFAULT true,
  order_updates boolean NOT NULL DEFAULT true,
  customer_messages boolean NOT NULL DEFAULT false,
  new_customers boolean NOT NULL DEFAULT false,
  low_stock boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view own settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() = admin_id);

CREATE POLICY "Admin can insert own settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admin can update own settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);
