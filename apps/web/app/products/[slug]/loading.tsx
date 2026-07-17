import { HeroSkeleton } from '@/components/ui/states';

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery skeleton */}
        <div className="space-y-3">
          <div className="aspect-[3/4] rounded-2xl bg-[var(--cream-dark)] animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 rounded-lg bg-[var(--cream-dark)] animate-pulse" />
            ))}
          </div>
        </div>
        {/* Detail skeleton */}
        <div className="space-y-5 pt-2">
          <div className="h-3 w-24 bg-[var(--cream-dark)] rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-3/4 bg-[var(--cream-dark)] rounded animate-pulse" />
            <div className="h-7 w-1/2 bg-[var(--cream-dark)] rounded animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-[var(--cream-dark)] rounded animate-pulse" />
          <div className="h-8 w-28 bg-[var(--cream-dark)] rounded animate-pulse" />
          {/* Color swatches */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-[var(--cream-dark)] animate-pulse" />
            ))}
          </div>
          {/* Size chips */}
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-12 rounded-lg bg-[var(--cream-dark)] animate-pulse" />
            ))}
          </div>
          {/* Buttons */}
          <div className="h-12 w-full rounded-xl bg-[var(--cream-dark)] animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-[var(--cream-dark)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
