import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, ChevronDown, ChevronUp, Image as ImageIcon, Eye, Save, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { LuxuryCard } from "@/components/LuxuryCard";
import { ImageUploadZone } from "@/components/ImageUploadZone";
import { useHomeConfig } from "@/hooks/useHomeConfig";
import { useHomeSections } from "@/hooks/useHomeSections";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Accordion Section ---
interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection = ({ title, icon, isOpen, onToggle, children }: AccordionSectionProps) => (
  <LuxuryCard className="p-0 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 min-h-[56px]"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          {icon}
        </div>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 pt-0 border-t border-border">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </LuxuryCard>
);

// --- Toggle Row ---
interface ToggleRowProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  description?: string;
  onLabelClick?: () => void;
}

const ToggleRow = ({ label, enabled, onToggle, description, onLabelClick }: ToggleRowProps) => (
  <div className="flex items-center justify-between py-3 min-h-[48px]">
    <div onClick={onLabelClick} role={onLabelClick ? "button" : undefined} className={`flex-1 min-w-0 pr-3 ${onLabelClick ? "cursor-pointer" : ""}`}>
      <span className="text-sm text-foreground">{label}</span>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        enabled ? "bg-secondary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  </div>
);

const HomePage = () => {
  const {
    config,
    loading,
    saving,
    uploading,
    error,
    products: productOptions,
    collections: collectionOptions,
    uploadHeroImage,
    updateField,
    saveConfig,
  } = useHomeConfig();

  const {
    collections: homeCollections,
    featuredProducts,
    loadingCollections,
    loadingProducts,
    toggleCollectionHome,
    toggleProductHome,
  } = useHomeSections();

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    collections: false,
    featured: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadHeroImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <AdminLayout title="Home" subtitle="Manage your storefront">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Home" subtitle="Manage your storefront">
        <LuxuryCard className="p-6 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-secondary underline"
          >
            Retry
          </button>
        </LuxuryCard>
      </AdminLayout>
    );
  }

  const linkOptions = config?.hero_link_type === "product" ? productOptions : collectionOptions;

  return (
    <AdminLayout title="Home" subtitle="Manage your storefront">
      <div className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Hero Banner Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AccordionSection
            title="Hero Banner"
            icon={<ImageIcon className="w-4 h-4 text-secondary" />}
            isOpen={openSections.hero}
            onToggle={() => toggleSection("hero")}
          >
            <div className="pt-4 space-y-4">
              <div className="relative">
                <ImageUploadZone
                  currentImage={config?.hero_image_url || ""}
                  onUpload={() => fileInputRef.current?.click()}
                  label="Hero Image"
                  aspectRatio="landscape"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-background/60 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Call to Action
                </label>
                <input
                  type="text"
                  value={config?.hero_cta_text || ""}
                  onChange={(e) => updateField("hero_cta_text", e.target.value)}
                  className="luxury-input mt-2"
                  placeholder="Shop Now"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Hero Link Type
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {([
                    { value: "collection", label: "Collection" },
                    { value: "product", label: "Product" },
                    { value: "best_seller", label: "Best Seller" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateField("hero_link_type", opt.value)}
                      className={`flex-1 min-w-[90px] py-2.5 px-4 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        config?.hero_link_type === opt.value
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {config?.hero_link_type === "best_seller" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    The CTA will open the Best Sellers page (all products marked “Best Seller”).
                  </p>
                )}
              </div>

              {config?.hero_link_type && config.hero_link_type !== "best_seller" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Select {config.hero_link_type}
                  </label>
                  <Select
                    value={config.hero_link_id || ""}
                    onValueChange={(val) => updateField("hero_link_id", val)}
                  >
                    <SelectTrigger className="mt-2 rounded-xl min-h-[44px]">
                      <SelectValue placeholder={`Choose a ${config.hero_link_type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {linkOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <button
                onClick={saveConfig}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium min-h-[48px] disabled:opacity-50 transition-opacity"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </AccordionSection>
        </motion.div>

        {/* Home Collections Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AccordionSection
            title="Home Collections"
            icon={<Eye className="w-4 h-4 text-secondary" />}
            isOpen={openSections.collections}
            onToggle={() => toggleSection("collections")}
          >
            <div className="pt-2 divide-y divide-border">
              {loadingCollections ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              ) : homeCollections.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No collections found</p>
              ) : (
                homeCollections.map((collection) => (
                  <ToggleRow
                    key={collection.id}
                    label={collection.name}
                    enabled={collection.show_on_home}
                    onToggle={() => toggleCollectionHome(collection.id)}
                    onLabelClick={() => navigate(`/catalog/collection/${collection.id}`)}
                  />
                ))
              )}
            </div>
          </AccordionSection>
        </motion.div>

        {/* Featured Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AccordionSection
            title="Featured Products"
            icon={<Sparkles className="w-4 h-4 text-secondary" />}
            isOpen={openSections.featured}
            onToggle={() => toggleSection("featured")}
          >
            <div className="pt-2 divide-y divide-border">
              {loadingProducts ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              ) : featuredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No featured products</p>
              ) : (
                featuredProducts.map((product) => (
                  <ToggleRow
                    key={product.id}
                    label={product.name}
                    enabled={product.show_on_home}
                    onToggle={() => toggleProductHome(product.id)}
                    onLabelClick={() => navigate(`/catalog/product/${product.id}`)}
                    description={product.show_on_home ? "Showing on home" : "Hidden from home"}
                  />
                ))
              )}
            </div>
          </AccordionSection>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default HomePage;
