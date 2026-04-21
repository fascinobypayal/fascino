import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import OrderCard from '@/components/OrderCard';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OrderItemDisplay {
  name: string;
  image: string;
  quantity: number;
}

interface OrderDisplay {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  items: OrderItemDisplay[];
}

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, order_number, created_at, status, total_amount, payment_method')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch order items with product images
      const orderIds = ordersData.map((o) => o.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity, product_id')
        .in('order_id', orderIds);

      // Fetch first product image for each product
      const productIds = [...new Set((itemsData ?? []).map(i => i.product_id).filter(Boolean))];
      let imageMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, image_url')
          .in('product_id', productIds)
          .order('sort_order', { ascending: true });
        
        // Keep only first image per product
        for (const img of (imagesData ?? [])) {
          if (img.product_id && !imageMap[img.product_id]) {
            imageMap[img.product_id] = img.image_url;
          }
        }
      }

      const mapped: OrderDisplay[] = ordersData.map((o) => {
        const items = (itemsData ?? [])
          .filter((i) => i.order_id === o.id)
          .map((i) => ({
            name: i.product_name,
            image: (i.product_id && imageMap[i.product_id]) || '/placeholder.svg',
            quantity: i.quantity,
          }));

        return {
          id: o.id,
          orderNumber: o.order_number,
          date: new Date(o.created_at!).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          status: o.status,
          total: Number(o.total_amount),
          paymentMethod: o.payment_method,
          items,
        };
      });

      setOrders(mapped);
      setLoading(false);
    };

    fetchOrders();
  }, [isAuthenticated, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Orders" />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Orders" />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">Log in to view your orders</h2>
          <p className="text-sm text-muted-foreground mb-6">Track your purchases and manage returns</p>
          <button
            onClick={() => navigate('/login', { state: { from: '/orders' } })}
            className="flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
          >
            Log In / Sign Up
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Orders" />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">You haven't placed any orders yet.</h2>
          <p className="text-sm text-muted-foreground mb-6">Start your journey with our curated collection</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-accent text-accent-foreground px-6 py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-accent/90 transition-colors shadow-sm"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Orders" />
      <div className="px-4 py-4 space-y-3">
        {orders.map((order) => (
          <div key={order.id} onClick={() => navigate(`/order/${order.id}`)} className="cursor-pointer">
            <OrderCard order={order} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
