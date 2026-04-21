import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CollectionItem {
  id: string;
  name: string;
  show_on_home: boolean;
}

interface FeaturedProduct {
  id: string;
  name: string;
  show_on_home: boolean;
}

export const useHomeSections = () => {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true);
    const { data, error } = await supabase
      .from("collections")
      .select("id, name, show_on_home")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load collections", description: error.message, variant: "destructive" });
    } else {
      setCollections(
        (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          show_on_home: c.show_on_home ?? false,
        }))
      );
    }
    setLoadingCollections(false);
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, show_on_home")
      .eq("is_featured", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load products", description: error.message, variant: "destructive" });
    } else {
      setFeaturedProducts(
        (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          show_on_home: p.show_on_home ?? false,
        }))
      );
    }
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchFeaturedProducts();
  }, [fetchCollections, fetchFeaturedProducts]);

  const toggleCollectionHome = async (id: string) => {
    const item = collections.find((c) => c.id === id);
    if (!item) return;
    const newValue = !item.show_on_home;

    // Optimistic update
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, show_on_home: newValue } : c))
    );

    const { error } = await supabase
      .from("collections")
      .update({ show_on_home: newValue })
      .eq("id", id);

    if (error) {
      // Revert
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, show_on_home: !newValue } : c))
      );
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const toggleProductHome = async (id: string) => {
    const item = featuredProducts.find((p) => p.id === id);
    if (!item) return;
    const newValue = !item.show_on_home;

    // Optimistic update
    setFeaturedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, show_on_home: newValue } : p))
    );

    const { error } = await supabase
      .from("products")
      .update({ show_on_home: newValue })
      .eq("id", id);

    if (error) {
      // Revert
      setFeaturedProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, show_on_home: !newValue } : p))
      );
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  return {
    collections,
    featuredProducts,
    loadingCollections,
    loadingProducts,
    toggleCollectionHome,
    toggleProductHome,
  };
};
