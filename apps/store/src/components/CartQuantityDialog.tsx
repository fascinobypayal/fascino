import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CartQuantityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSameCustomization: () => void;
  onDifferentCustomization: () => void;
  onNoCustomization: () => void;
}

const CartQuantityDialog = ({
  isOpen,
  onClose,
  onSameCustomization,
  onDifferentCustomization,
  onNoCustomization,
}: CartQuantityDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] rounded-xl p-6 gap-5">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="font-serif text-lg text-center">
            Add another item
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            How would you like to add this product?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onSameCustomization}
            className="w-full py-3 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            Repeat Same Customization
          </button>
          <button
            onClick={onDifferentCustomization}
            className="w-full py-3 text-sm font-medium border border-border rounded-lg hover:border-foreground/30 transition-colors"
          >
            Choose Different Customization
          </button>
          <button
            onClick={onNoCustomization}
            className="w-full py-3 text-sm font-medium border border-border rounded-lg hover:border-foreground/30 transition-colors"
          >
            Add Without Customization
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartQuantityDialog;
