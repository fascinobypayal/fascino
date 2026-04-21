import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Sparkles, Trash2, Eye, EyeOff, Plus, X, Upload, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProductDetail } from "@/hooks/useCatalogProducts";
import { toast } from "@/hooks/use-toast";

interface LocalCustomization {
  id: string;
  name: string;
  extraPrice: number;
  isFree: boolean;
}

const categories = ["Sarees", "Lehengas", "Kurtas", "Accessories", "Bridal"];

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    product,
    images,
    customizations,
    customizationSettings,
    isLoading,
    updateProduct,
    deleteProduct,
    saveCustomizations,
    uploadImage,
    deleteImage,
  } = useProductDetail(id);

  const [activeImage, setActiveImage] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState(categories[0]);
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [allowCustomNote, setAllowCustomNote] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState<LocalCustomization[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Populate form from DB data
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(Number(product.price));
      setStock(product.stock);
      setCategory(product.category || categories[0]);
      setPublished(product.is_published ?? true);
      setFeatured(product.is_featured ?? false);
      setNewArrival(product.is_new ?? false);
      setCustomizationEnabled(product.is_customizable ?? false);
    }
  }, [product]);

  useEffect(() => {
    if (customizations) {
      setCustomizationOptions(
        customizations.map((c) => ({
          id: c.id,
          name: c.name,
          extraPrice: c.price || 0,
          isFree: !c.is_paid,
        }))
      );
    }
  }, [customizations]);

  useEffect(() => {
    if (customizationSettings) {
      setAllowCustomNote(customizationSettings.allow_custom_note ?? false);
    }
  }, [customizationSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        name,
        description: description || null,
        price: Number(price),
        stock: Number(stock),
        category,
        is_published: published,
        is_featured: featured,
        is_new: newArrival,
        is_customizable: customizationEnabled,
      };
      await updateProduct.mutateAsync(updates);

      if (customizationEnabled) {
        await saveCustomizations(
          customizationOptions
            .filter((o) => o.name.trim())
            .map((o) => ({
              name: o.name,
              is_paid: !o.isFree,
              price: o.isFree ? 0 : o.extraPrice,
            })),
          allowCustomNote
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteProduct.mutateAsync();
    navigate("/catalog");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadImage(file);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      await deleteImage(imageId, imageUrl);
    } catch (err: any) {
      toast({ title: "Error removing image", description: err.message, variant: "destructive" });
    }
  };

  const addCustomizationOption = () => {
    setCustomizationOptions([
      ...customizationOptions,
      { id: Date.now().toString(), name: "", extraPrice: 0, isFree: true },
    ]);
  };

  const removeCustomizationOption = (optionId: string) => {
    setCustomizationOptions(customizationOptions.filter((o) => o.id !== optionId));
  };

  const updateCustomizationOption = (optionId: string, field: keyof LocalCustomization, value: string | number | boolean) => {
    setCustomizationOptions(
      customizationOptions.map((o) => (o.id === optionId ? { ...o, [field]: value } : o))
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Product not found</p>
        <button onClick={() => navigate("/catalog")} className="luxury-button-primary px-6 py-2">
          Back to Catalog
        </button>
      </div>
    );
  }

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
          <h1 className="text-lg font-serif text-foreground">Product Details</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-28 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Image Carousel */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[activeImage]?.image_url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No images
                </div>
              )}
            </div>
            {/* Image Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
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
                Images ({images.length})
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteImage(img.id, img.image_url)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/80 text-background flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-secondary/50 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-[9px]">Upload</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </LuxuryCard>

            {/* Basic Info */}
            <LuxuryCard>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="luxury-input mt-2"
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="luxury-input mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      className="luxury-input mt-2"
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
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </LuxuryCard>

            {/* Status & Flags */}
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
                          onChange={(e) => updateCustomizationOption(option.id, "name", e.target.value)}
                          placeholder="Option name"
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <button
                          onClick={() => removeCustomizationOption(option.id)}
                          className="p-2 text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCustomizationOption(option.id, "isFree", !option.isFree)}
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
                              onChange={(e) => updateCustomizationOption(option.id, "extraPrice", parseInt(e.target.value) || 0)}
                              className="w-20 bg-card rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addCustomizationOption}
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

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !name || !price}
                className="w-full luxury-button-primary min-h-[48px] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Changes"}
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full luxury-button bg-destructive/10 text-destructive min-h-[48px] flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Product
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete "{name}" from your catalog.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground min-h-[44px]">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ProductDetailPage;
