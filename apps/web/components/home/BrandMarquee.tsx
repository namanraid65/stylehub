import Image from "next/image";
import type { Vendor } from "@/lib/mock-data";

export default function BrandMarquee({ vendors }: { vendors: Vendor[] }) {
  // Duplicate for seamless loop
  const doubled = [...vendors, ...vendors];

  return (
    <section className="py-14 bg-white border-y border-[var(--border)] overflow-hidden">
      <p className="text-center text-xs font-body font-medium tracking-[0.2em] uppercase text-[var(--muted)] mb-8">
        Trusted Artisan Vendors
      </p>
      <div className="flex gap-12 animate-marquee whitespace-nowrap">
        {doubled.map((v, i) => (
          <div key={i} className="inline-flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-full bg-[var(--cream-dark)] overflow-hidden relative shrink-0">
              <Image src={v.logo} alt={v.name} fill className="object-cover" />
            </div>
            <span className="font-display text-lg text-[var(--charcoal-mid)] font-medium">{v.name}</span>
            <span className="text-[var(--border)] text-xl mx-2">&bull;</span>
          </div>
        ))}
      </div>
    </section>
  );
}
