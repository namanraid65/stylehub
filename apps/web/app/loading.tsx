import { HeroSkeleton, SectionSkeleton } from '@/components/ui/states';

// Streaming loading UI for the homepage
export default function HomeLoading() {
  return (
    <div>
      <HeroSkeleton />
      {/* Trust strip */}
      <div className="bg-[var(--charcoal)] h-12 animate-pulse" />
      <SectionSkeleton count={8} />
      {/* CTA block */}
      <div className="h-40 bg-[var(--cream-dark)] animate-pulse mx-4 rounded-2xl my-8" />
      <SectionSkeleton count={8} />
    </div>
  );
}
