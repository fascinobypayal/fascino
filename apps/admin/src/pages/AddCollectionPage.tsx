import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Plus, X, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { useCreateCollection, usePublishedProducts } from "@/hooks/useCatalogCollections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AddCollectionPage = () => {
  const navigate = useNavigate();
  const { setVisible } = useBottomNav();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createCollection = useCreateCollection();
  const { data: publishedProducts = [] } = usePublishedProducts();

  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showOnHome, setShowOnHome] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Hide bottom nav when product picker modal is open
  useEffect(() => {
    setVisible(!showProductPicker);
  }, [showProductPicker, setVisible]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `collections/new/${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImage(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addProduct = (productId: string) => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
    setShowProductPicker(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
  };

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const collection = await createCollection.mutateAsync({
        name,
        description,
        image_url: image,
        show_on_home: showOnHome,
        productIds: selectedProductIds,
      });
      toast({ title: "Collection created" });
      navigate(`/catalog/collection/${collection.id}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedProducts = publishedProducts.filter((p) => selectedProductIds.includes(p.id));
  const availableProducts = publishedProducts.filter(
    (p) => !selectedProductIds.includes(p.id)
  );

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
          <h1 className="text-lg font-serif text-foreground">New Collection</h1>
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
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Collection Image */}
          <LuxuryCard>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Collection Image
            </h3>
            {image ? (
              <div className="relative aspect-[2/1] rounded-xl overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImage("")}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/80 text-background flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-[2/1] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-secondary/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Upload Image</span>
                  </>
                )}
              </button>
            )}
          </LuxuryCard>

          {/* Basic Info */}
          <LuxuryCard>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="luxury-input mt-2"
                  placeholder="e.g. Summer Elegance"
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
                  placeholder="Describe this collection..."
                />
              </div>
            </div>
          </LuxuryCard>

          {/* Show on Home Toggle */}
          <LuxuryCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Show on Homepage</p>
                <p className="text-xs text-muted-foreground mt-0.5">Visible in homepage collections</p>
              </div>
              <button
                onClick={() => setShowOnHome(!showOnHome)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  showOnHome ? "bg-secondary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                    showOnHome ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </LuxuryCard>

          {/* Products */}
          <LuxuryCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Products ({selectedProducts.length})
              </h3>
              <button
                onClick={() => setShowProductPicker(true)}
                className="text-secondary text-sm font-medium min-h-[44px] flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-xl"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[8px]">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="p-2 text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {selectedProducts.length === 0 && (
                <button
                  onClick={() => setShowProductPicker(true)}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 hover:border-secondary/50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add products to collection
                </button>
              )}
            </div>
          </LuxuryCard>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!name || saving}
            className="w-full luxury-button-primary min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Collection"}
          </button>
        </motion.div>
      </main>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <motion.div
          className="fixed inset-0 z-50 bg-foreground/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowProductPicker(false)}
        >
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[70vh] overflow-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-3 border-b border-border">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
              <h2 className="font-serif text-lg text-foreground">Add Products</h2>
            </div>

            <div className="p-4 space-y-2">
              {availableProducts.length > 0 ? (
                availableProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product.id)}
                    className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors min-h-[56px]"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[8px]">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</p>
                    </div>
                    <Plus className="w-5 h-5 text-secondary flex-shrink-0" />
                  </button>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {publishedProducts.length === 0
                    ? "No published products available"
                    : "All products are already in this collection"}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AddCollectionPage;
