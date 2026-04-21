import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { DbProduct, DbCollection } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';

const CollectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<DbCollection | null>(null);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);

      // Fetch collection details
      const { data: col } = await supabase
        .from('collections')
        .select('id, name, description, image_url')
        .eq('id', id)
        .maybeSingle();

      if (!col) { setLoading(false); return; }

      // Fetch product IDs in this collection
      const { data: cpData } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', id);

      const productIds = (cpData || []).map(cp => cp.product_id);

      let productsList: DbProduct[] = [];
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, price, category, stock, is_customizable, is_featured, is_new, show_on_home, description')
          .eq('is_published', true)
          .in('id', productIds);

        // Fetch images
        let imageMap: Record<string, string> = {};
        if (prods && prods.length > 0) {
          const ids = prods.map(p => p.id);
          const { data: images } = await supabase
            .from('product_images')
            .select('product_id, image_url')
            .in('product_id', ids)
            .order('sort_order', { ascending: true });
          if (images) {
            for (const img of images) {
              if (img.product_id && !imageMap[img.product_id]) {
                imageMap[img.product_id] = img.image_url;
              }
            }
          }
        }

        productsList = (prods || []).map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          stock: p.stock,
          is_customizable: p.is_customizable ?? false,
          is_featured: p.is_featured ?? false,
          is_new: p.is_new ?? false,
          show_on_home: p.show_on_home ?? true,
          description: p.description,
          image: imageMap[p.id] || null,
        }));
      }

      setCollection({
        id: col.id,
        name: col.name,
        description: col.description,
        image_url: col.image_url,
        product_count: productsList.length,
      });
      setProducts(productsList);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Collection" />
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Collection" />
        <div className="text-center py-16"><p className="text-sm text-muted-foreground">Collection not found</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={collection.name} />

      {/* Collection Hero */}
      {collection.image_url && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={collection.image_url}
            alt={collection.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="font-serif text-2xl text-white tracking-wide">{collection.name}</h1>
          </div>
        </div>
      )}

      {/* Description */}
      {collection.description && (
        <div className="px-4 py-4 border-b border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{collection.description}</p>
        </div>
      )}

      {/* Products */}
      <div className="px-4 py-6 pb-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No products in this collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 stagger-children">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionPage;
