import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Loader2, X, Eye, EyeOff, Star, Sparkles, Plus } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useCreateProduct } from "@/hooks/useCatalogProducts";
import { ALL_SIZES } from "@/hooks/useCatalogProducts";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface LocalCustomization {
  id: string;
  name: string;
  extraPrice: number;
  isFree: boolean;
}

const AddProductPage = () => {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { categoryNames } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [sizeRequired, setSizeRequired] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [allowCustomNote, setAllowCustomNote] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState<LocalCustomization[]>([]);
  const [saving, setSaving] = useState(false);

  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 5 - localImages.length;
    const newFiles = Array.from(files).slice(0, remaining);

    const newLocalImages: LocalImage[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setLocalImages((prev) => [...prev, ...newLocalImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLocalImage = (imageId: string) => {
    setLocalImages((prev) => {
      const img = prev.find((i) => i.id === imageId);
      if (img) URL.revokeObjectURL(img.previewUrl);
      const updated = prev.filter((i) => i.id !== imageId);
      if (activeImage >= updated.length && updated.length > 0) {
        setActiveImage(updated.length - 1);
      } else if (updated.length === 0) {
        setActiveImage(0);
      }
      return updated;
    });
  };

  const uploadImagesToStorage = async (productId: string): Promise<string[]> => {
    const urls: string[] = [];

    for (const img of localImages) {
      const ext = img.file.name.split(".").pop();
      const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, img.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      urls.push(urlData.publicUrl);
    }

    return urls;
  };

  const cleanupStorage = async (productId: string) => {
    try {
      const { data: files } = await supabase.storage
        .from("product-images")
        .list(productId);
      if (files && files.length > 0) {
        await supabase.storage
          .from("product-images")
          .remove(files.map((f) => `${productId}/${f.name}`));
      }
    } catch {
      // Best effort cleanup
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || localImages.length === 0) return;
    if (sizeRequired && selectedSizes.length === 0) {
      toast({ title: "Select at least one available size", variant: "destructive" });
      return;
    }
    setSaving(true);

    let productId: string | null = null;

    try {
      const product = await createProduct.mutateAsync({
        name,
        description,
        price,
        stock,
        category,
        is_published: published,
        is_featured: featured,
        is_new: newArrival,
        is_customizable: customizationEnabled,
        sizes: sizeRequired ? selectedSizes : [],
      });
      productId = product.id;

      // Upload images
      const imageUrls = await uploadImagesToStorage(product.id);
      const imageRecords = imageUrls.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        sort_order: index + 1,
      }));
      const { error: imgError } = await supabase.from("product_images").insert(imageRecords);
      if (imgError) throw imgError;

      // Save customizations if enabled
      if (customizationEnabled) {
        const validOptions = customizationOptions.filter((o) => o.name.trim());
        if (validOptions.length > 0) {
          const { error: custError } = await supabase.from("product_customizations").insert(
            validOptions.map((o) => ({
              product_id: product.id,
              name: o.name,
              price: o.isFree ? 0 : o.extraPrice,
              is_paid: !o.isFree,
            }))
          );
          if (custError) throw custError;
        }
        const { error: settingsError } = await supabase
          .from("product_customization_settings")
          .insert({ product_id: product.id, allow_custom_note: allowCustomNote });
        if (settingsError) throw settingsError;
      }

      toast({ title: "Product created" });
      navigate("/catalog");
    } catch (err: any) {
      if (productId) {
        await cleanupStorage(productId);
        await supabase.from("product_images").delete().eq("product_id", productId);
        await supabase.from("products").delete().eq("id", productId);
      }
      toast({ title: "Error creating product", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">Add Product</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-28 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Image Preview Carousel */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {localImages.length > 0 ? (
                <img
                  src={localImages[activeImage]?.previewUrl}
                  alt={name || "Product preview"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Tap to add images</span>
                  <span className="text-xs">At least 1 image required</span>
                </button>
              )}
            </div>
            {/* Image Dots */}
            {localImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {localImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeImage === idx ? "bg-secondary w-4" : "bg-card/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="px-4 space-y-4">
            {/* Image Management */}
            <LuxuryCard>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Images ({localImages.length})
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {localImages.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <img
                      src={img.previewUrl}
                      alt=""
                      className={`w-full h-full object-cover cursor-pointer ${
                        activeImage === idx ? "ring-2 ring-secondary" : ""
                      }`}
                      onClick={() => setActiveImage(idx)}
                    />
                    <button
                      onClick={() => removeLocalImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/80 text-background flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[8px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
                {localImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-secondary/50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px]">Upload</span>
                  </button>
                )}
              </div>
            </LuxuryCard>

            {/* Basic Info */}
            <LuxuryCard>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="luxury-input mt-2"
                    placeholder="e.g. Silk Saree - Rose Petals"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="luxury-input mt-2 min-h-[80px] resize-none"
                    rows={3}
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={price || ""}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="luxury-input mt-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total Stock *
                    </label>
                    <input
                      type="number"
                      value={stock || ""}
                      onChange={(e) => setStock(Number(e.target.value) || 0)}
                      className="luxury-input mt-2"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="luxury-input mt-2"
                  >
                    <option value="" disabled>Select a category</option>
                    {categoryNames.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </LuxuryCard>

            {/* Sizes */}
            <LuxuryCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Size Required
                </h3>
                <button
                  type="button"
                  onClick={() => setSizeRequired(!sizeRequired)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    sizeRequired ? "bg-secondary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                      sizeRequired ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
              {sizeRequired ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map((size) => {
                      const active = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSizes((prev) =>
                              active ? prev.filter((s) => s !== size) : [...prev, size]
                            )
                          }
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] ${
                            active
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Select every size you can stitch for this product.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This product is sold without size options (e.g. accessories or one-size items).
                </p>
              )}
            </LuxuryCard>

            {/* Status & Visibility */}
            <LuxuryCard>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Status & Visibility
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {published ? (
                      <Eye className="w-4 h-4 text-secondary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">Published</span>
                  </div>
                  <button
                    onClick={() => setPublished(!published)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      published ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                        published ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-foreground">Featured</span>
                  </div>
                  <button
                    onClick={() => setFeatured(!featured)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      featured ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                        featured ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-foreground">New Arrival</span>
                  </div>
                  <button
                    onClick={() => setNewArrival(!newArrival)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      newArrival ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                        newArrival ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </LuxuryCard>

            {/* Customization */}
            <LuxuryCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Customization
                </h3>
                <button
                  onClick={() => setCustomizationEnabled(!customizationEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    customizationEnabled ? "bg-secondary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                      customizationEnabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {customizationEnabled && (
                <div className="space-y-3">
                  {customizationOptions.map((option) => (
                    <div key={option.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => {
                            setCustomizationOptions((prev) =>
                              prev.map((o) => (o.id === option.id ? { ...o, name: e.target.value } : o))
                            );
                          }}
                          placeholder="Option name"
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <button
                          onClick={() => setCustomizationOptions((prev) => prev.filter((o) => o.id !== option.id))}
                          className="p-2 text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setCustomizationOptions((prev) =>
                              prev.map((o) => (o.id === option.id ? { ...o, isFree: !o.isFree } : o))
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            option.isFree
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-card text-muted-foreground"
                          }`}
                        >
                          Free
                        </button>
                        {!option.isFree && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">+₹</span>
                            <input
                              type="number"
                              value={option.extraPrice}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setCustomizationOptions((prev) =>
                                  prev.map((o) => (o.id === option.id ? { ...o, extraPrice: val } : o))
                                );
                              }}
                              className="w-20 bg-card rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      setCustomizationOptions((prev) => [
                        ...prev,
                        { id: Date.now().toString(), name: "", extraPrice: 0, isFree: true },
                      ])
                    }
                    className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-secondary/50 transition-colors min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-foreground">Allow custom note</span>
                    <button
                      onClick={() => setAllowCustomNote(!allowCustomNote)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        allowCustomNote ? "bg-secondary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                          allowCustomNote ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </LuxuryCard>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!name || !price || localImages.length === 0 || saving}
              className="w-full luxury-button-primary min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating product...</span>
                </span>
              ) : (
                `Add Product (${localImages.length} image${localImages.length !== 1 ? "s" : ""})`
              )}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AddProductPage;
