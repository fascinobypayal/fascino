import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Sparkles, Loader2 } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import SizeSelector from '@/components/SizeSelector';
import BottomActionBar from '@/components/BottomActionBar';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useProductDetail } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';

import { useBottomNav } from '@/contexts/BottomNavContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Checkbox } from '@/components/ui/checkbox';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hideNav, showNav } = useBottomNav();
  const { showAuthModal, closeAuthModal, requireAuth } = useAuthGuard();

  const { addToCart } = useCart();
  const { isWishlisted: checkWishlisted, toggleWishlist } = useWishlist();
  const { formatPrice } = useStoreSettings();

  const { product, images, customizations, sizes, loading } = useProductDetail(id);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Set<string>>(new Set());
  const [addedToCart, setAddedToCart] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const hasCustomizations = customizations.length > 0;
  const hasSizes = sizes.length > 0;
  const outOfStock = product.stock <= 0;

  const isVideo = (url: string) => /\.(mp4|webm|mov|m4v|ogg)$/i.test((url || '').split('?')[0]);
  // Cart/thumbnail previews must be a still image, never a video
  const thumbnailImage = images.find((u) => !isVideo(u)) || (product.image && !isVideo(product.image) ? product.image : null);

  const handleOpenCustomization = () => { hideNav(); setShowCustomization(true); };
  const handleCloseCustomization = () => { showNav(); setShowCustomization(false); };

  const toggleCustomization = (custId: string) => {
    setSelectedCustomizations(prev => {
      const next = new Set(prev);
      if (next.has(custId)) next.delete(custId);
      else next.add(custId);
      return next;
    });
  };

  const getSelectedCustomizationsList = () => {
    return customizations.filter(c => selectedCustomizations.has(c.id));
  };

  const buildSignature = () => {
    const parts: string[] = [];
    if (selectedSize) parts.push(`size:${selectedSize}`);
    const selected = getSelectedCustomizationsList();
    if (selected.length > 0) parts.push(`custs:${selected.map(c => c.id).sort().join(',')}`);
    if (customNote.trim()) parts.push(`note:${customNote.trim().substring(0, 50)}`);
    return parts.join('|') || 'default';
  };

  const handleAddToCart = async () => {
    if (hasSizes && !selectedSize) {
      toast({ title: 'Please select a size', description: 'Choose your size to add this item to cart' });
      return;
    }
    if (outOfStock) {
      toast({ title: 'Out of stock', variant: 'destructive' });
      return;
    }
    setAddingToCart(true);
    try {
      const signature = buildSignature();
      const custList: { name: string; price: number }[] = [
        ...(selectedSize ? [{ name: `Size: ${selectedSize}`, price: 0 }] : []),
        ...getSelectedCustomizationsList().map(c => ({ name: c.name, price: c.is_paid ? c.price : 0 })),
      ];
      const firstImage = thumbnailImage;
      await addToCart(product.id, product.price, signature, custList, customNote.trim() || undefined, { name: product.name, image: firstImage });
      setAddedToCart(true);
      toast({ title: 'Added to cart', description: selectedSize ? `${product.name} - Size ${selectedSize}` : product.name });
    } catch {
      toast({ title: 'Error', description: 'Could not add to cart', variant: 'destructive' });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (hasSizes && !selectedSize) {
      toast({ title: 'Please select a size', description: 'Choose your size to proceed' });
      return;
    }
    if (outOfStock) {
      toast({ title: 'Out of stock', variant: 'destructive' });
      return;
    }
    setAddingToCart(true);
    try {
      const signature = buildSignature();
      const custList: { name: string; price: number }[] = [
        ...(selectedSize ? [{ name: `Size: ${selectedSize}`, price: 0 }] : []),
        ...getSelectedCustomizationsList().map(c => ({ name: c.name, price: c.is_paid ? c.price : 0 })),
      ];
      const firstImage = thumbnailImage;
      await addToCart(product.id, product.price, signature, custList, customNote.trim() || undefined, { name: product.name, image: firstImage });
      navigate('/cart');
    } catch {
      toast({ title: 'Error', description: 'Could not add to cart', variant: 'destructive' });
    } finally {
      setAddingToCart(false);
    }
  };

  const isProductWishlisted = checkWishlisted(product.id);

  const handleToggleWishlist = () => {
    requireAuth(async () => {
      setHeartAnimating(true);
      const nowWishlisted = await toggleWishlist(product.id);
      toast({ title: nowWishlisted ? 'Added to wishlist' : 'Removed from wishlist' });
      setTimeout(() => setHeartAnimating(false), 400);
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `Check out ${product.name} by Fascino`, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link copied', description: 'Product link copied to clipboard' });
      } else {
        toast({ title: 'Sharing unavailable', description: 'Copy the URL from the address bar' });
      }
    } catch (err: any) {
      // User cancelled share or share failed — silently ignore AbortError, surface others
      if (err?.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  };

  const displayImages = images.length > 0 ? images : [product.image || ''];

  return (
    <div className="min-h-screen pb-24">
      <button onClick={() => navigate(-1)} className="fixed top-4 left-4 z-50 p-2.5 bg-card/90 backdrop-blur-sm rounded-xl shadow-sm" aria-label="Go back">
        <svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={handleShare} className="p-2.5 bg-card/90 backdrop-blur-sm rounded-xl shadow-sm" aria-label="Share">
          <Share2 className="h-5 w-5 text-foreground" />
        </button>
        <button onClick={handleToggleWishlist} className="p-2.5 bg-card/90 backdrop-blur-sm rounded-xl shadow-sm" aria-label="Add to wishlist">
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${isProductWishlisted ? 'fill-accent text-accent' : 'text-foreground'}`}
            style={{
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease, fill 0.2s ease',
              transform: heartAnimating ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        </button>
      </div>

      <ImageCarousel images={displayImages} alt={product.name} />

      <div className="px-4 py-6 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.category}</p>
            <h1 className="font-serif text-2xl mt-1">{product.name}</h1>
          </div>
          {hasCustomizations && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent bg-accent/10 px-2 py-1">
              <Sparkles className="h-3 w-3" />Customisable
            </span>
          )}
        </div>
        <p className="text-lg font-medium mt-2">{formatPrice(product.price)}</p>
        {outOfStock && <p className="text-sm text-destructive mt-1">Out of Stock</p>}

        {hasSizes && (
          <div className="mt-6">
            <SizeSelector sizes={sizes} selectedSize={selectedSize} onSelectSize={setSelectedSize} />
          </div>
        )}

        {hasCustomizations && (
          <button onClick={handleOpenCustomization} className="w-full mt-6 flex items-center justify-between p-4 border border-border hover:border-foreground/30 transition-colors">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <div className="text-left">
                <p className="text-sm font-medium">Customise this piece</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomizations.size > 0 ? `${selectedCustomizations.size} selected` : 'Add personalizations'}
                </p>
              </div>
            </div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Selected customization tags */}
        {selectedCustomizations.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {getSelectedCustomizationsList().map(c => (
              <span key={c.id} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-sm">
                {c.name}{c.is_paid ? ` +${formatPrice(c.price)}` : ''}
              </span>
            ))}
          </div>
        )}

        {product.description && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Description</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{product.description}</p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Care</h3>
          <p className="text-sm text-foreground/80">Dry clean only. Store in provided garment bag.</p>
        </div>
      </div>

      <BottomActionBar>
        <button
          onClick={addedToCart ? () => navigate('/cart') : handleAddToCart}
          disabled={addingToCart || (outOfStock && !addedToCart)}
          className="flex-1 py-3.5 text-xs uppercase tracking-widest border border-foreground/20 rounded-lg hover:border-accent hover:text-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : addedToCart ? 'Go to Cart' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={addingToCart || outOfStock}
          className="flex-1 py-3.5 text-xs uppercase tracking-widest bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
        >
          Buy Now
        </button>
      </BottomActionBar>

      {/* Customization Sheet */}
      <Sheet open={showCustomization} onOpenChange={(open) => !open && handleCloseCustomization()}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle className="font-serif text-xl">Customise Your Piece</SheetTitle></SheetHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Available Options</h4>
              <div className="space-y-3">
                {customizations.map(cust => (
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
              <textarea value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="Any specific requirements..." rows={3} className="w-full px-4 py-3 bg-transparent border border-border focus:border-accent focus:outline-none transition-colors text-sm resize-none" />
            </div>
            <button onClick={handleCloseCustomization} className="w-full py-3.5 bg-accent text-accent-foreground rounded-lg text-sm uppercase tracking-wider hover:bg-accent/90 transition-colors shadow-sm">
              Save Customisation
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </div>
  );
};

export default ProductDetailPage;
