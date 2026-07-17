import { Suspense } from "react";
import { fetchCmsPage, getActiveBlocks } from "@/lib/cms-data";
import CMSRenderer from "@/components/cms/CMSRenderer";
import BrandMarquee from "@/components/home/BrandMarquee";
import HomeLoading from "./loading";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const revalidate = 60; // Revalidate page every 60 seconds

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

async function getApprovedVendors() {
  try {
    const res = await fetch(`${API}/vendors/public/all`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = json.data || [];
    return raw.map(mapLiveVendor);
  } catch (err) {
    console.error("Failed to load approved vendors for marquee:", err);
    return [];
  }
}

export default async function HomePage() {
  const [page, vendors] = await Promise.all([
    fetchCmsPage('homepage'),
    getApprovedVendors(),
  ]);
  const activeBlocks = page ? getActiveBlocks(page) : [];

  return (
    <Suspense fallback={<HomeLoading />}>
      {activeBlocks.length > 0 ? (
        <div className="flex flex-col w-full">
          <CMSRenderer blocks={activeBlocks} />
          {vendors.length > 0 && <BrandMarquee vendors={vendors} />}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-[var(--cream)]">
          <h2 className="font-display text-2xl font-semibold mb-2">Welcome to StyleHub</h2>
          <p className="text-sm font-body text-[var(--muted)]">Homepage is currently under configuration.</p>
        </div>
      )}
    </Suspense>
  );
}
