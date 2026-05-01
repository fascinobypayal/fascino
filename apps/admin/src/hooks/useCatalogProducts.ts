import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  is_new: boolean | null;
  is_customizable: boolean | null;
  show_on_home: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  image?: string;
}

export interface ProductImage {
  id: string;
  image_url: string;
  product_id: string | null;
  sort_order: number | null;
}

export interface ProductCustomization {
  id: string;
  name: string;
  is_paid: boolean | null;
  price: number | null;
  product_id: string | null;
}

export const useCatalogProducts = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog-products"],
    queryFn: async () => {
      const { data: prods, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch first image for each product
      const productIds = prods.map((p) => p.id);
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

      return prods.map((p) => ({
        ...p,
        image: imageMap.get(p.id) || "",
      })) as CatalogProduct[];
    },
  });

  return { products, isLoading };
};

export const useProductDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: images = [], isLoading: loadingImages } = useQuery({
    queryKey: ["product-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!id,
  });

  const { data: customizations = [] } = useQuery({
    queryKey: ["product-customizations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_customizations")
        .select("*")
        .eq("product_id", id!);
      if (error) throw error;
      return data as ProductCustomization[];
    },
    enabled: !!id,
  });

  const { data: customizationSettings } = useQuery({
    queryKey: ["product-customization-settings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_customization_settings")
        .select("*")
        .eq("product_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateProduct = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("products")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      toast({ title: "Product saved" });
    },
    onError: (e: Error) => {
      toast({ title: "Error saving product", description: e.message, variant: "destructive" });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async () => {
      // Clear all dependent records that are safe to remove
      await supabase.from("cart_items").delete().eq("product_id", id!);
      await supabase.from("wishlist_items").delete().eq("product_id", id!);
      await supabase.from("product_images").delete().eq("product_id", id!);
      await supabase.from("product_customizations").delete().eq("product_id", id!);
      await supabase.from("product_customization_settings").delete().eq("product_id", id!);
      await supabase.from("collection_products").delete().eq("product_id", id!);

      // Attempt hard delete
      const { error } = await supabase.from("products").delete().eq("id", id!);

      if (error) {
        // FK or NOT NULL constraint means product is referenced by order history — soft delete instead
        const msg = error.message.toLowerCase();
        if (
          error.code === "23503" ||
          error.code === "23502" ||
          msg.includes("foreign key") ||
          msg.includes("not-null") ||
          msg.includes("order_items")
        ) {
          const { error: softErr } = await supabase
            .from("products")
            .update({ is_deleted: true, is_published: false })
            .eq("id", id!);
          if (softErr) throw softErr;
          return { softDeleted: true };
        }
        throw error;
      }
      return { softDeleted: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      if (result?.softDeleted) {
        toast({
          title: "Product deactivated",
          description: "This product has past orders so it was deactivated instead of deleted. It will no longer appear in the store.",
        });
      } else {
        toast({ title: "Product deleted" });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Error deleting product", description: e.message, variant: "destructive" });
    },
  });

  const saveCustomizations = async (
    opts: { name: string; is_paid: boolean; price: number }[],
    allowCustomNote: boolean
  ) => {
    // Delete existing and re-insert
    await supabase.from("product_customizations").delete().eq("product_id", id!);
    if (opts.length > 0) {
      const { error } = await supabase.from("product_customizations").insert(
        opts.map((o) => ({
          product_id: id!,
          name: o.name,
          is_paid: o.is_paid,
          price: o.price,
        }))
      );
      if (error) throw error;
    }

    // Upsert customization settings
    const { error: settingsError } = await supabase
      .from("product_customization_settings")
      .upsert({ product_id: id!, allow_custom_note: allowCustomNote }, { onConflict: "product_id" });
    if (settingsError) throw settingsError;

    queryClient.invalidateQueries({ queryKey: ["product-customizations", id] });
    queryClient.invalidateQueries({ queryKey: ["product-customization-settings", id] });
  };

  // Image management
  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    const currentMax = images.reduce((max, img) => Math.max(max, img.sort_order || 0), 0);
    const { error: dbError } = await supabase.from("product_images").insert({
      product_id: id!,
      image_url: urlData.publicUrl,
      sort_order: currentMax + 1,
    });
    if (dbError) throw dbError;

    queryClient.invalidateQueries({ queryKey: ["product-images", id] });
    queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    // Extract storage path from URL
    const bucketUrl = supabase.storage.from("product-images").getPublicUrl("").data.publicUrl;
    const storagePath = imageUrl.replace(bucketUrl, "");
    if (storagePath) {
      await supabase.storage.from("product-images").remove([storagePath]);
    }
    const { error } = await supabase.from("product_images").delete().eq("id", imageId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["product-images", id] });
    queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
  };

  return {
    product,
    images,
    customizations,
    customizationSettings,
    isLoading: loadingProduct || loadingImages,
    updateProduct,
    deleteProduct,
    saveCustomizations,
    uploadImage,
    deleteImage,
  };
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      price: number;
      stock: number;
      category: string;
      is_published: boolean;
      is_featured?: boolean;
      is_new?: boolean;
      is_customizable?: boolean;
    }) => {
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          name: data.name,
          description: data.description || null,
          price: data.price,
          stock: data.stock,
          category: data.category,
          is_published: data.is_published,
          is_featured: data.is_featured ?? false,
          is_new: data.is_new ?? false,
          is_customizable: data.is_customizable ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error creating product", description: e.message, variant: "destructive" });
    },
  });
};
