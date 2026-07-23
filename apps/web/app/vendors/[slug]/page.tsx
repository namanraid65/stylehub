import { notFound } from "next/navigation";
import { getVendorBySlug, getProductsByVendor, type Vendor, type Product } from "@/lib/mock-data";
import VendorStorefrontClient from "@/components/vendor/VendorStorefrontClient";
import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface Props { params: Promise<{ slug: string }>; }

const mapLiveVendor = (v: Record<string, unknown>): Vendor => ({
  id: String(v._id),
  name: String(v.storeName),
  slug: String(v.storeSlug),
  logo: String(v.storeLogo || "https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=80&h=80&fit=crop"),
  banner: String(v.storeBanner || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&h=400&fit=crop"),
  description: String(v.storeDescription || ""),
  rating: Number(v.storeRating || 5.0),
  reviewCount: Number(v.totalReviews || 0),
  productCount: Number(v.productCount || 0),
  location: String(v.storeLocation || "India"),
  tags: Array.isArray(v.storeTags) ? (v.storeTags as string[]) : [],
  verified: v.status === 'approved',
});

const mapLiveProduct = (p: Record<string, unknown>, mappedVendor: Vendor): Product => {
  const categoryObj = typeof p.category === 'object' && p.category !== null ? (p.category as Record<string, unknown>) : {};
  return {
    id: String(p._id),
    name: String(p.name),
    slug: String(p.slug),
    brand: String(p.brand || mappedVendor.name),
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

async function getVendorData(slug: string) {
  try {
    const res = await fetch(`${API}/vendors/public/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    
    const mappedVendor = mapLiveVendor(json.data as Record<string, unknown>);
    
    const prodRes = await fetch(`${API}/products?vendor=${mappedVendor.id}&limit=50`, { cache: 'no-store' });
    let mappedProducts: Product[] = [];
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      const rawProducts = (prodJson.data?.products || prodJson.data || []) as Record<string, unknown>[];
      mappedProducts = rawProducts.map((p) => mapLiveProduct(p, mappedVendor));
    }
    
    return { vendor: mappedVendor, products: mappedProducts };
  } catch (err) {
    console.error("Failed to fetch live vendor data:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const liveData = await getVendorData(slug);
  const vendor = liveData?.vendor ?? getVendorBySlug(slug);
  
  if (!vendor) return { title: "Vendor Not Found — StyleHub" };
  return {
    title: `${vendor.name} — StyleHub`,
    description: vendor.description,
    openGraph: {
      title: `${vendor.name} — StyleHub`,
      description: vendor.description,
      images: [{ url: vendor.banner, width: 1200, height: 400 }],
    },
  };
}

export default async function VendorPage({ params }: Props) {
  const { slug } = await params;
  const liveData = await getVendorData(slug);
  
  if (liveData) {
    return <VendorStorefrontClient vendor={liveData.vendor} products={liveData.products} />;
  }
  
  const mockVendor = getVendorBySlug(slug);
  if (!mockVendor) notFound();

  const mockProducts = getProductsByVendor(mockVendor.id);
  return <VendorStorefrontClient vendor={mockVendor} products={mockProducts} />;
}
