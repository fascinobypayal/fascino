interface SizeSelectorProps {
  sizes: { label: string; stock: number }[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

export const SizeSelector = ({ sizes, selectedSize, onSelectSize }: SizeSelectorProps) => {
  const availableSizes = sizes.filter((s) => s.stock > 0);

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Select Size
      </p>
      <div className="flex flex-wrap gap-2">
        {availableSizes.map((size) => (
          <button
            key={size.label}
            onClick={() => onSelectSize(size.label)}
            className={`min-w-[48px] px-4 py-2.5 text-sm border transition-all duration-200 ${
              selectedSize === size.label
                ? 'border-accent text-accent bg-accent/5'
                : 'border-border text-foreground hover:border-foreground/50'
            }`}
          >
            {size.label}
          </button>
        ))}
        {availableSizes.length === 0 && (
          <p className="text-sm text-muted-foreground">No sizes available</p>
        )}
      </div>
      {sizes.some((s) => s.stock === 0) && availableSizes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {sizes.filter((s) => s.stock === 0).map((s) => s.label).join(', ')} currently unavailable
        </p>
      )}
    </div>
  );
};

export default SizeSelector;