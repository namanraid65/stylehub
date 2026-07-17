import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId:      string;
  slug:           string;
  name:           string;
  image:          string;
  brand:          string;
  vendorId:       string;
  vendorName:     string;
  vendorSlug:     string;
  price:          number;
  compareAtPrice?: number;
  size:           string;
  color:          string;
  colorHex:       string;
  sku:            string;
  quantity:       number;
}

export interface AppliedCoupon {
  code:        string;
  type:        "percent" | "fixed";
  value:       number;
  maxDiscount?: number;
  description: string;
}

interface CartStore {
  items:   CartItem[];
  coupon:  AppliedCoupon | null;

  addItem:      (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem:   (sku: string) => void;
  updateQty:    (sku: string, qty: number) => void;
  applyCoupon:  (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  clearCart:    () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items:  [],
      coupon: null,

      addItem: (newItem) => {
        const { items } = get();
        const existing  = items.find((i) => i.sku === newItem.sku);
        if (existing) {
          set({
            items: items.map((i) =>
              i.sku === newItem.sku
                ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
                : i,
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, quantity: newItem.quantity ?? 1 }] });
        }
      },

      removeItem: (sku) =>
        set((s) => ({ items: s.items.filter((i) => i.sku !== sku) })),

      updateQty: (sku, qty) => {
        if (qty < 1) { get().removeItem(sku); return; }
        set((s) => ({
          items: s.items.map((i) => (i.sku === sku ? { ...i, quantity: qty } : i)),
        }));
      },

      applyCoupon:  (coupon) => set({ coupon }),
      removeCoupon: ()       => set({ coupon: null }),
      clearCart:    ()       => set({ items: [], coupon: null }),
    }),
    { name: "stylehub-cart" },
  ),
);

// ─── Pure compute helpers (call from any component) ──────────────────────────
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.price * i.quantity, 0);

export const cartDiscount = (subtotal: number, coupon: AppliedCoupon | null): number => {
  if (!coupon) return 0;
  let d = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return Math.round(d);
};

export const cartTax = (subtotal: number, discount: number): number =>
  Math.round((subtotal - discount) * 0.18);

export const cartDelivery = (items: CartItem[], subtotal: number): number => {
  if (subtotal >= 1999) return 0;
  return new Set(items.map((i) => i.vendorId)).size * 99;
};

export const cartTotal = (
  items:   CartItem[],
  coupon:  AppliedCoupon | null,
): { subtotal: number; discount: number; tax: number; delivery: number; total: number } => {
  const subtotal = cartSubtotal(items);
  const discount = cartDiscount(subtotal, coupon);
  const tax      = cartTax(subtotal, discount);
  const delivery = cartDelivery(items, subtotal);
  return { subtotal, discount, tax, delivery, total: subtotal - discount + tax + delivery };
};

// ─── Group cart by vendor (for multi-vendor splitting) ───────────────────────
export interface VendorGroup {
  vendorId:   string;
  vendorName: string;
  vendorSlug: string;
  items:      CartItem[];
  subtotal:   number;
  delivery:   number;
}

export const groupByVendor = (items: CartItem[]): VendorGroup[] => {
  const map = new Map<string, VendorGroup>();
  for (const item of items) {
    if (!map.has(item.vendorId)) {
      map.set(item.vendorId, {
        vendorId:   item.vendorId,
        vendorName: item.vendorName,
        vendorSlug: item.vendorSlug,
        items:      [],
        subtotal:   0,
        delivery:   0,
      });
    }
    const g = map.get(item.vendorId)!;
    g.items.push(item);
    g.subtotal += item.price * item.quantity;
  }
  // assign delivery per vendor
  const totalSubtotal = [...map.values()].reduce((s, g) => s + g.subtotal, 0);
  for (const g of map.values()) {
    g.delivery = totalSubtotal >= 1999 ? 0 : 99;
  }
  return [...map.values()];
};
