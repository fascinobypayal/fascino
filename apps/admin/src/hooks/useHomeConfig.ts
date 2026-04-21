import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface HomeConfig {
  id: string;
  hero_image_url: string | null;
  hero_cta_text: string | null;
  hero_link_type: string | null;
  hero_link_id: string | null;
}

interface LinkOption {
  id: string;
  name: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const useHomeConfig = () => {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<LinkOption[]>([]);
  const [collections, setCollections] = useState<LinkOption[]>([]);

  // Fetch or create config
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("home_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (data) {
        setConfig(data);
      } else {
        // Insert empty row
        const { data: newRow, error: insertErr } = await supabase
          .from("home_config")
          .insert({})
          .select()
          .single();

        if (insertErr) throw insertErr;
        setConfig(newRow);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch link options
  const fetchLinkOptions = useCallback(async () => {
    const [productsRes, collectionsRes] = await Promise.all([
      supabase.from("products").select("id, name").order("name"),
      supabase.from("collections").select("id, name").order("name"),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (collectionsRes.data) setCollections(collectionsRes.data);
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchLinkOptions();
  }, [fetchConfig, fetchLinkOptions]);

  // Upload hero image
  const uploadHeroImage = async (file: File) => {
    if (!config) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload JPG, PNG or WebP", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${ext}`;

      // Delete old image if exists
      if (config.hero_image_url) {
        const oldPath = config.hero_image_url.split("/hero-images/")[1];
        if (oldPath) {
          await supabase.storage.from("hero-images").remove([oldPath]);
        }
      }

      const { error: uploadErr } = await supabase.storage
        .from("hero-images")
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("hero-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update DB
      const { error: updateErr } = await supabase
        .from("home_config")
        .update({ hero_image_url: publicUrl })
        .eq("id", config.id);

      if (updateErr) throw updateErr;

      setConfig(prev => prev ? { ...prev, hero_image_url: publicUrl } : prev);
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Update local config state
  const updateField = (field: keyof HomeConfig, value: string | null) => {
    setConfig(prev => {
      if (!prev) return prev;
      // Reset hero_link_id when link type changes
      if (field === "hero_link_type") {
        return { ...prev, [field]: value, hero_link_id: null };
      }
      return { ...prev, [field]: value };
    });
  };

  // Save config
  const saveConfig = async () => {
    if (!config) return;

    if (!config.hero_cta_text?.trim()) {
      toast({ title: "CTA text is required", variant: "destructive" });
      return;
    }
    if (!config.hero_link_type) {
      toast({ title: "Link type is required", variant: "destructive" });
      return;
    }
    if (!config.hero_link_id) {
      toast({ title: "Please select a target", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from("home_config")
        .update({
          hero_cta_text: config.hero_cta_text,
          hero_link_type: config.hero_link_type,
          hero_link_id: config.hero_link_id,
        })
        .eq("id", config.id);

      if (updateErr) throw updateErr;

      // Refetch to confirm
      await fetchConfig();
      toast({ title: "Configuration saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    uploading,
    error,
    products,
    collections,
    uploadHeroImage,
    updateField,
    saveConfig,
    refetch: fetchConfig,
  };
};
