import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, ChevronRight, Package, X, RotateCcw, Users, Phone, Loader2, MapPin, Mail } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { LuxuryCard } from "@/components/LuxuryCard";
import { StatusChip } from "@/components/StatusChip";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { useOrdersList, useOrderDetail, type OrderListItem, type OrderDetail } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// ── Status helpers ──

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  READY_TO_SHIP: "Ready to Ship",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const getNextActions = (status: string): { primary: string | null; cancel: boolean } => {
  switch (status) {
    case "PENDING": return { primary: "CONFIRMED", cancel: true };
    case "CONFIRMED": return { primary: "READY_TO_SHIP", cancel: true };
    case "READY_TO_SHIP": return { primary: "PICKED_UP", cancel: false };
    case "PICKED_UP": return { primary: "IN_TRANSIT", cancel: false };
    case "IN_TRANSIT": return { primary: "DELIVERED", cancel: false };
    default: return { primary: null, cancel: false };
  }
};

const formatOrderDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "MMM d, yyyy · h:mm a");
  } catch {
    return dateStr;
  }
};

// ── Order Card ──

const OrderCard = ({ order, index, onClick }: { order: OrderListItem; index: number; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    <LuxuryCard className="active:scale-[0.98] transition-transform cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">{order.customer_name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusChip status={order.status} />
            <span className="text-xs text-muted-foreground">{order.order_number}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Package className="w-3.5 h-3.5" />
          <span className="text-xs">{order.item_count} item{order.item_count !== 1 ? "s" : ""}</span>
        </div>
        <div className="text-right">
          <p className="font-serif text-foreground text-sm">₹{order.total_amount.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{formatOrderDate(order.created_at)}</p>
        </div>
      </div>
    </LuxuryCard>
  </motion.div>
);

// ── Order Detail Sheet ──

const OrderDetailSheet = ({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) => {
  const { data: order, isLoading, error, refetch } = useOrderDetail(orderId);
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const { error } = await supabase.rpc("update_order_status", {
        p_order_id: order.id,
        p_new_status: newStatus,
      });
      if (error) throw error;
      toast({ title: `Order marked as ${STATUS_LABELS[newStatus] || newStatus}` });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["orders-list"] });
    } catch (err: any) {
      toast({ title: "Failed to update status", description: "Please try again.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const actions = order ? getNextActions(order.status) : { primary: null, cancel: false };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-foreground/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between">
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : order ? (
                <>
                  <h2 className="font-serif text-lg text-foreground">{order.customer?.full_name || "Unknown"}</h2>
                  <p className="text-sm text-muted-foreground">{order.order_number}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Order not found</p>
              )}
            </div>
            <button onClick={onClose} className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {order && (
            <div className="mt-2">
              <StatusChip status={order.status} />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-3">Failed to load order details</p>
            <button onClick={() => refetch()} className="text-sm text-primary underline">Retry</button>
          </div>
        ) : !order ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </div>
        ) : (
          <div className="p-4 space-y-5 pb-8">
            {/* Customer Contact */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Customer Contact</h3>
              <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.customer?.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{order.customer?.phone || "No phone"}</p>
                    {order.customer?.email && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                      </div>
                    )}
                  </div>
                  {order.customer?.phone && (
                    <a
                      href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
                      className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center"
                    >
                      <Phone className="w-5 h-5 text-secondary-foreground" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.address && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Shipping Address</h3>
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium">{order.address.full_name}</p>
                      <p>{order.address.address_line_1}</p>
                      {order.address.address_line_2 && <p>{order.address.address_line_2}</p>}
                      <p>{order.address.city}, {order.address.state} {order.address.postal_code}</p>
                      <p className="text-muted-foreground text-xs mt-1">{order.address.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Products</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="bg-muted/50 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-serif text-foreground">₹{item.base_price.toLocaleString()}</p>
                    </div>
                    {item.customizations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Customizations</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.customizations.map((c, i) => (
                            <span key={i} className="text-xs text-foreground bg-accent px-2 py-0.5 rounded-full">
                              {c.customization_name}
                              {c.customization_price ? ` (+₹${c.customization_price})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.note && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Note</p>
                        <p className="text-xs text-foreground italic">"{item.note}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Price Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₹{order.subtotal.toLocaleString()}</span>
                </div>
                {(order.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-primary">-₹{order.discount_amount!.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">Free</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-serif text-foreground">₹{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Status Update Actions */}
            {actions.primary && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleUpdateStatus(actions.primary!)}
                  disabled={updating}
                  className="w-full luxury-button-primary min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mark as {STATUS_LABELS[actions.primary] || actions.primary}
                </button>
                {actions.cancel && (
                  <button
                    onClick={() => handleUpdateStatus("CANCELLED")}
                    disabled={updating}
                    className="w-full min-h-[48px] rounded-xl border border-destructive text-destructive text-sm font-medium disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ── Filter type ──

type FilterStatus = "all" | "PENDING" | "CONFIRMED" | "READY_TO_SHIP" | "IN_TRANSIT" | "DELIVERED";

// ── Main Page ──

const OrdersPage = () => {
  const navigate = useNavigate();
  const { setVisible } = useBottomNav();
  const { data: orders, isLoading, error, refetch } = useOrdersList();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setVisible(!selectedOrderId);
  }, [selectedOrderId, setVisible]);

  const filteredOrders = filter === "all"
    ? (orders || [])
    : (orders || []).filter(o => o.status === filter);

  const statusFilters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "READY_TO_SHIP", label: "Ready" },
    { key: "IN_TRANSIT", label: "In Transit" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  return (
    <AdminLayout title="Orders" subtitle={`${orders?.length || 0} total orders`}>
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/orders/returns")}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted text-foreground min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Returns</span>
          </button>
          <button
            onClick={() => navigate("/customers")}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted text-foreground min-h-[48px]"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Customers</span>
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
          {statusFilters.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                filter === s.key
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <LuxuryCard key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-3" />
                <div className="flex justify-between pt-3 border-t border-border">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </LuxuryCard>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-3">Failed to load orders</p>
            <button onClick={() => refetch()} className="text-sm text-primary underline">Retry</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Sheet */}
      {selectedOrderId && (
        <OrderDetailSheet
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </AdminLayout>
  );
};

export default OrdersPage;
