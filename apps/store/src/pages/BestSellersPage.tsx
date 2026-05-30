import { useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';

const BestSellersPage = () => {
  const { products, loading } = useProducts();

  // Best sellers are curated via the "Best Seller" toggle (stored on is_new)
  const bestSellers = useMemo(
    () => products.filter((p) => p.is_new),
    [products]
  );

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Best Sellers" showBack />

      <div className="px-4 pt-5">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Customer favourites</p>
        <h1 className="font-serif text-2xl tracking-wide mt-1">Best Sellers</h1>
      </div>

      <div className="px-4 py-6 pb-8">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : bestSellers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No best sellers yet</p>
            <p className="text-xs text-muted-foreground mt-1">Our most-loved pieces will appear here soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 stagger-children">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellersPage;
