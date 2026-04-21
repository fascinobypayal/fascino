import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import CartQuantityDialog from '@/components/CartQuantityDialog';
import StockErrorModal from '@/components/StockErrorModal';
import type { StockErrorItem } from '@/components/StockErrorModal';
import { useCart, CartItemWithProduct } from '@/contexts/CartContext';
import { ShoppingBag, Tag, Check, Minus, Plus, X, Loader2, Percent } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, loading, itemCount, subtotal, discount, total, coupon, cartId, updateQuantity, removeItem, applyCoupon, removeCoupon, addToCart, refreshCart } = useCart();
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const { hideNav, showNav } = useBottomNav();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useStoreSettings();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<{ id: string; code: string; discount_type: string; discount_value: number; allow_cod: boolean; allow_online: boolean }[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [applyingCouponId, setApplyingCouponId] = useState<string | null>(null);

  // Stock validation modal state
  const [stockErrorItems, setStockErrorItems] = useState<StockErrorItem[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);

  // Smart "+" dialog state
  const [quantityDialogItem, setQuantityDialogItem] = useState<CartItemWithProduct | null>(null);
  
  // Customization sheet state for "Choose Different Customization"
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customSheetProductId, setCustomSheetProductId] = useState<string | null>(null);
  const [customSheetProductPrice, setCustomSheetProductPrice] = useState(0);
  const [customSheetProductName, setCustomSheetProductName] = useState('');
  const [customSheetProductImage, setCustomSheetProductImage] = useState<string | null>(null);
  const [availableCustomizations, setAvailableCustomizations] = useState<{ id: string; name: string; price: number; is_paid: boolean }[]>([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Set<string>>(new Set());
  const [customNote, setCustomNote] = useState('');

  // Fetch available coupons
  const fetchAvailableCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, allow_cod, allow_online, max_usage, usage_count, expiry_date')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to fetch coupons:', error);
        setAvailableCoupons([]);
        return;
      }

      const valid = (data || []).filter(c => {
        if (c.expiry_date && new Date(c.expiry_date) < new Date()) return false;
        if (c.max_usage !== null && (c.usage_count ?? 0) >= c.max_usage) return false;
        return true;
      }).map(c => ({
        id: c.id,
        code: c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        allow_cod: c.allow_cod ?? true,
        allow_online: c.allow_online ?? true,
      }));

      setAvailableCoupons(valid);
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  const handleOpenCoupon = () => {
    hideNav();
    setShowCouponSheet(true);
    fetchAvailableCoupons();
  };

  const handleCloseCoupon = () => {
    showNav();
    setShowCouponSheet(false);
  };

  const applyManualCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode.trim());
    if (result.error) {
      setCouponError(result.error);
    } else {
      toast({ title: 'Coupon applied' });
      handleCloseCoupon();
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponCode('');
    toast({ title: 'Coupon removed' });
  };

  // Check if a product has customizations in DB
  const checkProductCustomizations = useCallback(async (productId: string) => {
    const { data } = await supabase
      .from('product_customizations')
      .select('id, name, price, is_paid')
      .eq('product_id', productId);
    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      price: c.price ?? 0,
      is_paid: c.is_paid ?? false,
    }));
  }, []);

  // Handle "+" click
  const handleIncrease = useCallback(async (item: CartItemWithProduct) => {
    const custs = await checkProductCustomizations(item.product_id);
    if (custs.length === 0) {
      await updateQuantity(item.id, item.quantity + 1);
    } else {
      setQuantityDialogItem(item);
    }
  }, [checkProductCustomizations, updateQuantity]);

  // Dialog option: Repeat Same Customization
  const handleSameCustomization = async () => {
    if (!quantityDialogItem) return;
    await updateQuantity(quantityDialogItem.id, quantityDialogItem.quantity + 1);
    setQuantityDialogItem(null);
    toast({ title: 'Quantity updated' });
  };

  // Dialog option: Choose Different Customization
  const handleDifferentCustomization = async () => {
    if (!quantityDialogItem) return;
    const custs = await checkProductCustomizations(quantityDialogItem.product_id);
    setAvailableCustomizations(custs);
    setSelectedCustomizations(new Set());
    setCustomNote('');
    setCustomSheetProductId(quantityDialogItem.product_id);
    setCustomSheetProductPrice(quantityDialogItem.base_price);
    setCustomSheetProductName(quantityDialogItem.product_name);
    setCustomSheetProductImage(quantityDialogItem.product_image);
    setQuantityDialogItem(null);
    hideNav();
    setShowCustomSheet(true);
  };

  // Dialog option: Add Without Customization
  const handleNoCustomization = async () => {
    if (!quantityDialogItem) return;
    const item = quantityDialogItem;
    setQuantityDialogItem(null);
    await addToCart(
      item.product_id,
      item.base_price,
      'NONE',
      [],
      undefined,
      { name: item.product_name, image: item.product_image }
    );
    toast({ title: 'Item added without customization' });
  };

  // Save different customization from sheet
  const handleSaveNewCustomization = async () => {
    if (!customSheetProductId) return;

    const selected = availableCustomizations.filter(c => selectedCustomizations.has(c.id));
    const parts: string[] = [];
    if (selected.length > 0) parts.push(`custs:${selected.map(c => c.id).sort().join(',')}`);
    if (customNote.trim()) parts.push(`note:${customNote.trim().substring(0, 50)}`);
    const signature = parts.join('|') || 'NONE';

    const custList = selected.map(c => ({ name: c.name, price: c.is_paid ? c.price : 0 }));

    await addToCart(
      customSheetProductId,
      customSheetProductPrice,
      signature,
      custList,
      customNote.trim() || undefined,
      { name: customSheetProductName, image: customSheetProductImage }
    );

    showNav();
    setShowCustomSheet(false);
    toast({ title: 'Item added with new customization' });
  };

  const toggleCustomization = (custId: string) => {
    setSelectedCustomizations(prev => {
      const next = new Set(prev);
      if (next.has(custId)) next.delete(custId);
      else next.add(custId);
      return next;
    });
  };

  // Pre-checkout: require auth, then validate stock
  const handleProceedToCheckout = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout', defaultSignUp: true } });
      return;
    }
    setCheckingStock(true);
    try {
      const productIds = [...new Set(items.map(i => i.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, stock')
        .in('id', productIds);

      const stockMap: Record<string, number> = {};
      for (const p of products || []) stockMap[p.id] = p.stock;

      const errors: StockErrorItem[] = [];
      for (const item of items) {
        const stock = stockMap[item.product_id] ?? 0;
        if (stock < item.quantity) {
          errors.push({
            cart_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            available_stock: stock,
            requested_quantity: item.quantity,
          });
        }
      }

      if (errors.length > 0) {
        setStockErrorItems(errors);
        setShowStockModal(true);
      } else {
        navigate('/checkout');
      }
    } finally {
      setCheckingStock(false);
    }
  }, [isAuthenticated, items, navigate]);

  const handleStockRemoveItem = async (cartItemId: string) => {
    await supabase.from('cart_item_customizations').delete().eq('cart_item_id', cartItemId);
    await supabase.from('cart_item_notes').delete().eq('cart_item_id', cartItemId);
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    setStockErrorItems(prev => prev.filter(i => i.cart_item_id !== cartItemId));
    await refreshCart();
  };

  const handleStockAdjustItem = async (cartItemId: string, newQuantity: number) => {
    await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId);
    setStockErrorItems(prev => prev.filter(i => i.cart_item_id !== cartItemId));
    await refreshCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Cart" />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Cart" />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Discover our collection and find something special
          </p>
          <Link to="/shop" className="bg-accent text-accent-foreground px-6 py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-accent/90 transition-colors shadow-sm">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Cart" />

      <div className="px-4 py-2">
        <p className="text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Cart Items */}
      <div className="px-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 py-4 border-b border-border animate-fade-in">
            <div className="w-24 h-32 bg-primary overflow-hidden flex-shrink-0">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm text-foreground pr-2">{item.product_name}</h3>
                  <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Remove item">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {item.customizations.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.customizations.map(c => (
                      <p key={c.id} className="text-xs text-muted-foreground">
                        {c.customization_name}
                        {c.customization_price > 0 && ` (+${formatPrice(c.customization_price)})`}
                      </p>
                    ))}
                  </div>
                )}
                {item.customization_signature && !item.customizations.length && (
                  <p className="text-xs text-muted-foreground mt-1">{item.customization_signature}</p>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 border border-border hover:border-foreground/50 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleIncrease(item)}
                    className="p-1 border border-border hover:border-foreground/50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.base_price * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Section */}
      <div className="px-4 py-4">
        {coupon ? (
          <div className="flex items-center justify-between p-4 border border-accent bg-accent/5">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">{coupon.code}</p>
                <p className="text-xs text-accent">
                  You save {formatPrice(discount)}
                </p>
              </div>
            </div>
            <button onClick={handleRemoveCoupon} className="text-xs text-muted-foreground hover:text-foreground">
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpenCoupon}
            className="w-full flex items-center justify-between p-4 border border-border hover:border-foreground/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Apply Coupon</span>
            </div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-6 bg-muted/30 mx-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Price Details</h3>
        <div className="space-y-2">
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
          <div className="flex justify-between text-base font-medium pt-3 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="px-4 py-6">
        <button
          onClick={handleProceedToCheckout}
          disabled={checkingStock}
          className="w-full btn-filled py-3 text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {checkingStock && <Loader2 className="h-4 w-4 animate-spin" />}
          Proceed to Checkout
        </button>
      </div>

      {/* Coupon Sheet */}
      <Sheet open={showCouponSheet} onOpenChange={(open) => !open && handleCloseCoupon()}>
        <SheetContent side="bottom" className="h-[75vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-xl">Apply Coupon</SheetTitle>
          </SheetHeader>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm uppercase"
            />
            <button onClick={applyManualCoupon} className="btn-filled px-4 py-3 text-xs uppercase tracking-wider">
              Apply
            </button>
          </div>
          {couponError && <p className="text-xs text-destructive mb-4 -mt-4">{couponError}</p>}

          {/* Available Coupons List */}
          <div className="mt-2">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Available Coupons</h4>
            {loadingCoupons ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : availableCoupons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No coupons available</p>
            ) : (
              <div className="space-y-3">
                {availableCoupons.map(c => {
                  const isApplied = coupon?.id === c.id;
                  const isApplying = applyingCouponId === c.id;
                  return (
                    <div key={c.id} className={`p-4 border transition-colors ${isApplied ? 'border-accent bg-accent/5' : 'border-border'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Percent className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold tracking-wider">{c.code}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.discount_type === 'percentage'
                                ? `${c.discount_value}% off`
                                : `${formatPrice(c.discount_value)} off`}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {!c.allow_cod && <span className="text-[10px] text-destructive/80">Online only</span>}
                              {!c.allow_online && <span className="text-[10px] text-destructive/80">COD only</span>}
                            </div>
                          </div>
                        </div>
                        {isApplied ? (
                          <span className="text-xs text-accent font-medium flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Applied
                          </span>
                        ) : (
                          <button
                            disabled={isApplying}
                            onClick={async () => {
                              setApplyingCouponId(c.id);
                              setCouponError('');
                              const result = await applyCoupon(c.code);
                              setApplyingCouponId(null);
                              if (result.error) {
                                setCouponError(result.error);
                              } else {
                                toast({ title: 'Coupon applied' });
                                handleCloseCoupon();
                              }
                            }}
                            className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                          >
                            {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Customization Sheet for "Choose Different" */}
      <Sheet open={showCustomSheet} onOpenChange={(open) => { if (!open) { showNav(); setShowCustomSheet(false); } }}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-xl">Choose Customization</SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Available Options</h4>
              <div className="space-y-3">
                {availableCustomizations.map(cust => (
                  <label key={cust.id} className="flex items-center gap-3 p-3 border border-border hover:border-foreground/30 transition-colors cursor-pointer">
                    <Checkbox
                      checked={selectedCustomizations.has(cust.id)}
                      onCheckedChange={() => toggleCustomization(cust.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{cust.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {cust.is_paid ? `+${formatPrice(cust.price)}` : 'Free'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Additional Notes (Optional)</h4>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Any specific requirements..."
                rows={3}
                className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm resize-none"
              />
            </div>
            <button
              onClick={handleSaveNewCustomization}
              className="w-full py-3.5 bg-accent text-accent-foreground rounded-lg text-sm uppercase tracking-wider hover:bg-accent/90 transition-colors shadow-sm"
            >
              Add to Cart
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Smart quantity dialog */}
      <CartQuantityDialog
        isOpen={!!quantityDialogItem}
        onClose={() => setQuantityDialogItem(null)}
        onSameCustomization={handleSameCustomization}
        onDifferentCustomization={handleDifferentCustomization}
        onNoCustomization={handleNoCustomization}
      />

      {/* Pre-checkout stock validation modal */}
      <StockErrorModal
        isOpen={showStockModal}
        items={stockErrorItems}
        onClose={() => setShowStockModal(false)}
        onRemoveItem={handleStockRemoveItem}
        onAdjustQuantity={handleStockAdjustItem}
        onRefreshCart={async () => { await refreshCart(); setShowStockModal(false); }}
      />
    </div>
  );
};

export default CartPage;
