
-- 1. Privilege escalation: explicit deny INSERT/DELETE on admin_profiles
DROP POLICY IF EXISTS "No client inserts on admin_profiles" ON public.admin_profiles;
CREATE POLICY "No client inserts on admin_profiles"
  ON public.admin_profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes on admin_profiles" ON public.admin_profiles;
CREATE POLICY "No client deletes on admin_profiles"
  ON public.admin_profiles FOR DELETE
  TO authenticated, anon
  USING (false);

-- 2. Coupons: remove public read, restrict to admins; customers redeem via RPC
DROP POLICY IF EXISTS "Customers can view active coupons" ON public.coupons;

-- 3. Notifications: drop overly broad recipient policies; keep type-scoped
DROP POLICY IF EXISTS "Recipients can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Recipients can update own notifications" ON public.notifications;

-- Add admin policies for admin notifications
DROP POLICY IF EXISTS "Admins can view admin notifications" ON public.notifications;
CREATE POLICY "Admins can view admin notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    recipient_type = 'ADMIN'
    AND recipient_id = auth.uid()
    AND auth.uid() IN (SELECT id FROM public.admin_profiles)
  );

DROP POLICY IF EXISTS "Admins can update admin notifications" ON public.notifications;
CREATE POLICY "Admins can update admin notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_type = 'ADMIN'
    AND recipient_id = auth.uid()
    AND auth.uid() IN (SELECT id FROM public.admin_profiles)
  );

-- 4. Checkout sessions: explicit deny INSERT/UPDATE for non-service-role
DROP POLICY IF EXISTS "No client inserts on checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "No client inserts on checkout_sessions"
  ON public.checkout_sessions FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates on checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "No client updates on checkout_sessions"
  ON public.checkout_sessions FOR UPDATE
  TO authenticated, anon
  USING (false);

DROP POLICY IF EXISTS "No client deletes on checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "No client deletes on checkout_sessions"
  ON public.checkout_sessions FOR DELETE
  TO authenticated, anon
  USING (false);

-- 5. Function search_path hardening
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id_input uuid, quantity_input integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  update products
  set stock = stock - quantity_input
  where id = product_id_input
  and stock >= quantity_input;

  if not found then
    raise exception 'Insufficient stock';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_returns_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.process_successful_payment(p_checkout_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
declare
    v_order_id uuid;
    v_order_number text;
    v_customer_id uuid;
    v_coupon_id uuid;
    v_cart_id uuid;
    rec record;
    v_order_item_id uuid;
    v_product_name text;
    v_product_image text;
begin

    if exists (
        select 1 from orders
        where checkout_session_id = p_checkout_session_id
    ) then
        return;
    end if;

    select customer_id, cart_id
    into v_customer_id, v_cart_id
    from checkout_sessions
    where id = p_checkout_session_id
    for update;

    v_order_number := 'FAS-' || nextval('order_number_seq');

    insert into orders (
        customer_id, order_number, status, payment_method,
        subtotal, discount_amount, total_amount, coupon_id, checkout_session_id
    )
    select cs.customer_id, v_order_number, 'PENDING', 'ONLINE',
        cs.amount, 0, cs.amount, c.coupon_id, cs.id
    from checkout_sessions cs
    join carts c on c.id = cs.cart_id
    where cs.id = p_checkout_session_id
    returning id, coupon_id into v_order_id, v_coupon_id;

    for rec in
        select ci.id, ci.product_id, ci.quantity, ci.base_price
        from cart_items ci
        where ci.cart_id = v_cart_id
    loop
        select name into v_product_name from products where id = rec.product_id;
        select image_url into v_product_image from product_images
            where product_id = rec.product_id limit 1;

        update products set stock = stock - rec.quantity
        where id = rec.product_id and stock >= rec.quantity;
        if not found then
            raise exception 'Insufficient stock for product %', rec.product_id;
        end if;

        insert into order_items (order_id, product_id, product_name, product_image_url, quantity, base_price)
        values (v_order_id, rec.product_id, v_product_name, v_product_image, rec.quantity, rec.base_price)
        returning id into v_order_item_id;

        insert into order_item_customizations (order_item_id, customization_name, customization_price)
        select v_order_item_id, cic.customization_name, cic.customization_price
        from cart_item_customizations cic where cic.cart_item_id = rec.id;

        insert into order_item_notes (order_item_id, note)
        select v_order_item_id, cin.note
        from cart_item_notes cin
        where cin.cart_item_id = rec.id and cin.note is not null and cin.note <> '';
    end loop;

    insert into order_addresses (order_id, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country)
    select v_order_id, ca.full_name, ca.phone, ca.address_line_1, ca.address_line_2, ca.city, ca.state, ca.postal_code, ca.country
    from cart_addresses ca where ca.cart_id = v_cart_id;

    if v_coupon_id is not null then
        update coupons set usage_count = usage_count + 1 where id = v_coupon_id;
        insert into coupon_usages (coupon_id, order_id, customer_id)
        values (v_coupon_id, v_order_id, v_customer_id);
    end if;

    insert into order_status_history (order_id, status) values (v_order_id, 'PENDING');

    delete from cart_item_customizations where cart_item_id in (select id from cart_items where cart_id = v_cart_id);
    delete from cart_item_notes where cart_item_id in (select id from cart_items where cart_id = v_cart_id);
    delete from cart_items where cart_id = v_cart_id;
    delete from cart_addresses where cart_id = v_cart_id;
end;
$function$;

-- 6. feature_flags: admin-only access
DROP POLICY IF EXISTS "Admins manage feature flags" ON public.feature_flags;
CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_profiles))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_profiles));

-- 7. coupon_usages: admins read all, customers can view their own
DROP POLICY IF EXISTS "Admins view coupon usages" ON public.coupon_usages;
CREATE POLICY "Admins view coupon usages"
  ON public.coupon_usages FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_profiles));

DROP POLICY IF EXISTS "Customers view own coupon usages" ON public.coupon_usages;
CREATE POLICY "Customers view own coupon usages"
  ON public.coupon_usages FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());
