
CREATE OR REPLACE FUNCTION public.customer_cancel_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
    v_current_status text;
    v_customer_id uuid;
    rec record;
begin
    select status, customer_id
    into v_current_status, v_customer_id
    from orders
    where id = p_order_id
    for update;

    if v_current_status is null then
        raise exception 'Order not found';
    end if;

    -- Verify the caller owns this order
    if v_customer_id != auth.uid() then
        raise exception 'Unauthorized';
    end if;

    if v_current_status not in ('PENDING','CONFIRMED','READY_TO_SHIP') then
        raise exception 'Cannot cancel after shipment started';
    end if;

    -- Restore stock
    for rec in
        select product_id, quantity
        from order_items
        where order_id = p_order_id
    loop
        update products
        set stock = stock + rec.quantity
        where id = rec.product_id;
    end loop;

    update orders
    set status = 'CANCELLED'
    where id = p_order_id;

    insert into order_status_history(order_id, status)
    values (p_order_id, 'CANCELLED');

    -- Notify customer
    insert into notifications (
        recipient_type, recipient_id, type, title, message, related_id
    )
    values (
        'CUSTOMER', v_customer_id, 'ORDER_STATUS_CHANGE',
        'Order Cancelled', 'Your order has been cancelled.', p_order_id
    );
end;
$$;
