
-- Admin can read order_items
CREATE POLICY "Admin can view all order items"
ON public.order_items FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- Admin can read order_item_customizations
CREATE POLICY "Admin can view all order customizations"
ON public.order_item_customizations FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- Admin can read order_addresses
CREATE POLICY "Admin can view all order addresses"
ON public.order_addresses FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- Admin can read order_item_notes
ALTER TABLE public.order_item_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all order notes"
ON public.order_item_notes FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customer can view own order notes"
ON public.order_item_notes FOR SELECT
USING (order_item_id IN (
  SELECT oi.id FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.customer_id = auth.uid()
));

-- Admin can read order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all status history"
ON public.order_status_history FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_profiles));
