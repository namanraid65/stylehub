"use client";
import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist.store";
import { useCartStore } from "@/lib/stores/cart.store";
import { PRODUCTS, type Product } from "@/lib/mock-data";
import ProductCard from "@/components/product/ProductCard";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const mapLiveProduct = (p: Record<string, unknown>): Product => {
  const vendorObj = typeof p.vendor === 'object' && p.vendor !== null ? p.vendor as Record<string, unknown> : {};
  const categoryObj = typeof p.category === 'object' && p.category !== null ? p.category as Record<string, unknown> : {};
  const vName = String(vendorObj.storeName || "DesiCouture");
  const vSlug = String(vendorObj.storeSlug || "desi-couture");
  const mappedVendor = {
    id: String(vendorObj._id || p.vendor || ""),
    name: vName,
    slug: vSlug,
    logo: "https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=80&h=80&fit=crop",
    banner: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&h=400&fit=crop",
    description: "",
    rating: 5.0,
    reviewCount: 0,
    productCount: 0,
    location: "India",
    tags: [],
    verified: true,
  };

  return {
    id: String(p._id),
    name: String(p.name),
    slug: String(p.slug),
    brand: String(p.brand || vName),
    category: String(categoryObj.name || "Fashion"),
    categorySlug: String(categoryObj.slug || "fashion"),
    vendor: mappedVendor,
    vendorId: mappedVendor.id,
    vendorName: mappedVendor.name,
    vendorSlug: mappedVendor.slug,
    description: String(p.description || ""),
    longDescription: String(p.description || ""),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    basePrice: Number(p.basePrice || 0),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
    rating: Number(p.avgRating ?? 0),
    reviewCount: Number(p.reviewCount || 0),
    soldCount: 0,
    gender: (p.gender as Product['gender']) || "unisex",
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    material: String(p.material || ""),
    careInstructions: String(p.careInstructions || ""),
    variants: Array.isArray(p.variants)
      ? (p.variants as Record<string, unknown>[]).map((v) => ({
          size: String(v.size),
          color: String(v.color),
          colorHex: String(v.colorHex || "#9ca3af"),
          stock: Number(v.stock || 0),
          price: Number(v.price || p.basePrice),
          sku: String(v.sku || ""),
        }))
      : [],
    reviews: [],
    isFeatured: Boolean(p.isFeatured),
    isNew: true,
    isBestSeller: false,
  };
};

export default function WishlistClient() {
  const mounted = useIsMounted();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { ids, setIds } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!mounted) return;
    const loadWishedProducts = async () => {
      // Load local mock products (any ID that is not a 24-character hex MongoDB ObjectID)
      const mockIds = ids.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
      const localWished = PRODUCTS.filter(p => mockIds.includes(p.id));

      // Load live products
      const dbIds = ids.filter(id => /^[0-9a-fA-F]{24}$/.test(id));

      if (dbIds.length === 0) {
        setProducts(localWished);
        // If we have other stale IDs in store, clean them up
        if (localWished.length < ids.length) {
          setIds(localWished.map(p => p.id));
        }
        return;
      }
      setLoading(true);
      try {
        const url = `${API}/products?ids=${dbIds.join(',')}&limit=50&status=all`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const raw = json.data?.products || json.data || [];
          const liveWished = raw.map(mapLiveProduct);

          // Merge local and live wished products, avoiding duplicates
          const merged = [...localWished];
          liveWished.forEach((lp: Product) => {
            if (!merged.some(m => m.id === lp.id)) {
              merged.push(lp);
            }
          });
          setProducts(merged);

          // AUTOMATIC CLEANUP OF DELETED/INVALID DATABASE IDs:
          const returnedDbIds = liveWished.map((p: Product) => p.id);
          const validMockIds = localWished.map((p: Product) => p.id);
          const allValidIds = [...validMockIds, ...returnedDbIds];

          if (allValidIds.length < ids.length) {
            setIds(allValidIds);
          }
        } else {
          setProducts(localWished);
        }
      } catch (err) {
        console.error("Failed to load wishlist products from API:", err);
        setProducts(localWished);
      } finally {
        setLoading(false);
      }
    };
    loadWishedProducts();
  }, [ids, mounted, setIds]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <p className="text-muted-foreground text-sm font-body">Loading your wishlist...</p>
      </div>
    );
  }

  const wishedProducts = products;

  if (wishedProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-24 w-24 rounded-full bg-[var(--cream-dark)] flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-[var(--muted)]" />
          </div>
          <h1 className="font-display text-3xl font-medium text-[var(--charcoal)] mb-3">Your wishlist is empty</h1>
          <p className="text-sm font-body text-[var(--muted)] mb-8">
            Save your favourite pieces to revisit them later. Tap the heart icon on any product.
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
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
          <Heart className="h-6 w-6 text-[var(--rose)]" />
          <h1 className="font-display text-2xl md:text-3xl font-medium text-[var(--charcoal)]">
            My Wishlist
          </h1>
          <span className="text-sm font-body text-[var(--muted)]">({wishedProducts.length} items)</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* Move all to cart */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => {
              wishedProducts.forEach((p) => {
                const v = p.variants[0];
                if (!v) return;
                addItem({
                  productId: p.id, slug: p.slug, name: p.name,
                  image: p.images[0] ?? "", brand: p.brand,
                  vendorId: p.vendorId, vendorName: p.vendorName, vendorSlug: p.vendorSlug,
                  price: v.price, compareAtPrice: p.compareAtPrice,
                  size: v.size, color: v.color, colorHex: v.colorHex, sku: v.sku,
                  quantity: 1,
                });
              });
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--rose)] text-white text-sm font-body font-semibold hover:bg-[var(--rose-dark)] transition-colors"
          >
            <ShoppingBag className="h-4 w-4" /> Move All to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
