import type { Metadata } from "next";
import VendorsListClient from "@/components/vendor/VendorsListClient";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const metadata: Metadata = {
  title: "Artisan Partners — StyleHub",
  description: "Meet the incredible designers, boutiques, and artisans behind the collections at StyleHub.",
};

async function getVendors() {
  try {
    const res = await fetch(`${API}/vendors/public/all`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Failed to load vendors:", err);
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-16">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative h-60 sm:h-72 overflow-hidden bg-[var(--charcoal)] flex items-center justify-center text-center px-6">
        {/* Decorative background image with low opacity */}
        <Image
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400"
          alt="Artisan Partners Banner"
          fill
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[var(--gold)] text-xs font-body tracking-[0.2em] uppercase font-semibold">
            Artisans & Creators
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-light text-white tracking-tight leading-tight">
            Meet the Designers
          </h1>
          <p className="text-white/70 text-xs sm:text-sm font-body max-w-md mx-auto leading-relaxed">
            Discover the creative minds, boutique brands, and local workshops crafting StyleHub's exclusive fashion.
          </p>
        </div>
      </div>

      {/* ── Interactive Vendors List ────────────────────────────────────────── */}
      <VendorsListClient initialVendors={vendors} />
    </div>
  );
}
