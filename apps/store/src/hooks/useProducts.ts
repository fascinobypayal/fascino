import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  stock: number;
  is_customizable: boolean;
  is_featured: boolean;
  is_new: boolean;
  show_on_home: boolean;
  description: string | null;
  image: string | null;
}

export interface DbCollection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
}

export function useProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, stock, is_customizable, is_featured, is_new, description, show_on_home')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) { console.error(error); setLoading(false); return; }

      const ids = (data || []).map(p => p.id);
      let imageMap: Record<string, string> = {};
      if (ids.length > 0) {
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

      setProducts((data || []).map(p => ({
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
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  return { products, loading };
}

export function useFeaturedProducts() {
  const { products, loading } = useProducts();
  return { products: products.filter(p => p.is_featured && p.show_on_home), loading };
}

export function useCollections() {
  const [collections, setCollections] = useState<DbCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, description, image_url')
        .eq('is_published', true)
        .eq('show_on_home', true)
        .order('created_at', { ascending: false });

      if (error) { console.error(error); setLoading(false); return; }

      // Get product counts per collection
      const collectionIds = (data || []).map(c => c.id);
      let countMap: Record<string, number> = {};
      if (collectionIds.length > 0) {
        const { data: cpData } = await supabase
          .from('collection_products')
          .select('collection_id, product_id');
        if (cpData) {
          for (const cp of cpData) {
            if (collectionIds.includes(cp.collection_id)) {
              countMap[cp.collection_id] = (countMap[cp.collection_id] || 0) + 1;
            }
          }
        }
      }

      setCollections((data || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        image_url: c.image_url,
        product_count: countMap[c.id] || 0,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  return { collections, loading };
}

export function useProductsByCollection(collectionId: string | null) {
  const [productIds, setProductIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (!collectionId) { setProductIds(null); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collectionId);
      setProductIds((data || []).map(d => d.product_id));
    };
    fetch();
  }, [collectionId]);

  return productIds;
}

export function useHomeConfig() {
  const [config, setConfig] = useState<{
    hero_image_url: string | null;
    hero_cta_text: string | null;
    hero_link_type: string | null;
    hero_link_id: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_config')
        .select('hero_image_url, hero_cta_text, hero_link_type, hero_link_id')
        .limit(1)
        .maybeSingle();

      if (error) { console.error(error); }
      setConfig(data || null);
      setLoading(false);
    };
    fetch();
  }, []);

  return { config, loading };
}

export function useProductDetail(productId: string | undefined) {
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [customizations, setCustomizations] = useState<{ id: string; name: string; price: number; is_paid: boolean }[]>([]);
  const [sizes, setSizes] = useState<{ label: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    const fetch = async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from('products')
        .select('id, name, price, category, stock, is_customizable, is_featured, is_new, show_on_home, description')
        .eq('id', productId)
        .eq('is_published', true)
        .maybeSingle();

      if (!p) { setLoading(false); return; }

      const { data: imgs } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      const { data: custs } = await supabase
        .from('product_customizations')
        .select('id, name, price, is_paid')
        .eq('product_id', productId);

      const { data: productSizes } = await supabase
        .from('product_sizes')
        .select('size_label, stock')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      setProduct({
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
        image: imgs?.[0]?.image_url || null,
      });
      setImages((imgs || []).map(i => i.image_url));
      setCustomizations((custs || []).map(c => ({
        id: c.id,
        name: c.name,
        price: c.price ?? 0,
        is_paid: c.is_paid ?? false,
      })));
      setSizes((productSizes || []).map(s => ({
        label: s.size_label,
        stock: s.stock ?? 0,
      })));
      setLoading(false);
    };
    fetch();
  }, [productId]);

  return { product, images, customizations, sizes, loading };
}
