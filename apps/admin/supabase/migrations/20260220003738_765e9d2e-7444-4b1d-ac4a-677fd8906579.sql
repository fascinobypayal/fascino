
CREATE OR REPLACE FUNCTION public.process_successful_payment(p_checkout_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_customer_id uuid;
    v_coupon_id uuid;
    v_cart_id uuid;
    rec RECORD;
    v_order_item_id uuid;
BEGIN

    -- Prevent duplicate order
    IF EXISTS (
        SELECT 1 FROM orders
        WHERE checkout_session_id = p_checkout_session_id
    ) THEN
        RETURN;
    END IF;

    -- Lock checkout session
    SELECT customer_id, cart_id
    INTO v_customer_id, v_cart_id
    FROM checkout_sessions
    WHERE id = p_checkout_session_id
    FOR UPDATE;

    -- Generate sequential order number
    v_order_number := 'FAS-' || nextval('order_number_seq');

    -- Insert order
    INSERT INTO orders (
        customer_id,
        order_number,
        status,
        payment_method,
        subtotal,
        discount_amount,
        total_amount,
        coupon_id,
        checkout_session_id
    )
    SELECT
        cs.customer_id,
        v_order_number,
        'PENDING',
        'ONLINE',
        cs.amount,
        0,
        cs.amount,
        c.coupon_id,
        cs.id
    FROM checkout_sessions cs
    JOIN carts c ON c.id = cs.cart_id
    WHERE cs.id = p_checkout_session_id
    RETURNING id, coupon_id INTO v_order_id, v_coupon_id;

    -- Process each cart item
    FOR rec IN
        SELECT ci.id,
               ci.product_id,
               ci.quantity,
               ci.base_price,
               p.name AS product_name
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = v_cart_id
    LOOP

        -- Strict stock check + decrement
        UPDATE products
        SET stock = stock - rec.quantity
        WHERE id = rec.product_id
        AND stock >= rec.quantity;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient stock for product %', rec.product_id;
        END IF;

        -- Insert order item (with product_id now)
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            base_price
        )
        VALUES (
            v_order_id,
            rec.product_id,
            rec.product_name,
            rec.quantity,
            rec.base_price
        )
        RETURNING id INTO v_order_item_id;

        -- Copy customizations
        INSERT INTO order_item_customizations (
            order_item_id,
            customization_name,
            customization_price
        )
        SELECT
            v_order_item_id,
            cic.customization_name,
            cic.customization_price
        FROM cart_item_customizations cic
        WHERE cic.cart_item_id = rec.id;

        -- Copy notes
        INSERT INTO order_item_notes (
            order_item_id,
            note
        )
        SELECT
            v_order_item_id,
            cin.note
        FROM cart_item_notes cin
        WHERE cin.cart_item_id = rec.id
        AND cin.note IS NOT NULL
        AND cin.note <> '';

    END LOOP;

    -- Copy address
    INSERT INTO order_addresses (
        order_id,
        full_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country
    )
    SELECT
        v_order_id,
        ca.full_name,
        ca.phone,
        ca.address_line_1,
        ca.address_line_2,
        ca.city,
        ca.state,
        ca.postal_code,
        ca.country
    FROM cart_addresses ca
    WHERE ca.cart_id = v_cart_id;

    -- Coupon usage handling
    IF v_coupon_id IS NOT NULL THEN
        UPDATE coupons
        SET usage_count = usage_count + 1
        WHERE id = v_coupon_id;

        INSERT INTO coupon_usages (
            coupon_id,
            order_id,
            customer_id
        )
        VALUES (
            v_coupon_id,
            v_order_id,
            v_customer_id
        );
    END IF;

    -- Insert status history
    INSERT INTO order_status_history (order_id, status)
    VALUES (v_order_id, 'PENDING');

    -- Clear cart
    DELETE FROM cart_item_customizations
    WHERE cart_item_id IN (
        SELECT id FROM cart_items WHERE cart_id = v_cart_id
    );

    DELETE FROM cart_item_notes
    WHERE cart_item_id IN (
        SELECT id FROM cart_items WHERE cart_id = v_cart_id
    );

    DELETE FROM cart_items
    WHERE cart_id = v_cart_id;

    DELETE FROM cart_addresses
    WHERE cart_id = v_cart_id;

END;
$function$;
