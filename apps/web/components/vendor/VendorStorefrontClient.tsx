"use client";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Star, Package, ShieldCheck, ArrowRight, Heart,
  Instagram, Globe, Award,
} from "lucide-react";
import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { Vendor, Product } from "@/lib/mock-data";

interface Props { vendor: Vendor; products: Product[]; }

export default function VendorStorefrontClient({ vendor, products }: Props) {
  const [activeTab, setActiveTab] = useState<"products" | "about">("products");
  const [sortBy,    setSortBy]    = useState("popular");
  const [isFollowing, setIsFollowing] = useState(false);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-asc")  return a.basePrice - b.basePrice;
    if (sortBy === "price-desc") return b.basePrice - a.basePrice;
    if (sortBy === "rating")     return b.rating - a.rating;
    return b.soldCount - a.soldCount;
  });

  const avgRating = products.length
    ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1)
    : vendor.rating.toFixed(1);

  return (
    <div className="min-h-screen bg-[var(--cream)]">

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative h-60 sm:h-80 md:h-96 overflow-hidden">
        <Image
          src={vendor.banner}
          alt={`${vendor.name} banner`}
          fill
          priority
          className="object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 sm:left-8">
          <nav className="flex items-center gap-2 text-xs font-body text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white transition-colors">Vendors</Link>
            <span>/</span>
            <span className="text-white">{vendor.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Profile Card ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-[var(--border)] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">

              {/* Logo */}
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg shrink-0 -mt-2">
                <Image src={vendor.logo} alt={vendor.name} fill className="object-cover" />
              </div>

              {/* Info block */}
              <div className="flex-1 min-w-0">
                {/* Name + badges */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--charcoal)]">
                    {vendor.name}
                  </h1>
                  {vendor.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Vendor
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm font-body text-[var(--charcoal-mid)] leading-relaxed max-w-2xl mb-4">
                  {vendor.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-sm font-body text-[var(--charcoal-mid)]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[var(--rose)] shrink-0" />
                    {vendor.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)] shrink-0" />
                    {avgRating} &nbsp;
                    <span className="text-[var(--muted)]">({vendor.reviewCount.toLocaleString("en-IN")} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-[var(--rose)] shrink-0" />
                    {products.length} products
                  </span>
                </div>
              </div>

              {/* Right side: tags + actions */}
              <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                <div className="flex flex-wrap gap-2">
                  {vendor.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full border border-[var(--border)] text-xs font-body text-[var(--charcoal-mid)] bg-[var(--cream)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    isFollowing
                      ? "bg-[var(--rose)] border-[var(--rose)] text-white font-medium"
                      : "border-[var(--rose)] text-[var(--rose)] text-xs font-body font-medium hover:bg-[var(--rose)] hover:text-white"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isFollowing ? "fill-white" : ""}`} />
                  {isFollowing ? "Following" : "Follow Store"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Package,  label: "Products",       value: `${products.length}`                                 },
            { icon: Star,     label: "Avg. Rating",     value: avgRating                                            },
            { icon: Award,    label: "Happy Customers", value: `${(vendor.reviewCount * 4).toLocaleString("en-IN")}+` },
            { icon: Globe,    label: "Ships From",      value: vendor.location.split(",")[0]!                       },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-[var(--border)]">
              <Icon className="h-5 w-5 text-[var(--rose)] mx-auto mb-2" />
              <p className="font-display text-xl md:text-2xl font-medium text-[var(--charcoal)]">{value}</p>
              <p className="text-[10px] font-body text-[var(--muted)] uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-0 border-b border-[var(--border)] mb-8">
          {(["products", "about"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-body font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[var(--rose)] text-[var(--rose)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--charcoal)]"
              }`}
            >
              {tab === "products"
                ? `All Products (${products.length})`
                : "Brand Story"}
            </button>
          ))}
        </div>

        {/* ── Products Tab ───────────────────────────────────────────────────── */}
        {activeTab === "products" && (
          <>
            {/* Sort toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-sm font-body text-[var(--muted)]">
                {sorted.length} styles from {vendor.name}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-full border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)]"
              >
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {sorted.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-16">
                {sorted.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 pb-16">
                <div className="h-20 w-20 rounded-full bg-[var(--cream-dark)] flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-[var(--muted)]" />
                </div>
                <p className="font-display text-2xl text-[var(--charcoal)] mb-2">No products yet</p>
                <p className="text-sm font-body text-[var(--muted)] mb-6">
                  This vendor hasn't listed products yet. Check back soon!
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--rose)] text-white text-sm font-body font-medium hover:bg-[var(--rose-dark)] transition-colors"
                >
                  Browse all products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        )}

        {/* ── About Tab ─────────────────────────────────────────────────────── */}
        {activeTab === "about" && (
          <div className="max-w-2xl pb-16 space-y-6">
            {/* Story card */}
            <div className="bg-white rounded-2xl p-7 border border-[var(--border)] shadow-sm">
              <h2 className="font-display text-2xl font-medium text-[var(--charcoal)] mb-4">Our Story</h2>
              <p className="text-sm font-body text-[var(--charcoal-mid)] leading-relaxed">
                {vendor.description}
              </p>
              <p className="text-sm font-body text-[var(--charcoal-mid)] leading-relaxed mt-4">
                Based in {vendor.location}, every piece we craft tells a story — of the skilled hands
                that shaped it, the traditions that inspired it, and the woman who will wear it proudly.
                We believe fashion should be both beautiful and meaningful, which is why we partner only
                with artisans who share our commitment to quality and ethical practices.
              </p>
              <p className="text-sm font-body text-[var(--charcoal-mid)] leading-relaxed mt-4">
                From sourcing the finest raw materials to the final finishing touches, our process is
                guided by an unwavering dedication to craft. We invite you to explore our collection and
                discover the artistry that goes into each piece.
              </p>
            </div>

            {/* Specialities card */}
            <div className="bg-white rounded-2xl p-7 border border-[var(--border)] shadow-sm">
              <h2 className="font-display text-2xl font-medium text-[var(--charcoal)] mb-4">
                What We're Known For
              </h2>
              <div className="flex flex-wrap gap-3">
                {vendor.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-sm font-body font-medium border border-[var(--rose)]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Commitment card */}
            <div className="bg-[var(--charcoal)] rounded-2xl p-7 text-white">
              <h2 className="font-display text-2xl font-medium mb-4">Our Promise</h2>
              <div className="space-y-3">
                {[
                  "100% authentic handcrafted products",
                  "Ethically sourced materials",
                  "Supporting local artisan communities",
                  "Easy 15-day return policy",
                ].map((promise) => (
                  <div key={promise} className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-[var(--gold)] flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3 w-3 text-white" />
                    </span>
                    <p className="text-sm font-body text-white/80">{promise}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
