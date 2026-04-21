import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Check, Package, Truck, MapPin, RotateCcw, Loader2, XCircle, ArrowLeftRight, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  isProductAvailable: boolean;
  quantity: number;
  basePrice: number;
  customizations: { name: string; price: number }[];
  note: string | null;
  returnExchange: {
    id: string;
    type: string;
    status: string;
    refundStatus: string | null;
  } | null;
}

interface OrderAddress {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  deliveredAt: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  items: OrderItem[];
  address: OrderAddress | null;
  statusHistory: { status: string; changedAt: string }[];
}

const returnReasons = [
  'Size does not fit',
  'Different from images',
  'Quality not as expected',
  'Damaged product',
  'Wrong item received',
  'Changed my mind',
];

const statusBadgeConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  READY_TO_SHIP: { label: 'Ready to Ship', className: 'bg-purple-100 text-purple-700' },
  PICKED_UP: { label: 'Picked Up', className: 'bg-orange-100 text-orange-700' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-orange-100 text-orange-700' },
  SHIPPED: { label: 'Shipped', className: 'bg-orange-100 text-orange-700' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
};

const returnStatusConfig: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: 'Requested', className: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

const refundStatusLabels: Record<string, string> = {
  PENDING: 'Refund in progress',
  PROCESSED: 'Refund processed',
  FAILED: 'Refund failed',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hideNav, showNav } = useBottomNav();
  const { toast } = useToast();
  const { formatPrice } = useStoreSettings();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReturnSheet, setShowReturnSheet] = useState(false);
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);

    const { data: o, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !o) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const [itemsRes, addressRes, historyRes] = await Promise.all([
      supabase.from('order_items').select('id, product_id, product_name, product_image_url, quantity, base_price').eq('order_id', id),
      supabase.from('order_addresses').select('*').eq('order_id', id).maybeSingle(),
      supabase.from('order_status_history').select('status, changed_at').eq('order_id', id).order('changed_at', { ascending: true }),
    ]);

    const items: OrderItem[] = [];
    const orderItems = itemsRes.data ?? [];

    if (orderItems.length > 0) {
      const itemIds = orderItems.map((i) => i.id);
      const [custRes, notesRes, returnsRes] = await Promise.all([
        supabase.from('order_item_customizations').select('order_item_id, customization_name, customization_price').in('order_item_id', itemIds),
        supabase.from('order_item_notes').select('order_item_id, note').in('order_item_id', itemIds),
        supabase.from('returns_exchanges').select('id, order_item_id, type, status, refund_status').in('order_item_id', itemIds),
      ]);

      // Check which products still exist
      const productIds = orderItems.map(i => i.product_id);
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);
      const existingSet = new Set((existingProducts ?? []).map(p => p.id));

      for (const item of orderItems) {
        const customizations = (custRes.data ?? [])
          .filter((c) => c.order_item_id === item.id)
          .map((c) => ({ name: c.customization_name, price: Number(c.customization_price ?? 0) }));
        const noteRow = (notesRes.data ?? []).find((n) => n.order_item_id === item.id);
        
        const activeReturn = (returnsRes.data ?? []).find(
          (r) => r.order_item_id === item.id && r.status !== 'REJECTED'
        );

        items.push({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productImageUrl: item.product_image_url,
          isProductAvailable: existingSet.has(item.product_id),
          quantity: item.quantity,
          basePrice: Number(item.base_price),
          customizations,
          note: noteRow?.note ?? null,
          returnExchange: activeReturn
            ? {
                id: activeReturn.id,
                type: activeReturn.type,
                status: activeReturn.status,
                refundStatus: activeReturn.refund_status,
              }
            : null,
        });
      }
    }

    const addr = addressRes.data;
    const address: OrderAddress | null = addr
      ? {
          fullName: addr.full_name,
          line1: addr.address_line_1,
          line2: addr.address_line_2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postal_code,
          phone: addr.phone,
        }
      : null;

    setOrder({
      id: o.id,
      orderNumber: o.order_number,
      date: new Date(o.created_at!).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: o.status,
      deliveredAt: o.delivered_at,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount_amount ?? 0),
      total: Number(o.total_amount),
      paymentMethod: o.payment_method,
      items,
      address,
      statusHistory: (historyRes.data ?? []).map((h) => ({
        status: h.status,
        changedAt: new Date(h.changed_at!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      })),
    });
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const canCancel = order && ['PENDING', 'CONFIRMED', 'READY_TO_SHIP'].includes(order.status);
  const canReturnExchange =
    order &&
    order.status === 'DELIVERED' &&
    order.deliveredAt &&
    new Date(order.deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000 >= Date.now();

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    const { error } = await supabase.rpc('customer_cancel_order' as any, {
      p_order_id: order.id,
    });
    setCancelling(false);
    setShowCancelDialog(false);

    if (error) {
      toast({ title: 'Cancel Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order Cancelled', description: 'Your order has been cancelled successfully.' });
      fetchOrder();
    }
  };

  const openReturnSheet = (itemId: string, type: 'RETURN' | 'EXCHANGE') => {
    setSelectedItemId(itemId);
    setReturnType(type);
    setSelectedReason('');
    setReturnNotes('');
    hideNav();
    setShowReturnSheet(true);
  };

  const handleCloseReturn = () => {
    showNav();
    setShowReturnSheet(false);
    setSelectedItemId(null);
    setSelectedReason('');
    setReturnNotes('');
  };

  const handleSubmitReturn = async () => {
    if (!selectedItemId || !selectedReason) return;
    setSubmitting(true);

    const { error } = await supabase.rpc('request_return_exchange', {
      p_order_item_id: selectedItemId,
      p_type: returnType,
      p_reason: selectedReason,
      p_note: returnNotes || '',
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Request Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: `${returnType === 'RETURN' ? 'Return' : 'Exchange'} Request Submitted`,
        description: 'We will review your request and get back to you within 24 hours.',
      });
      handleCloseReturn();
      fetchOrder();
    }
  };

  const getTimelineIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return <Clock className="h-4 w-4" />;
    if (s === 'CONFIRMED') return <Check className="h-4 w-4" />;
    if (['READY_TO_SHIP', 'PICKED_UP', 'IN_TRANSIT', 'SHIPPED'].includes(s)) return <Truck className="h-4 w-4" />;
    if (s === 'DELIVERED') return <MapPin className="h-4 w-4" />;
    if (s === 'CANCELLED') return <XCircle className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusBadgeConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
    return (
      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.className}`}>
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Order Details" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Order Details" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Order Details" showBack />

      {/* Order Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">#{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">Placed on {order.date}</p>
            {order.paymentMethod && (
              <p className="text-xs text-muted-foreground capitalize">
                Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
              </p>
            )}
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Estimated delivery */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="px-4 py-3 bg-accent/5 border-b border-border">
          <p className="text-xs text-accent flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Estimated delivery within 7 business days.
          </p>
        </div>
      )}

      {/* Order Timeline */}
      {order.statusHistory.length > 0 && (
        <div className="px-4 py-6 border-b border-border">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Order Status</h3>
          <div className="relative">
            {order.statusHistory.map((step, index) => (
              <div key={index} className="flex gap-4 pb-6 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                    {getTimelineIcon(step.status)}
                  </div>
                  {index < order.statusHistory.length - 1 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-[calc(100%-8px)] bg-accent" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-foreground">{statusBadgeConfig[step.status]?.label ?? step.status}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.changedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="px-4 py-6 border-b border-border">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Items</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex gap-3">
                {/* Product image thumbnail */}
                {item.productImageUrl && (
                  <button
                    onClick={() => item.isProductAvailable ? navigate(`/product/${item.productId}`) : null}
                    className={`flex-shrink-0 ${item.isProductAvailable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-md border border-border"
                    />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    {item.isProductAvailable ? (
                      <button
                        onClick={() => navigate(`/product/${item.productId}`)}
                        className="text-sm font-medium text-left hover:underline"
                      >
                        {item.productName}
                      </button>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-[10px] text-muted-foreground">Product no longer available</p>
                      </div>
                    )}
                    <p className="text-sm flex-shrink-0 ml-2">{formatPrice(item.basePrice)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              {item.customizations.length > 0 && (
                <div className="space-y-1">
                  {item.customizations.map((c, i) => (
                    <p key={i} className="text-xs text-accent">
                      {c.name} {c.price > 0 ? `(+${formatPrice(c.price)})` : ''}
                    </p>
                  ))}
                </div>
              )}
              {item.note && <p className="text-xs text-muted-foreground italic">Note: {item.note}</p>}

              {/* Return/Exchange status badge */}
              {item.returnExchange && (
                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{item.returnExchange.type === 'RETURN' ? 'Return' : 'Exchange'}:</span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${returnStatusConfig[item.returnExchange.status]?.className ?? 'bg-muted text-muted-foreground'}`}>
                      {returnStatusConfig[item.returnExchange.status]?.label ?? item.returnExchange.status}
                    </span>
                  </div>
                  {item.returnExchange.type === 'RETURN' && item.returnExchange.refundStatus && (
                    <p className="text-xs text-muted-foreground">
                      {refundStatusLabels[item.returnExchange.refundStatus] ?? item.returnExchange.refundStatus}
                    </p>
                  )}
                </div>
              )}

              {/* Per-item return/exchange buttons */}
              {canReturnExchange && !item.returnExchange && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => openReturnSheet(item.id, 'RETURN')}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" /> Return
                  </button>
                  <button
                    onClick={() => openReturnSheet(item.id, 'EXCHANGE')}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    <ArrowLeftRight className="h-3 w-3" /> Exchange
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-4 py-6 border-b border-border">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Price Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-accent">Complimentary</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-accent">-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-medium pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      {order.address && (
        <div className="px-4 py-6 border-b border-border">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Delivery Address</h3>
          <p className="text-sm font-medium">{order.address.fullName}</p>
          <p className="text-sm text-muted-foreground mt-1">{order.address.line1}</p>
          {order.address.line2 && <p className="text-sm text-muted-foreground">{order.address.line2}</p>}
          <p className="text-sm text-muted-foreground">{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
          <p className="text-sm text-muted-foreground mt-1">{order.address.phone}</p>
        </div>
      )}

      {/* Cancel Order Button */}
      {canCancel && (
        <div className="px-4 py-6">
          <button
            onClick={() => setShowCancelDialog(true)}
            className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-destructive/5 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </button>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return/Exchange Sheet */}
      <Sheet open={showReturnSheet} onOpenChange={(open) => !open && handleCloseReturn()}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-xl">
              Request {returnType === 'RETURN' ? 'Return' : 'Exchange'}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Reason</h4>
              <div className="space-y-2">
                {returnReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-accent"
                    />
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {returnType === 'EXCHANGE' ? 'Preferred size/color or additional notes' : 'Additional Notes (Optional)'}
              </h4>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder={returnType === 'EXCHANGE' ? 'E.g. I need size L instead of M...' : 'Add any additional details...'}
                rows={3}
                className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:border-accent focus:outline-none transition-colors text-sm resize-none"
              />
            </div>
            <button
              onClick={handleSubmitReturn}
              disabled={!selectedReason || submitting}
              className="w-full bg-accent text-accent-foreground py-3 rounded-lg text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Submit Request'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OrderDetailPage;
