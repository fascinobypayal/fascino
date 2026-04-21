import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Trash2, Plus, X, Upload, Loader2 } from "lucide-react";
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
import { useCollectionDetail, usePublishedProducts } from "@/hooks/useCatalogCollections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CollectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    collection,
    collectionProducts,
    isLoading,
    updateCollection,
    deleteCollection,
    addProductToCollection,
    removeProductFromCollection,
  } = useCollectionDetail(id);

  const { data: publishedProducts = [] } = usePublishedProducts();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showOnHome, setShowOnHome] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
      setImageUrl(collection.image_url || "");
      setShowOnHome(collection.show_on_home ?? false);
    }
  }, [collection]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCollection.mutateAsync({
        name,
        description: description || null,
        image_url: imageUrl || null,
        show_on_home: showOnHome,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteCollection.mutateAsync();
    navigate("/catalog");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `collections/${id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddProduct = async (productId: string) => {
    try {
      await addProductToCollection(productId);
    } catch (err: any) {
      toast({ title: "Error adding product", description: err.message, variant: "destructive" });
    }
    setShowProductPicker(false);
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await removeProductFromCollection(productId);
    } catch (err: any) {
      toast({ title: "Error removing product", description: err.message, variant: "destructive" });
    }
  };

  const availableProducts = publishedProducts.filter(
    (p) => !collectionProducts.find((cp) => cp.id === p.id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Collection not found</p>
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
          <h1 className="text-lg font-serif text-foreground">Collection Details</h1>
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
          {/* Collection Image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[2/1] overflow-hidden relative group bg-muted"
            disabled={uploading}
          >
            {uploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-card text-sm font-medium">Change Image</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Upload className="w-6 h-6" />
                <span className="text-sm">Upload Image</span>
              </div>
            )}
          </button>

          <div className="px-4 space-y-4">
            {/* Basic Info */}
            <LuxuryCard>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Collection Name
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
              </div>
            </LuxuryCard>

            {/* Visibility */}
            <LuxuryCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showOnHome ? (
                    <Eye className="w-4 h-4 text-secondary" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Visible on Home</p>
                    <p className="text-xs text-muted-foreground">Show in homepage collections</p>
                  </div>
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

            {/* Products in Collection */}
            <LuxuryCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Products ({collectionProducts.length})
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
                {collectionProducts.map((product) => (
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
                      onClick={() => handleRemoveProduct(product.id)}
                      className="p-2 text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {collectionProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No products in this collection
                  </p>
                )}
              </div>
            </LuxuryCard>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !name}
                className="w-full luxury-button-primary min-h-[48px] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Changes"}
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full luxury-button bg-destructive/10 text-destructive min-h-[48px] flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Collection
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete "{name}".
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
                    onClick={() => handleAddProduct(product.id)}
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
                  All products are already in this collection
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CollectionDetailPage;
