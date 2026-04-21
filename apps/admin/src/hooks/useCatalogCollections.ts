import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CatalogCollection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean | null;
  show_on_home: boolean | null;
  created_at: string | null;
}

export interface CollectionProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export const useCatalogCollections = () => {
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["catalog-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CatalogCollection[];
    },
  });

  return { collections, isLoading };
};

export const useCollectionDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: collection, isLoading: loadingCollection } = useQuery({
    queryKey: ["collection-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as CatalogCollection | null;
    },
    enabled: !!id,
  });

  const { data: collectionProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["collection-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_products")
        .select("product_id, products(id, name, price)")
        .eq("collection_id", id!);
      if (error) throw error;

      const productIds = data.map((cp: any) => cp.product_id);
      // Fetch first image for each product
      const { data: images } = await supabase
        .from("product_images")
        .select("product_id, image_url, sort_order")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true });

      const imageMap = new Map<string, string>();
      images?.forEach((img) => {
        if (img.product_id && !imageMap.has(img.product_id)) {
          imageMap.set(img.product_id, img.image_url);
        }
      });

      return data.map((cp: any) => ({
        id: cp.products.id,
        name: cp.products.name,
        price: cp.products.price,
        image: imageMap.get(cp.products.id) || "",
      })) as CollectionProduct[];
    },
    enabled: !!id,
  });

  const updateCollection = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("collections")
        .update(updates)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["catalog-collections"] });
      toast({ title: "Collection saved" });
    },
    onError: (e: Error) => {
      toast({ title: "Error saving collection", description: e.message, variant: "destructive" });
    },
  });

  const deleteCollection = useMutation({
    mutationFn: async () => {
      await supabase.from("collection_products").delete().eq("collection_id", id!);
      const { error } = await supabase.from("collections").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-collections"] });
      toast({ title: "Collection deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error deleting collection", description: e.message, variant: "destructive" });
    },
  });

  const addProductToCollection = async (productId: string) => {
    const { error } = await supabase
      .from("collection_products")
      .upsert({ collection_id: id!, product_id: productId }, { onConflict: "collection_id,product_id" });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["collection-products", id] });
  };

  const removeProductFromCollection = async (productId: string) => {
    const { error } = await supabase
      .from("collection_products")
      .delete()
      .eq("collection_id", id!)
      .eq("product_id", productId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["collection-products", id] });
  };

  return {
    collection,
    collectionProducts,
    isLoading: loadingCollection || loadingProducts,
    updateCollection,
    deleteCollection,
    addProductToCollection,
    removeProductFromCollection,
  };
};

export const usePublishedProducts = () => {
  return useQuery({
    queryKey: ["published-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const productIds = data.map((p) => p.id);
      const { data: images } = await supabase
        .from("product_images")
        .select("product_id, image_url, sort_order")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true });

      const imageMap = new Map<string, string>();
      images?.forEach((img) => {
        if (img.product_id && !imageMap.has(img.product_id)) {
          imageMap.set(img.product_id, img.image_url);
        }
      });

      return data.map((p) => ({
        ...p,
        image: imageMap.get(p.id) || "",
      })) as CollectionProduct[];
    },
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      image_url: string;
      show_on_home: boolean;
      productIds: string[];
    }) => {
      const { data: collection, error } = await supabase
        .from("collections")
        .insert({
          name: data.name,
          description: data.description || null,
          image_url: data.image_url || null,
          is_published: true,
          show_on_home: data.show_on_home,
        })
        .select()
        .single();
      if (error) throw error;

      if (data.productIds.length > 0) {
        const { error: cpError } = await supabase
          .from("collection_products")
          .insert(
            data.productIds.map((pid) => ({
              collection_id: collection.id,
              product_id: pid,
            }))
          );
        if (cpError) throw cpError;
      }

      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-collections"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error creating collection", description: e.message, variant: "destructive" });
    },
  });
};
