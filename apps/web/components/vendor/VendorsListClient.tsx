"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Star, ShieldCheck, ArrowRight, Store } from "lucide-react";

interface Vendor {
  _id: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  storeLocation?: string;
  storeTags?: string[];
  storeRating?: number;
  totalReviews?: number;
  status: string;
}

interface Props {
  initialVendors: Vendor[];
}

export default function VendorsListClient({ initialVendors }: Props) {
  const [search, setSearch] = useState("");

  const filtered = initialVendors.filter((v) => {
    const query = search.toLowerCase();
    return (
      v.storeName.toLowerCase().includes(query) ||
      (v.storeLocation || "").toLowerCase().includes(query) ||
      (v.storeTags || []).some((t) => t.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-12">
      {/* Search Header Strip */}
      <div className="bg-white border-y border-[var(--border)] py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="font-body text-sm text-[var(--charcoal-mid)]">
            Showing <span className="font-semibold text-[var(--charcoal)]">{filtered.length}</span> artisan partners
          </p>
          
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search by brand name, city, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm font-body bg-[var(--cream)] border border-[var(--border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/30 focus:border-[var(--rose)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="max-w-7xl mx-auto px-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((vendor) => {
              const rating = vendor.storeRating || 5.0;
              const reviews = vendor.totalReviews || 0;
              const logo = vendor.storeLogo || "https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=80&h=80&fit=crop";
              const banner = vendor.storeBanner || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&h=400&fit=crop";
              
              return (
                <div
                  key={vendor._id}
                  className="group bg-white rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Banner Photo */}
                  <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={banner}
                      alt={`${vendor.storeName} banner`}
                      fill
                      sizes="(max-w-768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>

                  {/* Body Content */}
                  <div className="p-6 pt-0 relative flex-1 flex flex-col">
                    {/* Floating Logo Badge */}
                    <div className="relative -mt-10 mb-4 h-16 w-16 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-white shrink-0">
                      <Image
                        src={logo}
                        alt={`${vendor.storeName} logo`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    {/* Name & Verification */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display text-xl font-semibold text-[var(--charcoal)] group-hover:text-[var(--rose)] transition-colors">
                        {vendor.storeName}
                      </h3>
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    </div>

                    {/* Rating & Location */}
                    <div className="flex items-center gap-4 text-xs font-body text-[var(--charcoal-mid)] mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[var(--rose)]" />
                        {vendor.storeLocation || "India"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                        {rating.toFixed(1)} <span className="text-[var(--muted)]">({reviews})</span>
                      </span>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs font-body text-[var(--charcoal-mid)] line-clamp-3 leading-relaxed mb-4 flex-1">
                      {vendor.storeDescription || "Discover our unique collection of artisan-crafted apparel and lifestyle accessories."}
                    </p>

                    {/* Tags */}
                    {vendor.storeTags && vendor.storeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {vendor.storeTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-body font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-[var(--cream)] border border-[var(--border)] text-[var(--charcoal-mid)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer CTA Link */}
                    <Link
                      href={`/vendors/${vendor.storeSlug}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--rose)]/30 text-[var(--rose)] text-xs font-body font-semibold tracking-wider hover:bg-[var(--rose)] hover:text-white transition-all group/btn"
                    >
                      VISIT STOREFRONT
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[var(--border)] max-w-xl mx-auto p-8">
            <div className="h-16 w-16 rounded-full bg-[var(--rose)]/10 flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-[var(--rose)]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[var(--charcoal)] mb-2">No Artisan Partners Found</h3>
            <p className="font-body text-sm text-[var(--charcoal-mid)]">
              We couldn't find any vendors matching "{search}". Try searching for another keyword or check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
