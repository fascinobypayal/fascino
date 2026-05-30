import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, Sparkles, MoreVertical, Eye, EyeOff, Settings2, ChevronDown, ChevronUp, Loader2, Tag, Pencil, Trash2, Check, X } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useCatalogCollections } from "@/hooks/useCatalogCollections";
import { useCategories } from "@/hooks/useCategories";

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
                  Best Seller
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

// Category Row Component
const CategoryRow = ({
  category,
  index,
  onRename,
  onDelete,
}: {
  category: { id: string; name: string };
  index: number;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);

  const commitRename = () => {
    if (draft.trim() && draft.trim() !== category.name) {
      onRename(category.id, draft.trim());
    }
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <LuxuryCard className="p-0">
        <div className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
          <Tag className="w-4 h-4 text-secondary flex-shrink-0" />
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setDraft(category.name); setEditing(false); }
              }}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-secondary pb-0.5"
            />
          ) : (
            <span className="flex-1 text-sm text-foreground font-medium">{category.name}</span>
          )}
          <div className="flex items-center gap-1">
            {editing ? (
              <>
                <button
                  onClick={commitRename}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setDraft(category.name); setEditing(false); }}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setDraft(category.name); setEditing(true); }}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(category.id)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-destructive/70"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </LuxuryCard>
    </motion.div>
  );
};

// Main Catalog Page
const CatalogPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"products" | "collections" | "categories">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const { products, isLoading: loadingProducts } = useCatalogProducts();
  const { collections, isLoading: loadingCollections } = useCatalogCollections();
  const { categories, isLoading: loadingCategories, addCategory, renameCategory, deleteCategory } = useCategories();

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Catalog" subtitle={`${products.length} products · ${collections.length} collections · ${categories.length} categories`}>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => { setActiveTab("products"); setSearchQuery(""); }}
            className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeTab === "products"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => { setActiveTab("collections"); setSearchQuery(""); }}
            className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeTab === "collections"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => { setActiveTab("categories"); setSearchQuery(""); }}
            className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeTab === "categories"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Categories
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
          ) : activeTab === "collections" ? (
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
          ) : activeTab === "categories" ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 pb-4"
            >
              {/* Add new category inline */}
              <AnimatePresence>
                {addingCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LuxuryCard>
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-secondary flex-shrink-0" />
                        <input
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newCategoryName.trim()) {
                              addCategory.mutate(newCategoryName.trim());
                              setNewCategoryName("");
                              setAddingCategory(false);
                            }
                            if (e.key === "Escape") {
                              setNewCategoryName("");
                              setAddingCategory(false);
                            }
                          }}
                          placeholder="Category name..."
                          className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-secondary pb-0.5"
                        />
                        <button
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              addCategory.mutate(newCategoryName.trim());
                              setNewCategoryName("");
                              setAddingCategory(false);
                            }
                          }}
                          disabled={!newCategoryName.trim() || addCategory.isPending}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary disabled:opacity-40"
                        >
                          {addCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setNewCategoryName(""); setAddingCategory(false); }}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </LuxuryCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {loadingCategories ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {categories.map((cat, index) => (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      index={index}
                      onRename={(id, name) => renameCategory.mutate({ id, name })}
                      onDelete={(id) => deleteCategory.mutate(id)}
                    />
                  ))}
                  {categories.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground text-sm">No categories yet</p>
                      <p className="text-muted-foreground text-xs mt-1">Tap + to add the first one</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* FAB for Add */}
        <motion.button
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-luxury-lg z-40"
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
          onClick={() => {
            if (activeTab === "products") navigate("/catalog/product/new");
            else if (activeTab === "collections") navigate("/catalog/collection/new");
            else { setAddingCategory(true); }
          }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </AdminLayout>
  );
};

export default CatalogPage;
