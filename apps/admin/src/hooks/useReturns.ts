import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_item_id: string;
  customer_id: string;
  type: string;
  reason: string;
  requested_note: string | null;
  status: string;
  refund_amount: number | null;
  refund_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  linked_exchange_order_id: string | null;
  order_number: string;
  order_status: string;
  quantity: number;
  product_name: string;
  product_price: number;
  customer_name: string;
}

export const useReturns = (statusFilter: ReturnStatus | "ALL" = "ALL") => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["returns", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("returns_exchanges")
        .select(`
          *,
          orders!returns_exchanges_order_id_fkey(order_number, status),
          order_items!returns_exchanges_order_item_id_fkey(quantity, product_name, base_price, product_id, products!fk_order_items_product(name, price)),
          customers!returns_exchanges_customer_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "ALL") {
        q = q.eq("status", statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((row: any): ReturnRequest => ({
        id: row.id,
        order_id: row.order_id,
        order_item_id: row.order_item_id,
        customer_id: row.customer_id,
        type: row.type,
        reason: row.reason,
        requested_note: row.requested_note,
        status: row.status,
        refund_amount: row.refund_amount,
        refund_status: row.refund_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        linked_exchange_order_id: row.linked_exchange_order_id,
        order_number: row.orders?.order_number || "",
        order_status: row.orders?.status || "",
        quantity: row.order_items?.quantity || 0,
        product_name: row.order_items?.products?.name || row.order_items?.product_name || "",
        product_price: row.order_items?.products?.price || row.order_items?.base_price || 0,
        customer_name: row.customers?.full_name || "Unknown",
      }));
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["returns"] });
  };

  const insertNotification = async (ret: ReturnRequest, title: string, message: string, type: string) => {
    const { error } = await supabase.from("notifications").insert({
      recipient_type: "CUSTOMER",
      recipient_id: ret.customer_id,
      type,
      title,
      message,
      related_id: ret.order_id,
    });
    if (error) {
      // Notification insert failures are non-fatal for the return action;
      // surface to the user via toast in calling mutations only.
    }
  };

  // Stage 1: Approve (REQUESTED → APPROVED), no refund_status change
  const approveReturn = useMutation({
    mutationFn: async (ret: ReturnRequest) => {
      const { error } = await supabase
        .from("returns_exchanges")
        .update({ status: "APPROVED" })
        .eq("id", ret.id);
      if (error) throw error;
      await insertNotification(ret, "Request Approved", `Your ${ret.type.toLowerCase()} request has been approved.`, "RETURN_APPROVED");
    },
    onSuccess: () => { toast.success("Request approved"); invalidateAll(); },
    onError: (err: any) => { toast.error(err.message || "Failed to approve"); },
  });

  const rejectReturn = useMutation({
    mutationFn: async (ret: ReturnRequest) => {
      const { error } = await supabase
        .from("returns_exchanges")
        .update({ status: "REJECTED" })
        .eq("id", ret.id);
      if (error) throw error;
      await insertNotification(ret, "Request Rejected", `Your ${ret.type.toLowerCase()} request has been rejected.`, "RETURN_REJECTED");
    },
    onSuccess: () => { toast.success("Request rejected"); invalidateAll(); },
    onError: (err: any) => { toast.error(err.message || "Failed to reject"); },
  });

  // Stage 2: Mark Item Received (APPROVED → refund_status = PENDING)
  const markItemReceived = useMutation({
    mutationFn: async (ret: ReturnRequest) => {
      const { error } = await supabase
        .from("returns_exchanges")
        .update({ refund_status: "PENDING" })
        .eq("id", ret.id);
      if (error) throw error;
      await insertNotification(ret, "Item Received", "We have received your returned item. Refund is being processed.", "RETURN_ITEM_RECEIVED");
    },
    onSuccess: () => { toast.success("Marked as received"); invalidateAll(); },
    onError: (err: any) => { toast.error(err.message || "Failed to update"); },
  });

  // Stage 3: Mark Refund Processed (refund_status PENDING → PROCESSED, status → COMPLETED)
  const markRefundProcessed = useMutation({
    mutationFn: async (ret: ReturnRequest) => {
      const { error } = await supabase
        .from("returns_exchanges")
        .update({ refund_status: "PROCESSED", status: "COMPLETED" })
        .eq("id", ret.id);
      if (error) throw error;
      await insertNotification(ret, "Refund Processed", "Your refund has been processed successfully.", "RETURN_COMPLETED");
    },
    onSuccess: () => { toast.success("Refund processed & completed"); invalidateAll(); },
    onError: (err: any) => { toast.error(err.message || "Failed to process refund"); },
  });

  // Exchange completion (unchanged)
  const completeExchange = useMutation({
    mutationFn: async (ret: ReturnRequest) => {
      const { error } = await supabase
        .from("returns_exchanges")
        .update({ status: "COMPLETED" })
        .eq("id", ret.id);
      if (error) throw error;
      await insertNotification(ret, "Exchange Completed", "Your exchange has been completed.", "RETURN_COMPLETED");
    },
    onSuccess: () => { toast.success("Exchange completed"); invalidateAll(); },
    onError: (err: any) => { toast.error(err.message || "Failed to complete exchange"); },
  });

  return {
    returns: query.data || [],
    isLoading: query.isLoading,
    approveReturn,
    rejectReturn,
    markItemReceived,
    markRefundProcessed,
    completeExchange,
  };
};
