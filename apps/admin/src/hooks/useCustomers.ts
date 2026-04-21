import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  isRepeat: boolean;
  joinedDate: string;
  orders: CustomerOrder[];
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all customers
      const { data: customersData, error: custError } = await supabase
        .from("customers")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: false });

      if (custError || !customersData) {
        console.error("Error fetching customers:", custError);
        setCustomers([]);
        setLoading(false);
        return;
      }

      // Fetch all non-cancelled orders with customer info
      const { data: ordersData, error: ordError } = await supabase
        .from("orders")
        .select("id, order_number, created_at, total_amount, status, customer_id")
        .neq("status", "CANCELLED")
        .order("created_at", { ascending: false });

      if (ordError) {
        console.error("Error fetching orders:", ordError);
      }

      const orders = ordersData || [];

      // Group orders by customer_id
      const ordersByCustomer = new Map<string, typeof orders>();
      for (const order of orders) {
        if (!order.customer_id) continue;
        const list = ordersByCustomer.get(order.customer_id) || [];
        list.push(order);
        ordersByCustomer.set(order.customer_id, list);
      }

      const mapped: Customer[] = customersData.map((c) => {
        const custOrders = ordersByCustomer.get(c.id) || [];
        const totalSpend = custOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const joinedDate = c.created_at
          ? new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
          : "Unknown";

        return {
          id: c.id,
          name: c.full_name || c.email || "Unknown",
          email: c.email || "",
          phone: c.phone || "",
          totalOrders: custOrders.length,
          totalSpend,
          isRepeat: custOrders.length > 1,
          joinedDate,
          orders: custOrders.map((o) => ({
            id: o.id,
            orderNumber: o.order_number,
            date: new Date(o.created_at!).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            total: Number(o.total_amount),
            status: o.status,
          })),
        };
      });

      setCustomers(mapped);
    } catch (err) {
      console.error("Error in useCustomers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, refetch: fetchCustomers };
};
