import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Heart, ShoppingBag, Loader2 } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WishlistProduct {
  wishlist_id: string;
  product_id: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
}

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const { toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showAuthModal, closeAuthModal } = useAuthGuard();
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlistItems = async () => {
    if (!isAuthenticated) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id, product_id, products(id, name, price, category)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productIds = (data || []).map((w: any) => w.product_id).filter(Boolean) as string[];
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

      setItems((data || []).filter((w: any) => w.products).map((w: any) => ({
        wishlist_id: w.id,
        product_id: w.product_id,
        name: w.products.name,
        price: w.products.price,
        image: imageMap[w.product_id] || null,
        category: w.products.category,
      })));
    } catch (err) {
      console.error('Wishlist fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlistItems(); }, [isAuthenticated]);

  const handleRemove = async (item: WishlistProduct) => {
    setRemovingId(item.wishlist_id);
    await toggleWishlist(item.product_id);
    setItems(prev => prev.filter(i => i.wishlist_id !== item.wishlist_id));
    toast({ title: 'Removed from wishlist' });
    setRemovingId(null);
  };

  const handleAddToCart = async (item: WishlistProduct) => {
    try {
      await addToCart(item.product_id, item.price, 'size:M', [{ name: 'Size: M', price: 0 }]);
      toast({ title: 'Added to cart', description: `${item.name} added to your cart` });
    } catch {
      toast({ title: 'Error', description: 'Could not add to cart', variant: 'destructive' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Wishlist" showBack />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">Login to see your wishlist</h2>
          <p className="text-sm text-muted-foreground mb-6">Save your favorite pieces for later</p>
          <Link to="/login" className="btn-accent px-6 py-2.5 text-sm uppercase tracking-wider">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Wishlist" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Wishlist" showBack />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-muted-foreground mb-6">Save your favorite pieces for later</p>
          <Link to="/shop" className="btn-accent px-6 py-2.5 text-sm uppercase tracking-wider">Explore Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Wishlist" showBack />
      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      <div className="px-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.wishlist_id}
            className={`flex gap-4 p-4 bg-card border border-border transition-opacity duration-300 ${removingId === item.wishlist_id ? 'opacity-0' : 'opacity-100'}`}
          >
            <Link to={`/product/${item.product_id}`} className="w-24 h-32 bg-primary overflow-hidden flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
              )}
            </Link>
            <div className="flex-1 flex flex-col">
              <Link to={`/product/${item.product_id}`}>
                <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
              </Link>
              {item.category && (
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{item.category}</p>
              )}
              <p className="text-sm mt-1">₹{item.price.toLocaleString('en-IN')}</p>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 btn-filled py-2 text-xs uppercase tracking-wider"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="p-2 border border-border hover:border-destructive hover:text-destructive transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </div>
  );
};

export default WishlistPage;
