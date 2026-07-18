"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist.store";
import { useCartStore } from "@/lib/stores/cart.store";
import { PRODUCTS, type Product } from "@/lib/mock-data";
import ProductCard from "@/components/product/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const mapLiveProduct = (p: any) => {
  const vName = typeof p.vendor === 'object' ? (p.vendor?.storeName || "DesiCouture") : "DesiCouture";
  const vSlug = typeof p.vendor === 'object' ? (p.vendor?.storeSlug || "desi-couture") : "desi-couture";
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    brand: p.brand || vName,
    category: typeof p.category === 'object' ? (p.category?.name || "Fashion") : "Fashion",
    categorySlug: typeof p.category === 'object' ? (p.category?.slug || "fashion") : "fashion",
    vendor: { id: typeof p.vendor === 'object' ? p.vendor?._id : (p.vendor || ""), name: vName, slug: vSlug, logo: '', banner: '', description: '', rating: 5.0, reviewCount: 0, productCount: 0, location: 'India', tags: [], verified: true },
    vendorId: typeof p.vendor === 'object' ? p.vendor?._id : (p.vendor || ""),
    vendorName: vName,
    vendorSlug: vSlug,
    description: p.description || "",
    longDescription: p.description || "",
    images: p.images || [],
    basePrice: p.basePrice || 0,
    compareAtPrice: p.compareAtPrice,
    rating: p.avgRating ?? 0,
    reviewCount: p.reviewCount || 0,
    soldCount: 0,
    gender: p.gender || "unisex",
    tags: p.tags || [],
    material: p.material || "",
    careInstructions: p.careInstructions || "",
    variants: (p.variants || []).map((v: any) => ({
      size: v.size,
      color: v.color,
      colorHex: v.colorHex || "#9ca3af",
      stock: v.stock || 0,
      price: v.price || p.basePrice,
      sku: v.sku || "",
    })),
    reviews: [],
    isFeatured: p.isFeatured || false,
    isNew: true,
    isBestSeller: false,
  };
};

export default function WishlistClient() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { ids, toggle, clear, setIds } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          liveWished.forEach((lp: any) => {
            if (!merged.some(m => m.id === lp.id)) {
              merged.push(lp);
            }
          });
          setProducts(merged);

          // AUTOMATIC CLEANUP OF DELETED/INVALID DATABASE IDs:
          const returnedDbIds = liveWished.map((p: any) => p.id);
          const validMockIds = localWished.map((p: any) => p.id);
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
  }, [ids, mounted]);

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
            <div key={p.id} className="relative group">
              <ProductCard product={p} />
              {/* Quick remove */}
              <button
                onClick={() => toggle(p.id)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white shadow text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from wishlist"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
