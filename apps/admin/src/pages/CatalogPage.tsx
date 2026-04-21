import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, Sparkles, MoreVertical, Eye, EyeOff, Settings2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useCatalogCollections } from "@/hooks/useCatalogCollections";

// Product Card Component
const ProductCard = ({ 
  product, 
  index,
  onClick
}: { 
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    is_featured: boolean | null;
    is_new: boolean | null;
    is_customizable: boolean | null;
    image?: string;
  }; 
  index: number;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <LuxuryCard className="p-0 overflow-hidden" onClick={onClick}>
        <div className="flex gap-3 p-3">
          {/* Product Image */}
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm leading-tight truncate">
                  {product.name}
                </h3>
                <p className="font-serif text-foreground mt-1">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>
              <button className="p-1.5 -mr-1 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {product.is_featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-[10px] text-muted-foreground">
                  <Star className="w-2.5 h-2.5" />
                  Featured
                </span>
              )}
              {product.is_new && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-[10px] text-muted-foreground">
                  <Sparkles className="w-2.5 h-2.5" />
                  New
                </span>
              )}
              {product.is_customizable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-[10px] text-muted-foreground">
                  <Settings2 className="w-2.5 h-2.5" />
                  Customizable
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {product.stock} in stock
              </span>
            </div>
          </div>
        </div>
      </LuxuryCard>
    </motion.div>
  );
};

// Collection Card Component
const CollectionCard = ({ 
  collection, 
  index,
  onClick
}: { 
  collection: {
    id: string;
    name: string;
    description: string | null;
    show_on_home: boolean | null;
    image_url: string | null;
  }; 
  index: number;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <LuxuryCard className="p-0 overflow-hidden cursor-pointer" onClick={onClick}>
        {/* Collection Image */}
        <div className="aspect-[2.5/1] overflow-hidden bg-muted">
          {collection.image_url ? (
            <img
              src={collection.image_url}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        {/* Collection Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-base text-foreground">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {collection.description}
                </p>
              )}
            </div>
            <div
              className={`p-2.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                collection.show_on_home 
                  ? "bg-secondary/10 text-secondary" 
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {collection.show_on_home ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </LuxuryCard>
    </motion.div>
  );
};

// Main Catalog Page
const CatalogPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"products" | "collections">("products");
  const [searchQuery, setSearchQuery] = useState("");

  const { products, isLoading: loadingProducts } = useCatalogProducts();
  const { collections, isLoading: loadingCollections } = useCatalogCollections();

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Catalog" subtitle={`${products.length} products, ${collections.length} collections`}>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => { setActiveTab("products"); setSearchQuery(""); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeTab === "products"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => { setActiveTab("collections"); setSearchQuery(""); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeTab === "collections"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Collections
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "products" ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Search */}
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="luxury-input"
              />

              {loadingProducts ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Product List */}
                  <div className="space-y-3">
                    {filteredProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        onClick={() => navigate(`/catalog/product/${product.id}`)}
                      />
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">No products found</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collections"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Search */}
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="luxury-input"
              />

              {loadingCollections ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {filteredCollections.map((collection, index) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        index={index}
                        onClick={() => navigate(`/catalog/collection/${collection.id}`)}
                      />
                    ))}
                  </div>

                  {filteredCollections.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">No collections found</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB for Add */}
        <motion.button
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-luxury-lg z-40"
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
          onClick={() => navigate(activeTab === "products" ? "/catalog/product/new" : "/catalog/collection/new")}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </AdminLayout>
  );
};

export default CatalogPage;
