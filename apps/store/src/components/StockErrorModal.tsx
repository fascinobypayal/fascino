import { RefreshCw, Trash2, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface StockErrorItem {
  cart_item_id: string;
  product_id: string;
  product_name: string;
  available_stock: number;
  requested_quantity: number;
}

interface StockErrorModalProps {
  isOpen: boolean;
  items: StockErrorItem[];
  onClose: () => void;
  onRemoveItem: (cartItemId: string) => Promise<void>;
  onAdjustQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  onRefreshCart: () => Promise<void>;
}

const StockErrorModal = ({
  isOpen,
  items,
  onClose,
  onRemoveItem,
  onAdjustQuantity,
  onRefreshCart,
}: StockErrorModalProps) => {
  const handleRefresh = async () => {
    await onRefreshCart();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-none sm:rounded-none p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold leading-tight">
            Some items are no longer available
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Please update your cart before proceeding.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {items.map((item) => {
            const isOutOfStock = item.available_stock === 0;
            return (
              <div
                key={item.cart_item_id}
                className="pb-4 border-b border-border last:border-0 last:pb-0"
              >
                <p className="text-sm font-semibold mb-1">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  In your cart: {item.requested_quantity}
                </p>

                {isOutOfStock ? (
                  <>
                    <p className="text-xs text-destructive mt-0.5 mb-2">
                      This item is out of stock
                    </p>
                    <button
                      onClick={() => onRemoveItem(item.cart_item_id)}
                      className="flex items-center gap-1.5 text-xs text-destructive border border-destructive/30 px-2.5 py-1.5 hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove from cart
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-destructive mt-0.5 mb-2">
                      Only {item.available_stock} available — reduce quantity or remove
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAdjustQuantity(item.cart_item_id, item.available_stock)}
                        className="flex items-center gap-1.5 text-xs text-foreground border border-border px-2.5 py-1.5 hover:border-foreground/50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                        Set to {item.available_stock}
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.cart_item_id)}
                        className="flex items-center gap-1.5 text-xs text-destructive border border-destructive/30 px-2.5 py-1.5 hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Cart
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockErrorModal;
