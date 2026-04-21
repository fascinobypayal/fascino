import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNav } = useBottomNav();
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = (location.state as any)?.sessionId;

  useEffect(() => {
    showNav();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) { setLoading(false); return; }

      // Try to find the most recent order for this customer
      const { data } = await supabase
        .from('orders')
        .select('order_number')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setOrderNumber(data.order_number);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [user, sessionId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <CheckCircle className="h-8 w-8 text-accent" />
      </div>
      <h1 className="font-serif text-2xl mb-2">Order Confirmed!</h1>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground my-4" />
      ) : orderNumber ? (
        <p className="text-sm text-muted-foreground mb-2">
          Order Number: <span className="font-medium text-foreground">{orderNumber}</span>
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Estimated delivery: 3–5 working days. Thank you for shopping with Fascino!
      </p>
      <button
        onClick={() => navigate('/orders')}
        className="btn-filled py-3 px-8 text-sm uppercase tracking-widest mb-3"
      >
        View Orders
      </button>
      <button
        onClick={() => navigate('/')}
        className="btn-premium py-3 px-8 text-sm uppercase tracking-widest"
      >
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderSuccessPage;
