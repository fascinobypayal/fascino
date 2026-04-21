
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    v_current_status text;
    rec RECORD;
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT status INTO v_current_status
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_current_status IN ('DELIVERED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Order is in terminal state';
    END IF;

    IF v_current_status = 'PENDING' THEN
        IF p_new_status NOT IN ('CONFIRMED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid transition from PENDING';
        END IF;
    ELSIF v_current_status = 'CONFIRMED' THEN
        IF p_new_status NOT IN ('READY_TO_SHIP', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid transition from CONFIRMED';
        END IF;
    ELSIF v_current_status = 'READY_TO_SHIP' THEN
        IF p_new_status NOT IN ('PICKED_UP') THEN
            RAISE EXCEPTION 'Invalid transition from READY_TO_SHIP';
        END IF;
    ELSIF v_current_status = 'PICKED_UP' THEN
        IF p_new_status NOT IN ('IN_TRANSIT') THEN
            RAISE EXCEPTION 'Invalid transition from PICKED_UP';
        END IF;
    ELSIF v_current_status = 'IN_TRANSIT' THEN
        IF p_new_status NOT IN ('DELIVERED') THEN
            RAISE EXCEPTION 'Invalid transition from IN_TRANSIT';
        END IF;
    END IF;

    IF p_new_status = 'CANCELLED' THEN
        FOR rec IN
            SELECT product_id, quantity
            FROM order_items
            WHERE order_id = p_order_id
        LOOP
            UPDATE products
            SET stock = stock + rec.quantity
            WHERE id = rec.product_id;
        END LOOP;
    END IF;

    UPDATE orders
    SET status = p_new_status
    WHERE id = p_order_id;

    INSERT INTO order_status_history(order_id, status)
    VALUES (p_order_id, p_new_status);
END;
$function$;
