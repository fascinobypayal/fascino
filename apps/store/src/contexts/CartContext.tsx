import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalCart, saveLocalCart, clearLocalCart, getLocalCoupon, saveLocalCoupon, clearLocalCoupon, type LocalCartItem } from '@/lib/localCart';

interface CartCustomization {
  id: string;
  customization_name: string;
  customization_price: number;
}

export interface CartItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  base_price: number;
  customization_signature: string | null;
  product_name: string;
  product_image: string | null;
  customizations: CartCustomization[];
}

export interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  applicable_to_cod: boolean;
}

interface CartContextType {
  cartId: string | null;
  items: CartItemWithProduct[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  coupon: AppliedCoupon | null;
  discount: number;
  total: number;
  addToCart: (
    productId: string,
    basePrice: number,
    customizationSignature: string,
    customizations?: { name: string; price: number }[],
    note?: string,
    productMeta?: { name: string; image: string | null }
  ) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<{ error?: string }>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const mapLocalToCart = (local: LocalCartItem[]): CartItemWithProduct[] =>
  local.map(li => ({
    id: li.id,
    product_id: li.product_id,
    quantity: li.quantity,
    base_price: li.base_price,
    customization_signature: li.customization_signature,
    product_name: li.product_name,
    product_image: li.product_image,
    customizations: li.customizations.map(c => ({
      id: c.id,
      customization_name: c.name,
      customization_price: c.price,
    })),
  }));

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [localItems, setLocalItems] = useState<LocalCartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  // Guard against concurrent initCart runs (race during signup → auth state flip)
  const initInFlightRef = useRef<string | null>(null);

  // Initialize or find cart on login, merge local cart
  const initCart = useCallback(async () => {
    if (!user) {
      initInFlightRef.current = null;
      setCartId(null);
      setItems([]);
      // Load guest coupon from localStorage
      const localCoupon = getLocalCoupon();
      setCoupon(localCoupon ? {
        id: localCoupon.id,
        code: localCoupon.code,
        discount_type: localCoupon.discount_type,
        discount_value: localCoupon.discount_value,
        applicable_to_cod: localCoupon.allow_cod,
      } : null);
      setLocalItems(getLocalCart());
      return;
    }

    // Skip if an init is already running for this user
    if (initInFlightRef.current === user.id) return;
    initInFlightRef.current = user.id;

    setLoading(true);
    try {
      let activeCartId: string;

      const { data: existingCart } = await supabase
        .from('carts')
        .select('id, coupon_id')
        .eq('customer_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingCart) {
        activeCartId = existingCart.id;
        if (existingCart.coupon_id) {
          const { data: couponData } = await supabase
            .from('coupons')
            .select('id, code, discount_type, discount_value, allow_cod')
            .eq('id', existingCart.coupon_id)
            .maybeSingle();
          setCoupon(couponData ? {
            id: couponData.id,
            code: couponData.code,
            discount_type: couponData.discount_type,
            discount_value: couponData.discount_value,
            applicable_to_cod: couponData.allow_cod ?? true,
          } : null);
        }
      } else {
        await supabase
          .from('customers')
          .upsert({
            id: user.id,
            email: user.email ?? null,
            full_name: user.user_metadata?.full_name ?? null,
          }, { onConflict: 'id' });

        const { data: newCart, error } = await supabase
          .from('carts')
          .insert({ customer_id: user.id, status: 'active' })
          .select('id')
          .single();

        if (error) throw error;
        activeCartId = newCart.id;
      }

      // Merge any local (guest) cart items into DB cart
      const pendingLocal = getLocalCart();
      if (pendingLocal.length > 0) {
        for (const localItem of pendingLocal) {
          const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', activeCartId)
            .eq('product_id', localItem.product_id)
            .eq('customization_signature', localItem.customization_signature)
            .maybeSingle();

          if (existing) {
            await supabase.from('cart_items')
              .update({ quantity: existing.quantity + localItem.quantity })
              .eq('id', existing.id);
          } else {
            const { data: newItem } = await supabase
              .from('cart_items')
              .insert({
                cart_id: activeCartId,
                product_id: localItem.product_id,
                quantity: localItem.quantity,
                base_price: localItem.base_price,
                customization_signature: localItem.customization_signature,
              })
              .select('id')
              .single();

            if (newItem && localItem.customizations.length > 0) {
              await supabase.from('cart_item_customizations').insert(
                localItem.customizations.map(c => ({
                  cart_item_id: newItem.id,
                  customization_name: c.name,
                  customization_price: c.price,
                }))
              );
            }

            if (newItem && localItem.note) {
              await supabase.from('cart_item_notes').insert({
                cart_item_id: newItem.id,
                note: localItem.note,
              });
            }
          }
        }
        clearLocalCart();
        setLocalItems([]);
      }

      // Merge guest coupon into DB cart
      const pendingCoupon = getLocalCoupon();
      if (pendingCoupon && !existingCart?.coupon_id) {
        // Validate coupon is still active
        const { data: couponData } = await supabase
          .from('coupons')
          .select('id, code, discount_type, discount_value, allow_cod, is_active, expiry_date')
          .eq('id', pendingCoupon.id)
          .eq('is_active', true)
          .maybeSingle();

        if (couponData && (!couponData.expiry_date || new Date(couponData.expiry_date) >= new Date())) {
          await supabase.from('carts').update({ coupon_id: couponData.id }).eq('id', activeCartId);
          setCoupon({
            id: couponData.id,
            code: couponData.code,
            discount_type: couponData.discount_type,
            discount_value: couponData.discount_value,
            applicable_to_cod: couponData.allow_cod ?? true,
          });
        }
      }
      clearLocalCoupon();

      setCartId(activeCartId);
    } catch (err) {
      console.error('Cart init error:', err);
      // Reset guard on error so a retry is possible
      initInFlightRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch cart items with product info (DB)
  const fetchItems = useCallback(async () => {
    if (!cartId) {
      setItems([]);
      return;
    }
    try {
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          id, product_id, quantity, base_price, customization_signature,
          products(name),
          cart_item_customizations(id, customization_name, customization_price)
        `)
        .eq('cart_id', cartId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const productIds = [...new Set((cartItems || []).map(i => i.product_id).filter(Boolean))] as string[];
      let imageMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, image_url')
          .in('product_id', productIds)
          .order('sort_order', { ascending: true });
        if (images) {
          for (const img of images) {
            if (img.product_id && !imageMap[img.product_id]) {
              imageMap[img.product_id] = img.image_url;
            }
          }
        }
      }

      const mapped: CartItemWithProduct[] = (cartItems || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        base_price: item.base_price,
        customization_signature: item.customization_signature,
        product_name: item.products?.name || 'Unknown Product',
        product_image: imageMap[item.product_id] || null,
        customizations: (item.cart_item_customizations || []).map((c: any) => ({
          id: c.id,
          customization_name: c.customization_name,
          customization_price: c.customization_price || 0,
        })),
      }));

      setItems(mapped);
    } catch (err) {
      console.error('Fetch cart items error:', err);
    }
  }, [cartId]);

  useEffect(() => { initCart(); }, [initCart]);
  useEffect(() => { if (cartId) fetchItems(); }, [cartId, fetchItems]);

  useEffect(() => {
    const handleFocus = () => { if (cartId) fetchItems(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cartId, fetchItems]);

  const addToCart = async (
    productId: string,
    basePrice: number,
    customizationSignature: string,
    customizations?: { name: string; price: number }[],
    note?: string,
    productMeta?: { name: string; image: string | null }
  ) => {
    if (!user) {
      // Guest: add to local cart
      let pName = productMeta?.name || 'Product';
      let pImage = productMeta?.image || null;

      if (!productMeta) {
        const { data: prod } = await supabase.from('products').select('name').eq('id', productId).single();
        if (prod) pName = prod.name;
        const { data: img } = await supabase.from('product_images').select('image_url').eq('product_id', productId).order('sort_order').limit(1).maybeSingle();
        if (img) pImage = img.image_url;
      }

      const custList = (customizations || []).map(c => ({ id: crypto.randomUUID(), name: c.name, price: c.price }));
      const localCart = getLocalCart();
      const existing = localCart.find(i => i.product_id === productId && i.customization_signature === customizationSignature);

      if (existing) {
        existing.quantity += 1;
      } else {
        localCart.push({
          id: crypto.randomUUID(),
          product_id: productId,
          product_name: pName,
          product_image: pImage,
          quantity: 1,
          base_price: basePrice,
          customization_signature: customizationSignature,
          customizations: custList,
          note,
        });
      }

      saveLocalCart(localCart);
      setLocalItems([...localCart]);
      return;
    }

    // Authenticated: DB cart
    if (!cartId) return;

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .eq('customization_signature', customizationSignature)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      const { data: newItem, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity: 1,
          base_price: basePrice,
          customization_signature: customizationSignature,
        })
        .select('id')
        .single();

      if (error) throw error;

      if (customizations && customizations.length > 0 && newItem) {
        await supabase.from('cart_item_customizations').insert(
          customizations.map(c => ({
            cart_item_id: newItem.id,
            customization_name: c.name,
            customization_price: c.price,
          }))
        );
      }

      if (note && newItem) {
        await supabase.from('cart_item_notes').insert({
          cart_item_id: newItem.id,
          note,
        });
      }
    }

    await fetchItems();
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!user) {
      const local = getLocalCart();
      if (newQuantity <= 0) {
        const updated = local.filter(i => i.id !== cartItemId);
        saveLocalCart(updated);
        setLocalItems(updated);
      } else {
        const item = local.find(i => i.id === cartItemId);
        if (item) item.quantity = newQuantity;
        saveLocalCart(local);
        setLocalItems([...local]);
      }
      return;
    }

    if (newQuantity <= 0) {
      await removeItem(cartItemId);
      return;
    }
    await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId);
    await fetchItems();
  };

  const removeItem = async (cartItemId: string) => {
    if (!user) {
      const updated = getLocalCart().filter(i => i.id !== cartItemId);
      saveLocalCart(updated);
      setLocalItems(updated);
      return;
    }

    await supabase.from('cart_item_customizations').delete().eq('cart_item_id', cartItemId);
    await supabase.from('cart_item_notes').delete().eq('cart_item_id', cartItemId);
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    await fetchItems();
  };

  const applyCouponFn = async (couponCode: string): Promise<{ error?: string }> => {
    const { data: couponData, error } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, allow_cod, is_active, expiry_date')
      .ilike('code', couponCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !couponData) return { error: 'Invalid coupon code' };
    if (couponData.expiry_date && new Date(couponData.expiry_date) < new Date()) {
      return { error: 'Coupon has expired' };
    }

    if (!user) {
      // Guest: store coupon locally
      const localCoupon = {
        id: couponData.id,
        code: couponData.code,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        allow_cod: couponData.allow_cod ?? true,
      };
      saveLocalCoupon(localCoupon);
      setCoupon({
        ...localCoupon,
        applicable_to_cod: localCoupon.allow_cod,
      });
      return {};
    }

    if (!cartId) return { error: 'No cart' };

    const { error: updateError } = await supabase
      .from('carts')
      .update({ coupon_id: couponData.id })
      .eq('id', cartId);

    if (updateError) return { error: 'Failed to apply coupon' };

    setCoupon({
      id: couponData.id,
      code: couponData.code,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      applicable_to_cod: couponData.allow_cod ?? true,
    });

    return {};
  };

  const removeCouponFn = async () => {
    if (!user) {
      clearLocalCoupon();
      setCoupon(null);
      return;
    }
    if (!cartId) return;
    await supabase.from('carts').update({ coupon_id: null }).eq('id', cartId);
    setCoupon(null);
  };

  const refreshCart = async () => {
    if (!user) {
      setLocalItems(getLocalCart());
      return;
    }
    await fetchItems();
  };

  const effectiveItems = user ? items : mapLocalToCart(localItems);

  const itemCount = effectiveItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = effectiveItems.reduce((sum, item) => {
    const basePrice = Number(item.base_price) || 0;
    const qty = Number(item.quantity) || 0;
    const customizationCost = item.customizations.reduce((s, c) => s + (Number(c.customization_price) || 0), 0);
    return sum + (basePrice + customizationCost) * qty;
  }, 0);

  const discount = coupon
    ? coupon.discount_type === 'PERCENT'
      ? Math.round(subtotal * (Number(coupon.discount_value) / 100))
      : Number(coupon.discount_value) || 0
    : 0;

  const total = Math.max(subtotal - discount, 0);

  return (
    <CartContext.Provider value={{
      cartId, items: effectiveItems, loading, itemCount, subtotal, coupon, discount, total,
      addToCart, updateQuantity, removeItem,
      applyCoupon: applyCouponFn, removeCoupon: removeCouponFn, refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
