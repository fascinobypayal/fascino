export interface LocalCartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  base_price: number;
  customization_signature: string;
  customizations: { id: string; name: string; price: number }[];
  note?: string;
}

export interface LocalCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  allow_cod: boolean;
}

const STORAGE_KEY = 'fascino_guest_cart';
const COUPON_KEY = 'fascino_guest_coupon';

export const getLocalCart = (): LocalCartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalCart = (items: LocalCartItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const clearLocalCart = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getLocalCoupon = (): LocalCoupon | null => {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalCoupon = (coupon: LocalCoupon) => {
  localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
};

export const clearLocalCoupon = () => {
  localStorage.removeItem(COUPON_KEY);
};
