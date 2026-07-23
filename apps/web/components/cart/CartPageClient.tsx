"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, X, Store, ChevronRight } from "lucide-react";
import {
  useCartStore, cartTotal, groupByVendor,
  type CartItem,
} from "@/lib/stores/cart.store";
import CouponInput from "./CouponInput";
import { Price } from "@/components/ui/Price";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── Single cart item row ─────────────────────────────────────────────────────
function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQty } = useCartStore();
  const discount = item.compareAtPrice
    ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
    : null;

  return (
    <div className="flex gap-4 py-5 first:pt-0 border-b border-[var(--border)] last:border-0">
      {/* Image */}
      <Link href={`/products/${item.slug}`} className="relative h-28 w-20 shrink-0 rounded-xl overflow-hidden bg-[var(--cream-dark)]">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-body font-medium text-[var(--rose)] uppercase tracking-widest mb-0.5">{item.brand}</p>
        <Link href={`/products/${item.slug}`} className="text-sm font-body font-medium text-[var(--charcoal)] hover:text-[var(--rose)] transition-colors line-clamp-2 leading-snug">
          {item.name}
        </Link>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          <span className="text-xs font-body text-[var(--charcoal-mid)] px-2 py-0.5 bg-[var(--cream-dark)] rounded-md">Size: {item.size}</span>
          <span className="flex items-center gap-1 text-xs font-body text-[var(--charcoal-mid)] px-2 py-0.5 bg-[var(--cream-dark)] rounded-md">
            <span className="h-3 w-3 rounded-full border border-[var(--border)]" style={{ background: item.colorHex }} />
            {item.color}
          </span>
          {discount && (
            <span className="text-xs font-body text-[var(--rose)] font-semibold">-{discount}% OFF</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <Price amount={item.price} className="text-base font-body font-semibold text-[var(--charcoal)]" />
            {item.compareAtPrice && (
              <Price amount={item.compareAtPrice} className="text-xs font-body text-[var(--muted)] line-through" />
            )}
          </div>

          {/* Qty + delete */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => updateQty(item.sku, item.quantity - 1)}
                className="px-2.5 py-1.5 hover:bg-[var(--cream-dark)] transition-colors text-[var(--charcoal)]"
              ><Minus className="h-3.5 w-3.5" /></button>
              <span className="px-3 py-1.5 text-sm font-body font-medium text-[var(--charcoal)] min-w-[2rem] text-center">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.sku, item.quantity + 1)}
                className="px-2.5 py-1.5 hover:bg-[var(--cream-dark)] transition-colors text-[var(--charcoal)]"
              ><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <button
              onClick={() => removeItem(item.sku)}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
            ><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Summary Panel ──────────────────────────────────────────────────────
function SummaryPanel({ onCheckout }: { onCheckout: () => void }) {
  const { items, coupon, removeCoupon } = useCartStore();
  const { subtotal, discount, tax, delivery, total } = cartTotal(items, coupon);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--border)] shadow-sm sticky top-24 space-y-4">
      <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">Order Summary</h2>

      <div className="space-y-2.5 text-sm font-body">
        <div className="flex justify-between text-[var(--charcoal-mid)]">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Coupon ({coupon!.code})
              <button onClick={removeCoupon} className="text-[var(--muted)] hover:text-red-500 ml-1">
                <X className="h-3 w-3" />
              </button>
            </span>
            <span>-{fmt(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--charcoal-mid)]">
          <span>GST (18%)</span>
          <span>{fmt(tax)}</span>
        </div>
        <div className="flex justify-between text-[var(--charcoal-mid)]">
          <span>Delivery</span>
          <span className={delivery === 0 ? "text-emerald-600 font-medium" : ""}>
            {delivery === 0 ? "FREE" : fmt(delivery)}
          </span>
        </div>
        {delivery === 0 && (
          <p className="text-[10px] text-emerald-600 font-body">🎉 You've unlocked free delivery!</p>
        )}
        {delivery > 0 && subtotal < 1999 && (
          <p className="text-[10px] text-[var(--muted)] font-body">
            Add {fmt(1999 - subtotal)} more to get free delivery
          </p>
        )}
        <div className="h-px bg-[var(--border)]" />
        <div className="flex justify-between font-semibold text-base text-[var(--charcoal)]">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
        {discount > 0 && (
          <p className="text-xs text-emerald-600 font-body font-medium text-center">
            You save {fmt(discount)} on this order! 🎉
          </p>
        )}
      </div>

      {/* Coupon input */}
      <CouponInput />

      <button
        onClick={onCheckout}
        className="w-full py-3.5 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] transition-colors flex items-center justify-center gap-2 group"
      >
        Proceed to Checkout
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Trust row */}
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-body text-[var(--muted)]">
        {["🔒 Secure", "🚚 Fast Delivery", "↩ Easy Returns"].map((t) => (
          <div key={t} className="bg-[var(--cream)] rounded-lg py-2">{t}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Main CartPageClient ──────────────────────────────────────────────────────
export default function CartPageClient() {
  const [mounted, setMounted] = useState(false);
  const { items } = useCartStore();
  const groups = groupByVendor(items);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-24 w-24 rounded-full bg-[var(--cream-dark)] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-[var(--muted)]" />
          </div>
          <h1 className="font-display text-3xl font-medium text-[var(--charcoal)] mb-3">Your bag is empty</h1>
          <p className="text-sm font-body text-[var(--muted)] mb-8">
            Looks like you haven't added anything yet. Explore our curated collections to find something you'll love.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--charcoal)] text-white text-sm font-body font-medium hover:bg-[var(--rose)] transition-colors"
          >
            Explore Collections <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Header bar */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-[var(--rose)]" />
            <h1 className="font-display text-2xl md:text-3xl font-medium text-[var(--charcoal)]">
              My Bag
            </h1>
            <span className="text-sm font-body text-[var(--muted)]">
              ({items.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Items grouped by vendor */}
          <div className="lg:col-span-2 space-y-4">
            {groups.map((group) => (
              <div key={group.vendorId} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                {/* Vendor header */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--cream)]">
                  <Store className="h-4 w-4 text-[var(--rose)]" />
                  <Link
                    href={`/vendors/${group.vendorSlug}`}
                    className="text-sm font-body font-semibold text-[var(--charcoal)] hover:text-[var(--rose)] transition-colors flex items-center gap-1"
                  >
                    {group.vendorName}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="ml-auto text-xs font-body text-[var(--muted)]">
                    {group.items.length} item{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                {/* Items */}
                <div className="px-5">
                  {group.items.map((item) => (
                    <CartItemRow key={item.sku} item={item} />
                  ))}
                </div>
                {/* Vendor subtotal */}
                <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--cream)] flex justify-between text-sm font-body">
                  <span className="text-[var(--muted)]">Vendor subtotal</span>
                  <span className="font-medium text-[var(--charcoal)]">
                    {fmt(group.items.reduce((s, i) => s + i.price * i.quantity, 0))}
                    {group.delivery === 0 ? (
                      <span className="text-emerald-600 ml-2 text-xs">+ FREE delivery</span>
                    ) : (
                      <span className="text-[var(--muted)] ml-2 text-xs">+ ₹99 delivery</span>
                    )}
                  </span>
                </div>
              </div>
            ))}

            {/* Continue shopping link */}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors mt-2"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <SummaryPanel onCheckout={() => { window.location.href = "/checkout"; }} />
          </div>
        </div>
      </div>
    </div>
  );
}
