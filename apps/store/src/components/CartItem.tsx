import { Minus, Plus, X } from 'lucide-react';

export interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onIncrease?: (id: string) => void;
  onRemove: (id: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onIncrease, onRemove }: CartItemProps) => {
  return (
    <div className="flex gap-4 py-4 border-b border-border animate-fade-in">
      <div className="w-24 h-32 bg-primary overflow-hidden flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm text-foreground pr-2">{item.name}</h3>
            <button
              onClick={() => onRemove(item.id)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove item"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Size: {item.size}</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="p-1 border border-border hover:border-foreground/50 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
            <button
              onClick={() => onIncrease ? onIncrease(item.id) : onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-1 border border-border hover:border-foreground/50 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <p className="text-sm font-medium">
            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
