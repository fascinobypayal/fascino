import BrandLogo from '@/components/BrandLogo';
import ProductCard from '@/components/ProductCard';
import CollectionCard from '@/components/CollectionCard';
import { useFeaturedProducts, useCollections, useHomeConfig } from '@/hooks/useProducts';
import fallbackHero from '@/assets/hero-fashion.jpg';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { products: featuredProducts, loading: productsLoading } = useFeaturedProducts();
  const { collections, loading: collectionsLoading } = useCollections();
  const { config: heroConfig, loading: heroLoading } = useHomeConfig();

  const heroImage = heroConfig?.hero_image_url || fallbackHero;
  const ctaText = heroConfig?.hero_cta_text || 'Explore Collection';

  const getCtaLink = (): string | null => {
    // 'new_arrivals' is the legacy value of the Best Seller link type (pre-rename).
    if (heroConfig?.hero_link_type === 'best_seller' || heroConfig?.hero_link_type === 'new_arrivals') return '/best-sellers';
    if (!heroConfig?.hero_link_type || !heroConfig?.hero_link_id) return null;
    if (heroConfig.hero_link_type === 'product') return `/product/${heroConfig.hero_link_id}`;
    if (heroConfig.hero_link_type === 'collection') return `/collection/${heroConfig.hero_link_id}`;
    return null;
  };
  const ctaLink = getCtaLink();

  // Hide hero entirely if config loaded but no row exists and no fallback desired
  // We show fallback image if no config row, so hero always renders unless loading
  if (heroLoading) {
    // Show a minimal loading placeholder for the hero area
  }

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      {/* Hero Section */}
      {heroLoading ? (
        <section className="relative h-[85vh] md:h-screen min-h-[600px] flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </section>
      ) : (
      <section className="relative h-[85vh] md:h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Fascino Fashion" className="h-full w-full object-cover object-top fade-in" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:items-center md:justify-start md:pb-0 md:pl-24 md:pt-[30vh]">
          <div className="text-center md:text-left md:mb-6 fade-in-up fade-in-delay-2"><BrandLogo size="xl" /></div>
          {ctaLink ? (
            <Link to={ctaLink} className="mt-8 btn-accent px-8 py-3 text-sm uppercase tracking-widest fade-in-up fade-in-delay-3">
              {ctaText}
            </Link>
          ) : (
            <Link to="/shop" className="mt-8 btn-accent px-8 py-3 text-sm uppercase tracking-widest fade-in-up fade-in-delay-3">
              {ctaText}
            </Link>
          )}
        </div>
      </section>
      )}

      {/* Collections */}
      {!collectionsLoading && collections.length > 0 && (
        <section className="px-4 py-14 md:max-w-7xl md:mx-auto md:px-12 md:py-20">
          <h2 className="text-center font-serif text-2xl md:text-3xl tracking-wide mb-2 md:mb-3 fade-in">Collections</h2>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-10 fade-in">Curated with intention</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6 stagger-children">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!productsLoading && featuredProducts.length > 0 && (
      <section className="px-4 py-10 md:max-w-7xl md:mx-auto md:px-12">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl tracking-wide fade-in">Editor's Picks</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2 fade-in">Signature pieces, handpicked for you</p>
        </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 stagger-children">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        <div className="mt-8 md:mt-12 text-center fade-in">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors duration-200 uppercase tracking-widest">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      )}

      {/* Brand Story */}
      <section className="px-6 py-14 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 fade-in">The Fascino Promise</p>
        <p className="font-serif text-lg text-foreground/90 leading-relaxed max-w-sm mx-auto fade-in">
          Every piece is a celebration of timeless elegance, crafted with love and attention to the finest details.
        </p>
      </section>
    </div>
  );
};

export default HomePage;
