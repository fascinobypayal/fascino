
-- Fix orders table: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admin manages orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Customer can view own orders" ON public.orders;

CREATE POLICY "Admin manages orders"
ON public.orders FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles))
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customer can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Fix order_items table
DROP POLICY IF EXISTS "Admin can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Customer can view own order items" ON public.order_items;

CREATE POLICY "Admin can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customer can view own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));

-- Fix order_addresses table
DROP POLICY IF EXISTS "Admin can view all order addresses" ON public.order_addresses;
DROP POLICY IF EXISTS "Customer can view own order addresses" ON public.order_addresses;

CREATE POLICY "Admin can view all order addresses"
ON public.order_addresses FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customer can view own order addresses"
ON public.order_addresses FOR SELECT
TO authenticated
USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));

-- Fix order_item_customizations table
DROP POLICY IF EXISTS "Admin can view all order customizations" ON public.order_item_customizations;
DROP POLICY IF EXISTS "Customer can view own order customizations" ON public.order_item_customizations;

CREATE POLICY "Admin can view all order customizations"
ON public.order_item_customizations FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customer can view own order customizations"
ON public.order_item_customizations FOR SELECT
TO authenticated
USING (order_item_id IN (SELECT oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.customer_id = auth.uid()));

-- Fix order_item_notes table
DROP POLICY IF EXISTS "Admin can view all order notes" ON public.order_item_notes;
DROP POLICY IF EXISTS "Customer can view own order notes" ON public.order_item_notes;

CREATE POLICY "Admin can view all order notes"
ON public.order_item_notes FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customer can view own order notes"
ON public.order_item_notes FOR SELECT
TO authenticated
USING (order_item_id IN (SELECT oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.customer_id = auth.uid()));

-- Fix order_status_history table
DROP POLICY IF EXISTS "Admin can view all status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admin can insert status history" ON public.order_status_history;

CREATE POLICY "Admin can view all status history"
ON public.order_status_history FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admin can insert status history"
ON public.order_status_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles));

-- Fix customers table
DROP POLICY IF EXISTS "Admins can read customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view their profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can insert their own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their profile" ON public.customers;

CREATE POLICY "Admins can read customers"
ON public.customers FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Customers can view their profile"
ON public.customers FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Customers can insert their own profile"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can update their profile"
ON public.customers FOR UPDATE
TO authenticated
USING (auth.uid() = id);
