import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import CollectionCard from '@/components/CollectionCard';
import { useProducts, useCollections } from '@/hooks/useProducts';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useBottomNav } from '@/contexts/BottomNavContext';

type PriceRange = 'under5k' | '5k-25k' | '25k-50k' | 'above50k' | null;
type SortOption = 'newest' | 'price_asc' | 'price_desc' | null;

const priceRanges: { key: PriceRange; label: string; min: number; max: number }[] = [
  { key: 'under5k', label: 'Under ₹5K', min: 0, max: 5000 },
  { key: '5k-25k', label: '₹5K - ₹25K', min: 5000, max: 25000 },
  { key: '25k-50k', label: '₹25K - ₹50K', min: 25000, max: 50000 },
  { key: 'above50k', label: 'Above ₹50K', min: 50000, max: Infinity },
];

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const activeTab = searchParams.get('tab') || 'products';
  const [showFilters, setShowFilters] = useState(false);
  const { hideNav, showNav } = useBottomNav();

  // Active filter/sort state
  const [activePriceRange, setActivePriceRange] = useState<PriceRange>(null);
  const [activeSort, setActiveSort] = useState<SortOption>(null);

  // Pending state for sheet (apply on confirm)
  const [pendingPriceRange, setPendingPriceRange] = useState<PriceRange>(null);
  const [pendingSort, setPendingSort] = useState<SortOption>(null);

  const { products, loading: productsLoading } = useProducts();
  const { collections, loading: collectionsLoading } = useCollections();

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Category filter
    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory);
    }

    // Price range filter
    if (activePriceRange) {
      const range = priceRanges.find(r => r.key === activePriceRange);
      if (range) {
        result = result.filter(p => p.price >= range.min && p.price < range.max);
      }
    }

    // Sort
    if (activeSort === 'price_asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }
    // 'newest' is default order from DB

    return result;
  }, [products, activeCategory, activePriceRange, activeSort]);

  const handleOpenFilters = () => {
    setPendingPriceRange(activePriceRange);
    setPendingSort(activeSort);
    hideNav();
    setShowFilters(true);
  };
  const handleCloseFilters = () => { showNav(); setShowFilters(false); };

  const handleApplyFilters = () => {
    setActivePriceRange(pendingPriceRange);
    setActiveSort(pendingSort);
    handleCloseFilters();
  };

  const handleClearFilters = () => {
    setPendingPriceRange(null);
    setPendingSort(null);
  };

  const hasActiveFilters = activePriceRange !== null || activeSort !== null;

  const setCategory = (cat: string | null) => {
    if (cat) {
      setSearchParams({ category: cat, tab: 'products' });
    } else {
      setSearchParams({ tab: activeTab });
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'products') {
      setSearchParams(activeCategory ? { category: activeCategory, tab } : { tab });
    } else {
      setSearchParams({ tab });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="Shop"
        rightElement={
          <button onClick={handleOpenFilters} className="relative p-2 text-foreground hover:text-accent transition-colors" aria-label="Toggle filters">
            <SlidersHorizontal className="h-5 w-5" />
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-14 z-30 bg-background border-b border-border">
          <TabsList className="w-full rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              value="products"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs uppercase tracking-widest"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs uppercase tracking-widest"
            >
              Collections
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="products">
          {categories.length > 0 && (
            <div className="bg-background border-b border-border">
              <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                <button
                  onClick={() => setCategory(null)}
                  className={`flex-shrink-0 px-5 py-2.5 text-xs uppercase tracking-wider rounded-full transition-all duration-200 ${
                    !activeCategory
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-transparent border border-border text-muted-foreground hover:border-foreground/40'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-shrink-0 px-5 py-2.5 text-xs uppercase tracking-wider rounded-full transition-all duration-200 ${
                      activeCategory === cat
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'bg-transparent border border-border text-muted-foreground hover:border-foreground/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-6 pb-8">
            {productsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 stagger-children">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="collections">
          <div className="px-4 py-6 pb-8">
            {collectionsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : collections.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground">No collections found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 stagger-children">
                {collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={(open) => !open && handleCloseFilters()}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader className="mb-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-serif text-xl">Filters</SheetTitle>
              {(pendingPriceRange || pendingSort) && (
                <button onClick={handleClearFilters} className="text-xs text-accent uppercase tracking-wider">
                  Clear All
                </button>
              )}
            </div>
          </SheetHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Price Range</h3>
              <div className="flex flex-wrap gap-3">
                {priceRanges.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setPendingPriceRange(pendingPriceRange === range.key ? null : range.key)}
                    className={`px-3 py-2 text-xs border transition-colors ${
                      pendingPriceRange === range.key
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Sort By</h3>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((sort) => (
                  <button
                    key={sort.key}
                    onClick={() => setPendingSort(pendingSort === sort.key ? null : sort.key)}
                    className={`px-3 py-2 text-xs border transition-colors ${
                      pendingSort === sort.key
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleApplyFilters} className="w-full mt-8 btn-filled py-3 text-sm uppercase tracking-wider">Apply Filters</button>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ShopPage;
