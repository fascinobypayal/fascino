import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useToast } from '@/hooks/use-toast';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category?: string | null;
  is_customizable?: boolean;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showAuthModal, closeAuthModal, requireAuth } = useAuthGuard();
  const { toast } = useToast();
  const { formatPrice } = useStoreSettings();
  const [animating, setAnimating] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const outOfStock = (product.stock ?? 1) <= 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      setAnimating(true);
      const nowWishlisted = await toggleWishlist(product.id);
      toast({ title: nowWishlisted ? 'Added to wishlist' : 'Removed from wishlist' });
      setTimeout(() => setAnimating(false), 400);
    });
  };

  return (
    <>
      <Link to={`/product/${product.id}`} className="block">
        <article className="card-product group">
          <div className="aspect-[4/5] overflow-hidden bg-primary relative">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
            )}
            {product.is_customizable && (
              <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] uppercase tracking-wider text-accent bg-card/90 backdrop-blur-sm px-2 py-1">
                <Sparkles className="h-2.5 w-2.5" />
                Customisable
              </span>
            )}
            {outOfStock && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest text-foreground font-medium">Out of Stock</span>
              </div>
            )}
            <button
              onClick={handleWishlistClick}
              className="absolute top-2 left-2 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95"
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`h-4 w-4 transition-all duration-300 ease-out ${
                  wishlisted ? 'fill-accent text-accent' : 'text-foreground/70'
                } ${animating ? 'scale-125' : 'scale-100'}`}
                style={{
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease, fill 0.2s ease',
                  transform: animating ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            </button>
          </div>
          <div className="p-4">
            {product.category && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {product.category}
              </p>
            )}
            <h3 className="font-medium text-sm text-foreground line-clamp-1">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPrice(product.price)}
            </p>
          </div>
        </article>
      </Link>
      <AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </>
  );
};

export default ProductCard;
