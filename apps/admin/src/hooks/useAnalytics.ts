import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  todayRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  repeatCustomers: number;
  avgOrderValue: number;
  topProduct: string | null;
  currency: string;
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics-dashboard"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async (): Promise<AnalyticsData> => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const monthStart = `${todayStr.substring(0, 7)}-01`;

      const [
        todayRes,
        monthRes,
        ordersRes,
        customersRes,
        repeatRes,
        avgRes,
        topRes,
        settingsRes,
      ] = await Promise.all([
        // 1. Today's revenue
        supabase
          .from("orders")
          .select("total_amount")
          .neq("status", "CANCELLED")
          .gte("created_at", `${todayStr}T00:00:00`)
          .lt("created_at", `${todayStr}T23:59:59.999999`),
        // 2. This month revenue
        supabase
          .from("orders")
          .select("total_amount")
          .neq("status", "CANCELLED")
          .gte("created_at", `${monthStart}T00:00:00`),
        // 3. Total orders
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .neq("status", "CANCELLED"),
        // 4. Total customers
        supabase
          .from("customers")
          .select("id", { count: "exact", head: true }),
        // 5. Repeat customers — fetch customer_ids with orders, count client-side
        supabase
          .from("orders")
          .select("customer_id")
          .neq("status", "CANCELLED")
          .not("customer_id", "is", null),
        // 6. Avg order value
        supabase
          .from("orders")
          .select("total_amount")
          .neq("status", "CANCELLED"),
        // 7. Top product
        supabase
          .from("order_items")
          .select("product_name, quantity, order_id, orders!inner(status)")
          .neq("orders.status", "CANCELLED"),
        // Currency
        supabase
          .from("store_settings")
          .select("currency")
          .limit(1)
          .maybeSingle(),
      ]);

      // Today's revenue
      const todayRevenue = (todayRes.data || []).reduce(
        (sum, r) => sum + Number(r.total_amount),
        0
      );

      // Month revenue
      const monthRevenue = (monthRes.data || []).reduce(
        (sum, r) => sum + Number(r.total_amount),
        0
      );

      // Total orders
      const totalOrders = ordersRes.count ?? 0;

      // Total customers
      const totalCustomers = customersRes.count ?? 0;

      // Repeat customers
      const customerCounts: Record<string, number> = {};
      for (const row of repeatRes.data || []) {
        if (row.customer_id) {
          customerCounts[row.customer_id] = (customerCounts[row.customer_id] || 0) + 1;
        }
      }
      const repeatCustomers = Object.values(customerCounts).filter((c) => c > 1).length;

      // Avg order value
      const allAmounts = (avgRes.data || []).map((r) => Number(r.total_amount));
      const avgOrderValue =
        allAmounts.length > 0
          ? Math.round(allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length)
          : 0;

      // Top product
      const productQty: Record<string, number> = {};
      for (const item of topRes.data || []) {
        productQty[item.product_name] = (productQty[item.product_name] || 0) + Number(item.quantity);
      }
      const topProduct =
        Object.keys(productQty).length > 0
          ? Object.entries(productQty).sort((a, b) => b[1] - a[1])[0][0]
          : null;

      const currency = settingsRes.data?.currency || "INR";

      return {
        todayRevenue,
        monthRevenue,
        totalOrders,
        totalCustomers,
        repeatCustomers,
        avgOrderValue,
        topProduct,
        currency,
      };
    },
  });
}
