import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistContextType {
  wishlistedProductIds: Set<string>;
  loading: boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlistedProductIds, setWishlistedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistedProductIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('customer_id', user.id);
      setWishlistedProductIds(new Set((data || []).map(w => w.product_id).filter(Boolean) as string[]));
    } catch (err) {
      console.error('Wishlist fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistedProductIds.has(productId),
    [wishlistedProductIds]
  );

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!user) return false;

    const currentlyWishlisted = wishlistedProductIds.has(productId);

    // Optimistic update
    setWishlistedProductIds(prev => {
      const next = new Set(prev);
      if (currentlyWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (currentlyWishlisted) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('customer_id', user.id)
          .eq('product_id', productId);
      } else {
        await supabase
          .from('wishlists')
          .insert({ customer_id: user.id, product_id: productId });
      }
      return !currentlyWishlisted;
    } catch {
      // Revert on error
      setWishlistedProductIds(prev => {
        const next = new Set(prev);
        if (currentlyWishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return currentlyWishlisted;
    }
  }, [user, wishlistedProductIds]);

  return (
    <WishlistContext.Provider value={{ wishlistedProductIds, loading, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
