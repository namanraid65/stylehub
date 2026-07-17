import { notFound } from "next/navigation";
import { getVendorBySlug, getProductsByVendor } from "@/lib/mock-data";
import VendorStorefrontClient from "@/components/vendor/VendorStorefrontClient";
import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface Props { params: Promise<{ slug: string }>; }

const mapLiveVendor = (v: any) => ({
  id: v._id,
  name: v.storeName,
  slug: v.storeSlug,
  logo: v.storeLogo || "https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=80&h=80&fit=crop",
  banner: v.storeBanner || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&h=400&fit=crop",
  description: v.storeDescription || "",
  rating: v.storeRating || 5.0,
  reviewCount: v.totalReviews || 0,
  productCount: v.productCount || 0,
  location: v.storeLocation || "India",
  tags: v.storeTags || [],
  verified: v.status === 'approved',
});

const mapLiveProduct = (p: any, mappedVendor: any) => ({
  id: p._id,
  name: p.name,
  slug: p.slug,
  brand: p.brand || mappedVendor.name,
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
});

async function getVendorData(slug: string) {
  try {
    const res = await fetch(`${API}/vendors/public/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    
    const mappedVendor = mapLiveVendor(json.data);
    
    const prodRes = await fetch(`${API}/products?vendor=${mappedVendor.id}&limit=50`, { cache: 'no-store' });
    let mappedProducts: any[] = [];
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      const rawProducts = prodJson.data?.products || prodJson.data || [];
      mappedProducts = rawProducts.map((p: any) => mapLiveProduct(p, mappedVendor));
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
