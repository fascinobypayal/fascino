
CREATE OR REPLACE FUNCTION public.complete_return(p_return_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    rec record;
begin
    if not exists (select 1 from admin_profiles where id = auth.uid()) then
        raise exception 'Unauthorized';
    end if;

    select * into rec
    from returns_exchanges
    where id = p_return_id
    for update;

    if rec.status != 'APPROVED' then
        raise exception 'Return must be approved first';
    end if;

    -- restore stock only
    update products
    set stock = stock + (
        select quantity
        from order_items
        where id = rec.order_item_id
    )
    where id = (
        select product_id
        from order_items
        where id = rec.order_item_id
    );

    -- Only mark item received, do NOT set refund status or complete
    update returns_exchanges
    set refund_status = 'PENDING'
    where id = p_return_id;

    insert into notifications (
        recipient_type,
        recipient_id,
        type,
        title,
        message,
        related_id
    )
    values (
        'CUSTOMER',
        rec.customer_id,
        'RETURN_ITEM_RECEIVED',
        'Item Received',
        'We have received your returned item. Refund is being processed.',
        rec.order_id
    );
end;
$function$;
