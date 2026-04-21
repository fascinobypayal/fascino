
-- Fix carts: existing policy is RESTRICTIVE, need PERMISSIVE for frontend access
DROP POLICY IF EXISTS "Customer manages own cart" ON public.carts;
CREATE POLICY "Customer manages own cart"
ON public.carts FOR ALL
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Fix cart_items: existing policy is RESTRICTIVE
DROP POLICY IF EXISTS "Customer manages cart items" ON public.cart_items;
CREATE POLICY "Customer manages cart items"
ON public.cart_items FOR ALL
USING (cart_id IN (SELECT id FROM carts WHERE customer_id = auth.uid()))
WITH CHECK (cart_id IN (SELECT id FROM carts WHERE customer_id = auth.uid()));

-- Products: add public read for published products (admin restrictive policy blocks regular users)
CREATE POLICY "Anyone can view published products"
ON public.products FOR SELECT
USING (is_published = true);

-- Product images: enable RLS and allow public read
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product images"
ON public.product_images FOR SELECT
USING (true);

-- Cart item customizations: enable RLS with owner access
ALTER TABLE public.cart_item_customizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cart owner manages customizations"
ON public.cart_item_customizations FOR ALL
USING (cart_item_id IN (
  SELECT ci.id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.customer_id = auth.uid()
))
WITH CHECK (cart_item_id IN (
  SELECT ci.id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.customer_id = auth.uid()
));

-- Cart item notes: enable RLS with owner access
ALTER TABLE public.cart_item_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cart owner manages notes"
ON public.cart_item_notes FOR ALL
USING (cart_item_id IN (
  SELECT ci.id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.customer_id = auth.uid()
))
WITH CHECK (cart_item_id IN (
  SELECT ci.id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.customer_id = auth.uid()
));

-- Cart addresses: enable RLS with owner access
ALTER TABLE public.cart_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cart owner manages address"
ON public.cart_addresses FOR ALL
USING (cart_id IN (SELECT id FROM carts WHERE customer_id = auth.uid()))
WITH CHECK (cart_id IN (SELECT id FROM carts WHERE customer_id = auth.uid()));

-- Fix coupons: existing "Customers can view active coupons" is RESTRICTIVE
DROP POLICY IF EXISTS "Customers can view active coupons" ON public.coupons;
CREATE POLICY "Customers can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- Checkout sessions: enable RLS so frontend can poll
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer can view own sessions"
ON public.checkout_sessions FOR SELECT
USING (customer_id = auth.uid());
