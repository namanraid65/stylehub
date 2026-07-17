"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/mock-data";
import { useCartStore } from "@/lib/stores/cart.store";
import { useWishlistStore } from "@/lib/stores/wishlist.store";


const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ProductCard({ product }: { product: Product }) {
  const { addItem }                       = useCartStore();
  const { toggle: toggleWish, isWished }  = useWishlistStore();
  const wished  = isWished(product.id);
  const [added, setAdded] = useState(false);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
    : null;

  const uniqueColors = [...new Set(product.variants.map((v) => v.colorHex))];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = product.variants[0];
    if (!v) return;
    addItem({
      productId: product.id, slug: product.slug, name: product.name,
      image: product.images[0] ?? "", brand: product.brand,
      vendorId: product.vendorId, vendorName: product.vendorName, vendorSlug: product.vendorSlug,
      price: v.price, compareAtPrice: product.compareAtPrice,
      size: v.size, color: v.color, colorHex: v.colorHex, sku: v.sku,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };


  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--cream-dark)]">
        <Image
          src={product.images[0]!}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-108"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="px-2 py-1 bg-[var(--charcoal)] text-white text-[10px] font-body font-semibold uppercase tracking-wider rounded-md">
              New
            </span>
          )}
          {discount && (
            <span className="px-2 py-1 bg-[var(--rose)] text-white text-[10px] font-body font-semibold uppercase tracking-wider rounded-md">
              -{discount}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-1 bg-[var(--gold)] text-white text-[10px] font-body font-semibold uppercase tracking-wider rounded-md">
              Bestseller
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(product.id); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${
            wished ? "fill-[var(--rose)] text-[var(--rose)]" : "text-[var(--charcoal-mid)]"
          }`} />
        </button>

        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-xl text-xs font-body font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              added
                ? "bg-emerald-500 text-white"
                : "bg-white/95 backdrop-blur-sm text-[var(--charcoal)] hover:bg-[var(--rose)] hover:text-white shadow-lg"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {added ? "Added!" : "Quick Add"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Vendor */}
        <p className="text-[10px] font-body font-medium tracking-widest uppercase text-[var(--muted)] mb-1">
          {product.brand}
        </p>

        {/* Name */}
        <h3 className="font-body text-sm font-medium text-[var(--charcoal)] leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Color swatches */}
        {uniqueColors.length > 1 && (
          <div className="flex gap-1 mb-2.5">
            {uniqueColors.slice(0, 5).map((hex) => (
              <span
                key={hex}
                className="h-3 w-3 rounded-full border border-[var(--border)] shadow-sm"
                style={{ background: hex }}
              />
            ))}
            {uniqueColors.length > 5 && (
              <span className="text-[10px] text-[var(--muted)] font-body">+{uniqueColors.length - 5}</span>
            )}
          </div>
        )}

        {/* Price + Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-body font-semibold text-[var(--charcoal)]">{fmt(product.basePrice)}</span>
            {product.compareAtPrice && (
              <span className="text-xs font-body text-[var(--muted)] line-through">{fmt(product.compareAtPrice)}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {product.reviewCount > 0 ? (
              <>
                <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
                <span className="text-xs font-body text-[var(--charcoal-mid)]">{product.rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-[10px] font-body text-[var(--muted)] italic">No ratings yet</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
