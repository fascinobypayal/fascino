import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrderListItem {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  item_count: number;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number | null;
  total_amount: number;
  payment_method: string | null;
  created_at: string;
  customer: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  address: {
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string | null;
  } | null;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    base_price: number;
    customizations: { customization_name: string; customization_price: number | null }[];
    note: string | null;
  }[];
}

export function useOrdersList() {
  return useQuery({
    queryKey: ["orders-list"],
    queryFn: async (): Promise<OrderListItem[]> => {
      // Fetch orders with customer info and item count
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          customers (full_name, email, phone),
          order_items (id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (orders || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at,
        customer_name: o.customers?.full_name || "Unknown",
        customer_phone: o.customers?.phone || null,
        customer_email: o.customers?.email || null,
        item_count: o.order_items?.length || 0,
      }));
    },
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ["order-detail", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<OrderDetail | null> => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          subtotal,
          discount_amount,
          total_amount,
          payment_method,
          created_at,
          customers (full_name, email, phone),
          order_addresses (full_name, phone, address_line_1, address_line_2, city, state, postal_code, country),
          order_items (
            id,
            product_name,
            quantity,
            base_price,
            order_item_customizations (customization_name, customization_price),
            order_item_notes (note)
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const d = data as any;

      return {
        id: d.id,
        order_number: d.order_number,
        status: d.status,
        subtotal: d.subtotal,
        discount_amount: d.discount_amount,
        total_amount: d.total_amount,
        payment_method: d.payment_method,
        created_at: d.created_at,
        customer: d.customers || null,
        address: Array.isArray(d.order_addresses) ? d.order_addresses[0] || null : d.order_addresses || null,
        items: (d.order_items || []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          base_price: item.base_price,
          customizations: item.order_item_customizations || [],
          note: Array.isArray(item.order_item_notes)
            ? item.order_item_notes[0]?.note || null
            : item.order_item_notes?.note || null,
        })),
      };
    },
  });
}
