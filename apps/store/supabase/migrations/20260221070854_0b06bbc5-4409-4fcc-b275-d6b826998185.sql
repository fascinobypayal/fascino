
-- Allow customers to view status history for their own orders
CREATE POLICY "Customer can view own order status history"
ON public.order_status_history
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
  )
);
