import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/mock-data";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import RelatedProducts from "@/components/product/RelatedProducts";
import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface Props {
  params: Promise<{ slug: string }>;
}

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

async function getLiveProduct(slug: string) {
  try {
    const res = await fetch(`${API}/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    
    const product = mapLiveProduct(json.data);
    
    // Fetch related products
    const relRes = await fetch(`${API}/products?category=${json.data.category?._id || json.data.category}&limit=5`, { cache: 'no-store' });
    let related: any[] = [];
    if (relRes.ok) {
      const relJson = await relRes.json();
      const raw = relJson.data?.products || relJson.data || [];
      related = raw
        .filter((item: any) => item._id !== product.id)
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
