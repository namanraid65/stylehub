import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, type Product } from "@/lib/mock-data";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import RelatedProducts from "@/components/product/RelatedProducts";
import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface Props {
  params: Promise<{ slug: string }>;
}

const mapLiveProduct = (p: Record<string, unknown>): Product => {
  const vendorObj = typeof p.vendor === 'object' && p.vendor !== null ? (p.vendor as Record<string, unknown>) : {};
  const categoryObj = typeof p.category === 'object' && p.category !== null ? (p.category as Record<string, unknown>) : {};
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

async function getLiveProduct(slug: string) {
  try {
    const res = await fetch(`${API}/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    
    const product = mapLiveProduct(json.data as Record<string, unknown>);
    
    const categoryId = typeof json.data.category === 'object' && json.data.category !== null ? json.data.category._id : json.data.category;
    const relRes = await fetch(`${API}/products?category=${categoryId}&limit=5`, { cache: 'no-store' });
    let related: Product[] = [];
    if (relRes.ok) {
      const relJson = await relRes.json();
      const raw = (relJson.data?.products || relJson.data || []) as Record<string, unknown>[];
      related = raw
        .filter((item) => String(item._id) !== product.id)
        .slice(0, 4)
        .map(mapLiveProduct);
    }
    
    return { product, related };
  } catch (err) {
    console.error("Failed to load product by slug from API:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const liveData = await getLiveProduct(slug);
  const product = liveData?.product ?? getProductBySlug(slug);
  
  if (!product) return { title: "Product Not Found — StyleHub" };
  return {
    title: `${product.name} — StyleHub`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.images[0]!, width: 700, height: 900 }],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const liveData = await getLiveProduct(slug);
  
  if (liveData) {
    return (
      <>
        <ProductDetailClient product={liveData.product} />
        <RelatedProducts products={liveData.related} />
      </>
    );
  }
  
  const mockProduct = getProductBySlug(slug);
  if (!mockProduct) notFound();

  const mockRelated = getRelatedProducts(mockProduct, 4);

  return (
    <>
      <ProductDetailClient product={mockProduct} />
      <RelatedProducts products={mockRelated} />
    </>
  );
}
