import { Suspense } from "react";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import ProductListingClient from "@/components/product/ProductListingClient";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const mapLiveProduct = (p: any) => {
  const vName = typeof p.vendor === 'object' ? (p.vendor?.storeName || "DesiCouture") : "DesiCouture";
  const vSlug = typeof p.vendor === 'object' ? (p.vendor?.storeSlug || "desi-couture") : "desi-couture";
  const mappedVendor = {
    id: typeof p.vendor === 'object' ? p.vendor?._id : (p.vendor || ""),
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
    id: p._id,
    name: p.name,
    slug: p.slug,
    brand: p.brand || vName,
    category: typeof p.category === 'object' ? (p.category?.name || "Fashion") : "Fashion",
    categorySlug: typeof p.category === 'object' ? (p.category?.slug || "fashion") : "fashion",
    vendor: mappedVendor,
    vendorId: mappedVendor.id,
    vendorName: mappedVendor.name,
    vendorSlug: mappedVendor.slug,
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

async function getLiveProducts() {
  try {
    const res = await fetch(`${API}/products?limit=50`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data?.products || json.data || [];
    return raw.map(mapLiveProduct);
  } catch (err) {
    console.error("Failed to load products from API:", err);
    return null;
  }
}

async function getLiveCategories() {
  try {
    const res = await fetch(`${API}/categories`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const raw: any[] = json.data || json.categories || [];
    if (!raw.length) return null;
    return raw.map((c: any) => ({
      id:           c._id,
      name:         c.name,
      slug:         c.slug,
      image:        c.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=600&fit=crop',
      gradient:     'from-black/60 to-black/10',
      productCount: c.productCount ?? 0,
    }));
  } catch (err) {
    console.error('Failed to load categories from API:', err);
    return null;
  }
}

export default async function ProductsPage() {
  const [liveProducts, liveCategories] = await Promise.all([
    getLiveProducts(),
    getLiveCategories(),
  ]);

  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-muted-foreground">
        Loading styles...
      </div>
    }>
      <ProductListingClient
        initialProducts={liveProducts ?? PRODUCTS}
        categories={liveCategories ?? CATEGORIES}
      />
    </Suspense>
  );
}
