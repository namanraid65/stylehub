import { ProductGridSkeleton } from '@/components/ui/states';

// This file enables Next.js Suspense streaming for the products page
export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter + grid skeleton */}
      <div className="flex gap-8">
        {/* Filter sidebar skeleton */}
        <div className="hidden lg:block w-64 shrink-0 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 bg-[var(--cream-dark)] rounded animate-pulse" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3 w-32 bg-[var(--cream-dark)] rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
        {/* Products */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 w-32 bg-[var(--cream-dark)] rounded animate-pulse" />
            <div className="h-8 w-28 bg-[var(--cream-dark)] rounded animate-pulse" />
          </div>
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
}
