import { ChevronRight } from 'lucide-react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: {
    name: string;
    image: string;
    quantity: number;
  }[];
}

interface OrderCardProps {
  order: Order;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  READY_TO_SHIP: { label: 'Ready to Ship', className: 'bg-purple-100 text-purple-700' },
  PICKED_UP: { label: 'Picked Up', className: 'bg-orange-100 text-orange-700' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-orange-100 text-orange-700' },
  SHIPPED: { label: 'Shipped', className: 'bg-orange-100 text-orange-700' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
};

const defaultStatus = { label: 'Processing', className: 'bg-muted text-muted-foreground' };

export const OrderCard = ({ order }: OrderCardProps) => {
  const status = statusConfig[order.status] ?? statusConfig[order.status?.toUpperCase()] ?? defaultStatus;
  const { formatPrice } = useStoreSettings();

  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in space-y-3">
      {/* Header row */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">#{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{order.date}</p>
        </div>
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Item thumbnails */}
      {order.items.length > 0 && (
        <div className="flex gap-2">
          {order.items.slice(0, 2).map((item, index) => (
            <div key={index} className="w-14 h-16 rounded overflow-hidden bg-muted border border-border">
              {item.image && item.image !== '/placeholder.svg' ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground text-center px-1 line-clamp-2">{item.name}</span>
                </div>
              )}
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="w-14 h-16 rounded bg-muted border border-border flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">+{order.items.length - 2}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
        <button className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          View Details
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
