import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StockErrorModal from '@/components/StockErrorModal';
import { Check, MapPin, CreditCard, Banknote, AlertCircle, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { loadRazorpayScript, openRazorpayCheckout, pollCheckoutSession } from '@/lib/razorpay';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { isValidPhone, sanitizePhone } from '@/lib/phoneValidation';

type Step = 'shipping' | 'payment' | 'review';
type PaymentState = 'idle' | 'initializing' | 'paying' | 'confirming' | 'failed' | 'timeout';

import type { StockErrorItem } from '@/components/StockErrorModal';

const steps: { key: Step; label: string }[] = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hideNav, showNav } = useBottomNav();
  const { cartId, items, loading: cartLoading, subtotal, discount, total, coupon, refreshCart } = useCart();
  const { settings, formatPrice } = useStoreSettings();

  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [stockErrorItems, setStockErrorItems] = useState<StockErrorItem[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Address form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLine1, setFormLine1] = useState('');
  const [formLine2, setFormLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPostal, setFormPostal] = useState('');

  const isCODBlocked = coupon && !coupon.applicable_to_cod;
  const isCODDisabled = settings && !settings.cod_enabled;

  useEffect(() => {
    if ((isCODBlocked || isCODDisabled) && paymentMethod === 'cod') setPaymentMethod('online');
  }, [isCODBlocked, isCODDisabled]);

  // Load cart address
  useEffect(() => {
    if (!cartId) return;
    const loadAddress = async () => {
      setLoadingAddress(true);
      const { data } = await supabase
        .from('cart_addresses')
        .select('*')
        .eq('cart_id', cartId)
        .maybeSingle();

      if (data) {
        setAddress({
          full_name: data.full_name,
          phone: data.phone,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || undefined,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
        });
      } else {
        // Try loading from saved customer addresses
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: savedAddrs } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', user.id)
            .eq('is_default', true)
            .order('created_at', { ascending: false })
            .limit(1);
          const savedAddr = savedAddrs?.[0] || null;
          if (savedAddr) {
            const addr = {
              full_name: savedAddr.full_name,
              phone: savedAddr.phone,
              address_line_1: savedAddr.address_line_1,
              address_line_2: savedAddr.address_line_2 || undefined,
              city: savedAddr.city,
              state: savedAddr.state,
              postal_code: savedAddr.postal_code,
            };
            setAddress(addr);
            // Also persist to cart_addresses so the edge function can find it
            await supabase.from('cart_addresses').upsert({
              cart_id: cartId,
              full_name: addr.full_name,
              phone: addr.phone,
              address_line_1: addr.address_line_1,
              address_line_2: addr.address_line_2 || null,
              city: addr.city,
              state: addr.state,
              postal_code: addr.postal_code,
            }, { onConflict: 'cart_id' });
          }
        }
      }
      setLoadingAddress(false);
    };
    loadAddress();
  }, [cartId]);

  const handleOpenAddressSheet = () => {
    if (address) {
      setFormName(address.full_name);
      setFormPhone(address.phone);
      setFormLine1(address.address_line_1);
      setFormLine2(address.address_line_2 || '');
      setFormCity(address.city);
      setFormState(address.state);
      setFormPostal(address.postal_code);
    }
    hideNav();
    setShowAddressSheet(true);
  };

  const handleCloseAddressSheet = () => { showNav(); setShowAddressSheet(false); };

  const handleSaveAddress = async () => {
    if (!cartId || !formName || !formPhone || !formLine1 || !formCity || !formState || !formPostal) {
      toast({ title: 'Please fill all required fields' });
      return;
    }
    if (!isValidPhone(formPhone)) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }

    const addressData = {
      cart_id: cartId,
      full_name: formName,
      phone: formPhone,
      address_line_1: formLine1,
      address_line_2: formLine2 || null,
      city: formCity,
      state: formState,
      postal_code: formPostal,
    };

    // Upsert by cart_id
    const { error } = await supabase
      .from('cart_addresses')
      .upsert(addressData, { onConflict: 'cart_id' });

    if (error) {
      toast({ title: 'Error saving address', variant: 'destructive' });
      return;
    }

    // Also save to customer_addresses for the Addresses page
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('customer_addresses').upsert({
        customer_id: user.id,
        full_name: formName,
        phone: formPhone,
        address_line_1: formLine1,
        address_line_2: formLine2 || null,
        city: formCity,
        state: formState,
        postal_code: formPostal,
        is_default: true,
      }, { onConflict: 'id' });
    }

    setAddress({
      full_name: formName,
      phone: formPhone,
      address_line_1: formLine1,
      address_line_2: formLine2 || undefined,
      city: formCity,
      state: formState,
      postal_code: formPostal,
    });

    handleCloseAddressSheet();
    toast({ title: 'Address saved' });
  };

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleRemoveStockItem = async (cartItemId: string) => {
    await supabase.from('cart_item_customizations').delete().eq('cart_item_id', cartItemId);
    await supabase.from('cart_item_notes').delete().eq('cart_item_id', cartItemId);
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    setStockErrorItems((prev) => prev.filter((i) => i.cart_item_id !== cartItemId));
    await refreshCart();
  };

  const handleAdjustStockItem = async (cartItemId: string, newQuantity: number) => {
    await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId);
    setStockErrorItems((prev) => prev.filter((i) => i.cart_item_id !== cartItemId));
    await refreshCart();
  };

  const handleOnlinePayment = async () => {
    setPaymentState('initializing');
    setIsProcessing(true);

    try {
      await loadRazorpayScript();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please log in', description: 'You need to be logged in to pay' });
        setPaymentState('idle');
        setIsProcessing(false);
        return;
      }

      // Ensure address is persisted to cart_addresses before calling edge function
      if (address && cartId) {
        const { error: addrErr } = await supabase.from('cart_addresses').upsert({
          cart_id: cartId,
          full_name: address.full_name,
          phone: address.phone,
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 || null,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
        }, { onConflict: 'cart_id' });
        if (addrErr) {
          console.error('Failed to save cart address:', addrErr);
          toast({ title: 'Failed to save address', variant: 'destructive' });
          setPaymentState('idle');
          setIsProcessing(false);
          return;
        }
      }

      const response = await supabase.functions.invoke('create-payment', {
        body: { customer_id: session.user.id },
      });

      // Check for edge function errors (non-2xx responses)
      if (response.error) {
        let errData: any = null;
        try {
          // supabase-js puts the Response object on error.context for non-2xx
          const ctx = (response.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            errData = await ctx.json();
          }
        } catch {
          // ignore parse failures
        }
        // Fallback: sometimes data is populated
        if (!errData) errData = response.data;

        if (errData && errData.type === 'STOCK_ERROR' && Array.isArray(errData.items)) {
          setPaymentState('idle');
          setIsProcessing(false);
          setStockErrorItems(errData.items);
          setShowStockModal(true);
          return;
        }
        if (errData && errData.error === 'Shipping address required') {
          setPaymentState('idle');
          setIsProcessing(false);
          toast({ title: 'Address required', description: 'Please add a delivery address before placing your order', variant: 'destructive' });
          setCurrentStep('shipping');
          return;
        }
        throw new Error(response.error?.message || 'Failed to create payment');
      }

      if (!response.data) {
        throw new Error('Failed to create payment');
      }

      const { razorpay_order_id, key, amount, session_id } = response.data;
      setPaymentState('paying');

      openRazorpayCheckout({
        key,
        amount,
        razorpay_order_id,
        prefill: { name: address?.full_name, contact: address?.phone },
        onSuccess: async () => {
          setPaymentState('confirming');
          const result = await pollCheckoutSession(supabase, session_id);
          if (result === 'PAYMENT_SUCCESS') {
            await refreshCart();
            toast({ title: 'Payment Successful', description: 'Order placed successfully' });
            navigate('/order-success', { state: { sessionId: session_id } });
          } else {
            setPaymentState('timeout');
          }
        },
        onFailure: () => {
          setPaymentState('failed');
          setIsProcessing(false);
        },
        onDismiss: () => {
          // Use functional update to read current state, not the stale closure value.
          // Without this, ondismiss (fired when modal closes after payment) would
          // overwrite 'confirming' back to 'idle' due to the stale closure.
          setPaymentState((current) => {
            if (current === 'paying') {
              setIsProcessing(false);
              return 'idle';
            }
            return current;
          });
        },
      });
    } catch (err: any) {
      console.error('Payment init error:', err);
      toast({ title: 'Payment Error', description: err.message || 'Could not initialize payment', variant: 'destructive' });
      setPaymentState('idle');
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'shipping') {
      if (!address) {
        toast({ title: 'Select address', description: 'Please add a delivery address' });
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    } else {
      handlePlaceOrder();
    }
  };

  const handleCODPayment = async () => {
    setIsProcessing(true);
    setPaymentState('confirming');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please log in', variant: 'destructive' });
        setPaymentState('idle');
        setIsProcessing(false);
        return;
      }

      // Ensure address is persisted
      if (address && cartId) {
        await supabase.from('cart_addresses').upsert({
          cart_id: cartId,
          full_name: address.full_name,
          phone: address.phone,
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 || null,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
        }, { onConflict: 'cart_id' });
      }

      const response = await supabase.functions.invoke('create-cod-order', {
        body: {},
      });

      if (response.error) {
        let errData: any = null;
        try {
          const ctx = (response.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            errData = await ctx.json();
          }
        } catch { /* ignore */ }
        if (!errData) errData = response.data;

        const errMsg = errData?.error || response.error?.message || 'Failed to place order';
        throw new Error(errMsg);
      }

      const { session_id } = response.data;
      await refreshCart();
      toast({ title: 'Order Placed Successfully', description: 'Thank you for shopping with Fascino' });
      navigate('/order-success', { state: { sessionId: session_id } });
    } catch (err: any) {
      console.error('COD payment error:', err);
      toast({ title: 'Order Failed', description: err.message || 'Something went wrong', variant: 'destructive' });
      setPaymentState('idle');
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!address) {
      toast({ title: 'Address required', description: 'Please add a delivery address before placing your order', variant: 'destructive' });
      setCurrentStep('shipping');
      return;
    }
    if (paymentMethod === 'online') {
      handleOnlinePayment();
      return;
    }
    handleCODPayment();
  };

  const handleBack = () => {
    if (currentStep === 'payment') setCurrentStep('shipping');
    else if (currentStep === 'review') setCurrentStep('payment');
  };

  const handleRetryPayment = () => {
    setPaymentState('idle');
    setIsProcessing(false);
    handleOnlinePayment();
  };

  // Payment state overlays
  if (paymentState === 'initializing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Preparing your payment…</p>
      </div>
    );
  }

  if (paymentState === 'confirming') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm font-medium">Confirming your order…</p>
        <p className="text-xs text-muted-foreground">Please do not close this page</p>
      </div>
    );
  }

  if (paymentState === 'timeout') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-accent" />
        <p className="text-sm font-medium">Payment received</p>
        <p className="text-xs text-muted-foreground max-w-xs">We are verifying your order. You'll receive a confirmation shortly.</p>
        <button onClick={() => navigate('/orders')} className="btn-filled py-3 px-8 text-sm uppercase tracking-widest mt-4">View Orders</button>
      </div>
    );
  }

  if (paymentState === 'failed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium">Payment Failed</p>
        <p className="text-xs text-muted-foreground max-w-xs">Something went wrong with your payment. Please try again.</p>
        <button onClick={handleRetryPayment} className="btn-filled py-3 px-8 text-sm uppercase tracking-widest mt-4">Retry Payment</button>
        <button onClick={() => { setPaymentState('idle'); setIsProcessing(false); }} className="btn-premium py-3 px-8 text-sm uppercase tracking-widest">Change Payment Method</button>
      </div>
    );
  }

  if (items.length === 0 && !loadingAddress && !cartLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">Your cart is empty</p>
        <button onClick={() => navigate('/shop')} className="btn-filled py-3 px-8 text-sm uppercase tracking-widest">Shop Now</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <StockErrorModal
        isOpen={showStockModal}
        items={stockErrorItems}
        onClose={() => setShowStockModal(false)}
        onRemoveItem={handleRemoveStockItem}
        onAdjustQuantity={handleAdjustStockItem}
        onRefreshCart={async () => { await refreshCart(); }}
      />
      <PageHeader title="Checkout" showBack />

      {/* Progress Steps */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                index < currentStepIndex ? 'bg-accent text-accent-foreground'
                  : index === currentStepIndex ? 'border-2 border-accent text-accent'
                  : 'border border-border text-muted-foreground'
              }`}>
                {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 md:w-24 h-px mx-2 ${index < currentStepIndex ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span key={step.key} className={`text-[10px] uppercase tracking-wider ${step.key === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 animate-fade-in">
        {currentStep === 'shipping' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium mb-4">Delivery Address</h2>
            {loadingAddress ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : address ? (
              <div className="p-4 border border-accent bg-accent/5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{address.full_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{address.address_line_1}</p>
                    {address.address_line_2 && <p className="text-sm text-muted-foreground">{address.address_line_2}</p>}
                    <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.postal_code}</p>
                    <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                  </div>
                </div>
                <button onClick={handleOpenAddressSheet} className="mt-3 text-xs text-accent">Change Address</button>
              </div>
            ) : (
              <button onClick={handleOpenAddressSheet} className="w-full p-4 border border-dashed border-border text-center hover:border-foreground/30 transition-colors">
                <MapPin className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">Add Delivery Address</p>
              </button>
            )}
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium mb-4">Payment Method</h2>
            <button
              onClick={() => setPaymentMethod('online')}
              className={`w-full p-4 border text-left transition-colors ${paymentMethod === 'online' ? 'border-accent bg-accent/5' : 'border-border hover:border-foreground/30'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-accent' : 'border-muted-foreground'}`}>
                  {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Pay Online</p>
                  <p className="text-xs text-muted-foreground">Card, UPI, Net Banking</p>
                </div>
              </div>
            </button>

            {!isCODDisabled && (
            <button
              onClick={() => {
                if (isCODBlocked) {
                  toast({ title: 'Coupon not valid for COD', description: 'The applied coupon is valid for online payment only. Remove the coupon to use Cash on Delivery.', variant: 'destructive' });
                  return;
                }
                setPaymentMethod('cod');
              }}
              className={`w-full p-4 border text-left transition-colors ${paymentMethod === 'cod' ? 'border-accent bg-accent/5' : 'border-border hover:border-foreground/30'} ${isCODBlocked ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-accent' : 'border-muted-foreground'}`}>
                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                </div>
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when you receive</p>
                </div>
              </div>
              {isCODBlocked && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />Coupon valid for online payment only
                </div>
              )}
            </button>
            )}
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium mb-4">Order Review</h2>
            <div className="p-4 bg-muted/50 space-y-2">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Shipping To</h3>
              <p className="text-sm">{address?.full_name}</p>
              <p className="text-sm text-muted-foreground">{address?.address_line_1}, {address?.city} - {address?.postal_code}</p>
              <p className="text-sm text-muted-foreground">{address?.phone}</p>
            </div>
            <div className="p-4 bg-muted/50 space-y-2">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Payment Method</h3>
              <p className="text-sm">{paymentMethod === 'online' ? 'Pay Online (Card/UPI/Net Banking)' : 'Cash on Delivery'}</p>
            </div>
            <div className="p-4 bg-muted/50 space-y-2">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Items ({items.length})</h3>
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product_name} ×{item.quantity}</span>
                  <span>{formatPrice(item.base_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-accent">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-accent">Complimentary</span>
              </div>
              <div className="flex justify-between text-base font-medium pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border flex gap-3">
        {currentStep !== 'shipping' && (
          <button onClick={handleBack} disabled={isProcessing} className="flex-1 btn-premium py-3 text-sm uppercase tracking-widest disabled:opacity-50">
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="flex-1 btn-filled py-3 text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{paymentMethod === 'online' ? 'Processing Payment...' : 'Placing Order...'}</>
          ) : (
            currentStep === 'review' ? 'Place Order' : 'Continue'
          )}
        </button>
      </div>

      {/* Address Form Sheet */}
      <Sheet open={showAddressSheet} onOpenChange={(open) => !open && handleCloseAddressSheet()}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-xl">{address ? 'Edit Address' : 'Add Address'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full Name *" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <div>
              <input value={formPhone} onChange={(e) => { const v = sanitizePhone(e.target.value); setFormPhone(v); setPhoneError(v.length > 0 && v.length !== 10 ? 'Enter a valid 10-digit phone number' : ''); }} placeholder="Phone *" inputMode="numeric" maxLength={10} className={`w-full px-4 py-3 bg-transparent border ${phoneError ? 'border-destructive' : 'border-border'} focus:border-accent focus:outline-none transition-colors text-sm`} />
              {phoneError && <p className="text-[11px] text-destructive mt-1">{phoneError}</p>}
            </div>
            <input value={formLine1} onChange={(e) => setFormLine1(e.target.value)} placeholder="Address Line 1 *" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <input value={formLine2} onChange={(e) => setFormLine2(e.target.value)} placeholder="Address Line 2" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="City *" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
              <input value={formState} onChange={(e) => setFormState(e.target.value)} placeholder="State *" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            </div>
            <input value={formPostal} onChange={(e) => setFormPostal(e.target.value)} placeholder="Postal Code *" className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm" />
            <button onClick={handleSaveAddress} className="w-full btn-filled py-3.5 text-sm uppercase tracking-wider mt-4">
              Save Address
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CheckoutPage;
