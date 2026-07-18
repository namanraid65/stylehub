"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart, ShoppingBag, Star, Truck, RefreshCw, Shield,
  ChevronLeft, ChevronRight, ZoomIn, X, Check, Ruler,
  Package, Store, ArrowRight, MessageSquare,
} from "lucide-react";
import type { Product } from "@/lib/mock-data";
import { useCartStore } from "@/lib/stores/cart.store";
import { useWishlistStore } from "@/lib/stores/wishlist.store";
import EnquiryModal from "@/components/enquiry/EnquiryModal";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import QASection from "@/components/reviews/QASection";


const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

interface Props { product: Product; }

export default function ProductDetailClient({ product }: Props) {
  const { addItem }   = useCartStore();
  const { toggle: toggleWish, isWished } = useWishlistStore();

  const [selectedImg,   setSelectedImg]   = useState(0);
  const [lightbox,      setLightbox]      = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.color ?? "");
  const [selectedSize,  setSelectedSize]  = useState("");
  const [qty,           setQty]           = useState(1);
  const [addedToCart,   setAddedToCart]   = useState(false);
  const [sizeChart,     setSizeChart]     = useState(false);
  const [activeTab, setActiveTab] = useState<"details"|"care"|"reviews"|"qa">("details");
  const [mounted,       setMounted]       = useState(false);
  const [isHovered,     setIsHovered]     = useState(false);
  const [zoomPos,       setZoomPos]       = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const wished = mounted ? isWished(product.id) : false;

  // Auto-select size if only one size (e.g. Free Size) is available in stock for this color
  useEffect(() => {
    const sizes = product.variants.filter((v) => v.color === selectedColor);
    if (sizes.length === 1 && sizes[0] && sizes[0].stock > 0) {
      setSelectedSize(sizes[0].size);
    }
  }, [selectedColor, product.variants]);

  // Lock body scroll when lightbox or size guide modal is open
  useEffect(() => {
    if (lightbox || sizeChart) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox, sizeChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };


  // Unique colours
  const uniqueColors = [...new Map(product.variants.map((v) => [v.color, v])).values()];

  // Sizes for selected colour
  const sizesForColor = product.variants.filter((v) => v.color === selectedColor);
  const selectedVariant = sizesForColor.find((v) => v.size === selectedSize);
  const needsSizeGuide = sizesForColor.length > 1 && !sizesForColor.some(v => {
    const s = v.size.toLowerCase();
    return s === "free size" || s === "onesize" || s === "fs" || s === "one size" || s === "o/s";
  });
  const categoryLower = product.category.toLowerCase();
  
  const isFootwear = categoryLower.includes("footwear") || 
                     categoryLower.includes("shoe");

  const isKidsFootwear = isFootwear && sizesForColor.some(v => {
    const n = Number(v.size);
    return !isNaN(n) && n < 36;
  });

  const isBottomwear = categoryLower.includes("denim") || 
                       categoryLower.includes("pants") || 
                       categoryLower.includes("jeans") ||
                       categoryLower.includes("bottom");

  // Determine appropriate size chart
  let sizeChartHeaders: string[] = [];
  let sizeChartRows: string[][] = [];
  let sizeChartNote: string = "";

  if (isKidsFootwear) {
    sizeChartHeaders = ["EU Size", "UK Size", "US Size", "Foot Length (cm)"];
    sizeChartRows = [
      ["25", "7.5 (Kids)", "8.5 (Kids)", "15.6"],
      ["26", "8.5 (Kids)", "9.5 (Kids)", "16.2"],
      ["27", "9 (Kids)", "10 (Kids)", "16.8"],
      ["28", "10 (Kids)", "11 (Kids)", "17.4"],
      ["29", "11 (Kids)", "12 (Kids)", "18.0"],
      ["30", "11.5 (Kids)", "12.5 (Kids)", "18.7"],
      ["31", "12.5 (Kids)", "13.5 (Kids)", "19.3"],
      ["32", "13 (Kids)", "1 (Youth)", "20.0"],
      ["33", "1 (Youth)", "2 (Youth)", "20.6"],
      ["34", "2 (Youth)", "3 (Youth)", "21.3"],
      ["35", "2.5 (Youth)", "3.5 (Youth)", "21.9"],
    ];
    sizeChartNote = "Kids' footwear sizes map EU sizes to UK and US children sizing formats.";
  } else if (isFootwear) {
    sizeChartHeaders = ["UK / India", "US (Men)", "US (Women)", "EU", "Foot Length (cm)"];
    sizeChartRows = [
      ["3", "4", "5", "36", "22.0"],
      ["4", "5", "6", "37", "22.9"],
      ["5", "6", "7", "38", "23.7"],
      ["6", "7", "8", "39", "24.6"],
      ["7", "8", "9", "40", "25.4"],
      ["8", "9", "10", "41", "26.2"],
      ["9", "10", "11", "42", "27.1"],
      ["10", "11", "12", "43", "27.9"],
      ["11", "12", "13", "44", "28.8"],
    ];
    sizeChartNote = "Measurements refer to standard foot length. We recommend choosing your usual UK / Indian shoe size.";
  } else if (isBottomwear) {
    sizeChartHeaders = ["Size", "Waist (in)", "Hip (in)", "Inseam (in)", "Rise (in)"];
    sizeChartRows = [
      ["28", "28", "36", "30", "9.5"],
      ["30", "30", "38", "30", "10.0"],
      ["32", "32", "40", "32", "10.5"],
      ["34", "34", "42", "32", "11.0"],
      ["36", "36", "44", "32", "11.5"],
    ];
    sizeChartNote = "Bottomwear sizes match standard waist measurements in inches.";
  } else {
    // Default Upperwear / Dresses / Tops size chart
    sizeChartHeaders = ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"];
    sizeChartRows = [
      ["XS", "31-32", "25-26", "34-35", "52"],
      ["S", "33-34", "27-28", "36-37", "53"],
      ["M", "35-36", "29-30", "38-39", "54"],
      ["L", "37-38", "31-32", "40-41", "55"],
      ["XL", "39-40", "33-34", "42-43", "55"],
    ];
    sizeChartNote = "Measurements are in inches. If between sizes, we recommend sizing up.";
  }

  const isSelectedSizeRow = (row: string[]) => {
    if (!selectedSize) return false;
    const sel = selectedSize.toLowerCase();
    return row.some(col => {
      const c = col.toLowerCase();
      return sel === c || c.includes(sel) || sel.includes(c);
    });
  };
  const effectivePrice = selectedVariant?.price ?? product.basePrice;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
  const stockLevel = selectedVariant?.stock ?? 0;
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - effectivePrice) / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedVariant) { alert("Please select a size"); return; }
    addItem({
      productId:      product.id,
      slug:           product.slug,
      name:           product.name,
      image:          product.images[0] ?? "",
      brand:          product.brand,
      vendorId:       product.vendorId,
      vendorName:     product.vendorName,
      vendorSlug:     product.vendorSlug,
      price:          selectedVariant.price,
      compareAtPrice: product.compareAtPrice,
      size:           selectedVariant.size,
      color:          selectedVariant.color,
      colorHex:       selectedVariant.colorHex,
      sku:            selectedVariant.sku,
      quantity:       qty,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };


  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: product.reviews.filter((rev) => Math.round(rev.rating) === r).length,
    pct: Math.round((product.reviews.filter((rev) => Math.round(rev.rating) === r).length / product.reviews.length) * 100),
  }));

  return (
    <div className="bg-[var(--cream)] min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs font-body text-[var(--muted)]">
            <Link href="/" className="hover:text-[var(--rose)] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-[var(--rose)] transition-colors">Products</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-[var(--rose)] transition-colors">{product.category}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--charcoal)] truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ── LEFT: Image Gallery ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Main image */}
            <div 
              className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-[var(--cream-dark)] group cursor-zoom-in"
              onClick={() => setLightbox(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={product.images[selectedImg]!}
                alt={product.name}
                fill
                priority
                className={`object-cover transition-transform duration-150 ${
                  isHovered ? "scale-[2.2]" : "scale-100"
                }`}
                style={{
                  transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : "center center"
                }}
              />
              {/* Zoom hint */}
              <div className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm transition-opacity duration-200 ${
                isHovered ? "opacity-0" : "opacity-100"
              }`}>
                <ZoomIn className="h-4 w-4 text-[var(--charcoal)]" />
              </div>
              {/* Nav arrows */}
              {product.images.length > 1 && (
                <div className={`transition-opacity duration-200 ${isHovered ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSelectedImg((i) => (i - 1 + product.images.length) % product.images.length); }}
                  ><ChevronLeft className="h-4 w-4" /></button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSelectedImg((i) => (i + 1) % product.images.length); }}
                  ><ChevronRight className="h-4 w-4" /></button>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`relative h-20 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      i === selectedImg ? "border-[var(--rose)]" : "border-transparent hover:border-[var(--rose-light)]"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ─────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 space-y-6 h-fit">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isBestSeller && <span className="px-3 py-1 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] text-xs font-body font-semibold border border-[var(--gold)]/30">Bestseller</span>}
              {product.isNew && <span className="px-3 py-1 rounded-full bg-[var(--charcoal)]/10 text-[var(--charcoal)] text-xs font-body font-semibold">New Arrival</span>}
              {discount && <span className="px-3 py-1 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-xs font-body font-semibold">{discount}% OFF</span>}
            </div>

            {/* Brand + Name */}
            <div>
              <Link href={`/vendors/${product.vendor.slug}`} className="text-xs font-body font-medium tracking-widest uppercase text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors">
                {product.brand}
              </Link>
              <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--charcoal)] mt-2 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--border)]"}`} />
                ))}
              </div>
              <span className="text-sm font-body font-medium text-[var(--charcoal)]">{product.rating}</span>
              <span className="text-sm font-body text-[var(--muted)]">({product.reviewCount} reviews)</span>
              <span className="text-sm font-body text-[var(--muted)]">· {product.soldCount.toLocaleString("en-IN")} sold</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-medium text-[var(--charcoal)]">{fmt(effectivePrice)}</span>
              {product.compareAtPrice && (
                <span className="text-xl font-body text-[var(--muted)] line-through">{fmt(product.compareAtPrice)}</span>
              )}
            </div>

            <div className="h-px bg-[var(--border)]" />

            {/* Colour selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-body font-semibold text-[var(--charcoal)] uppercase tracking-wider">Colour</p>
                <span className="text-sm font-body text-[var(--charcoal-mid)]">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {uniqueColors.map((v) => (
                  <button
                    key={v.color}
                    title={v.color}
                    onClick={() => { setSelectedColor(v.color); setSelectedSize(""); }}
                    className={`relative h-9 w-9 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === v.color ? "border-[var(--rose)] scale-110 shadow-md" : "border-[var(--border)]"
                    }`}
                    style={{ background: v.colorHex }}
                  >
                    {selectedColor === v.color && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            {sizesForColor.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-body font-semibold text-[var(--charcoal)] uppercase tracking-wider">Size</p>
                  {needsSizeGuide && (
                    <button
                      onClick={() => setSizeChart(true)}
                      className="flex items-center gap-1 text-xs font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors"
                    >
                      <Ruler className="h-3.5 w-3.5" /> Size Guide
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((v) => (
                    <button
                      key={v.size}
                      onClick={() => setSelectedSize(v.size)}
                      disabled={v.stock === 0}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-body font-medium transition-all relative ${
                        selectedSize === v.size
                          ? "border-[var(--charcoal)] bg-[var(--charcoal)] text-white"
                          : v.stock === 0
                          ? "border-[var(--border)] text-[var(--muted)] cursor-not-allowed line-through bg-[var(--cream-dark)]"
                          : "border-[var(--border)] text-[var(--charcoal)] hover:border-[var(--charcoal)]"
                      }`}
                    >
                      {v.size}
                      {v.stock > 0 && v.stock <= 4 && selectedSize !== v.size && (
                        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-[var(--rose)] rounded-full" title={`Only ${v.stock} left`} />
                      )}
                    </button>
                  ))}
                </div>
                {selectedSize && stockLevel <= 5 && stockLevel > 0 && (
                  <p className="mt-2 text-xs font-body text-[var(--rose)] font-medium">Only {stockLevel} left — order soon!</p>
                )}
              </div>
            )}

            {/* Qty + Add to cart */}
            <div className="flex gap-3">
              {/* Qty */}
              <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden bg-white">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-[var(--cream-dark)] transition-colors text-[var(--charcoal)] font-body text-lg">−</button>
                <span className="px-4 py-3 text-sm font-body font-medium text-[var(--charcoal)] min-w-[2.5rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-4 py-3 hover:bg-[var(--cream-dark)] transition-colors text-[var(--charcoal)] font-body text-lg">+</button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-body font-semibold transition-all duration-300 ${
                  addedToCart
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--charcoal)] text-white hover:bg-[var(--rose)] shadow-lg shadow-[var(--charcoal)]/20"
                }`}
              >
                {addedToCart ? <><Check className="h-4 w-4" /> Added to Bag</> : <><ShoppingBag className="h-4 w-4" /> Add to Bag</>}
              </button>

              {/* Wishlist */}
              <button
                onClick={() => toggleWish(product.id)}
                className={`p-3.5 rounded-xl border transition-all ${
                  wished ? "border-[var(--rose)] bg-[var(--rose)]/10 text-[var(--rose)]" : "border-[var(--border)] text-[var(--charcoal-mid)] hover:border-[var(--rose)] hover:text-[var(--rose)]"
                }`}
              >
                <Heart className={`h-5 w-5 ${wished ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck,    label: "Free Delivery", sub: "on orders ₹1999+" },
                { icon: RefreshCw,label: "Easy Returns",  sub: "within 15 days" },
                { icon: Shield,   label: "Authentic",     sub: "100% genuine" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-[var(--cream-dark)] gap-1.5">
                  <Icon className="h-4.5 w-4.5 text-[var(--rose)]" style={{ width:"1.125rem", height:"1.125rem" }} />
                  <p className="text-xs font-body font-semibold text-[var(--charcoal)]">{label}</p>
                  <p className="text-[10px] font-body text-[var(--muted)]">{sub}</p>
                </div>
              ))}
            </div>

            {/* Get a Quote button */}
            <EnquiryModal
              productId={product.id}
              productName={product.name}
              vendorId={product.vendorId}
            >
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] text-sm font-body font-medium text-[var(--charcoal-mid)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors">
                <MessageSquare className="h-4 w-4" />
                Get a Quote / Ask Vendor
              </button>
            </EnquiryModal>

            {/* Vendor chip */}
            <Link
              href={`/vendors/${product.vendor.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--rose)] transition-colors group"
            >
              <div className="h-10 w-10 rounded-full bg-[var(--cream-dark)] overflow-hidden relative shrink-0">
                <Image src={product.vendor.logo} alt={product.vendor.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body text-[var(--muted)] uppercase tracking-wider">Sold by</p>
                <p className="text-sm font-body font-semibold text-[var(--charcoal)]">{product.vendor.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
                  <span className="text-xs font-body text-[var(--muted)]">{product.vendor.rating} · {product.vendor.reviewCount} reviews</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--rose)] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* ── Product Tabs ──────────────────────────────────────────────────── */}
        <div className="mt-16">
          <div className="flex gap-0 border-b border-[var(--border)]">
            {(["details","care","reviews","qa"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-sm font-body font-medium capitalize transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-[var(--rose)] text-[var(--rose)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--charcoal)]"
                }`}
              >
                {tab === "reviews" ? `Reviews (${product.reviewCount})` : tab === "care" ? "Care & Material" : tab === "qa" ? "Q&A" : "Product Details"}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "details" && (
              <div className="max-w-2xl space-y-4">
                <p className="text-[var(--charcoal-mid)] font-body leading-relaxed">{product.longDescription}</p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {[
                    { label: "Category",  value: product.category },
                    { label: "Gender",    value: product.gender.charAt(0).toUpperCase() + product.gender.slice(1) },
                    { label: "Brand",     value: product.brand },
                    { label: "Material",  value: product.material },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-xs font-body text-[var(--muted)] uppercase tracking-wider w-20 shrink-0 pt-0.5">{label}</span>
                      <span className="text-sm font-body font-medium text-[var(--charcoal)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "care" && (
              <div className="max-w-2xl space-y-4">
                <div className="p-5 rounded-2xl bg-white border border-[var(--border)]">
                  <h3 className="font-display text-lg font-medium text-[var(--charcoal)] mb-3">Material</h3>
                  <p className="text-sm font-body text-[var(--charcoal-mid)]">{product.material}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[var(--border)]">
                  <h3 className="font-display text-lg font-medium text-[var(--charcoal)] mb-3">Care Instructions</h3>
                  <p className="text-sm font-body text-[var(--charcoal-mid)]">{product.careInstructions}</p>
                </div>
              </div>
            )}

            {/* Q&A */}
            {activeTab === "reviews" && (
              <div className="max-w-4xl">
                <ReviewsSection
                  reviews={product.reviews}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  productId={product.id}
                  vendorId={product.vendorId}
                />
              </div>
            )}

            {activeTab === "qa" && (
              <div className="max-w-3xl">
                <QASection productId={product.id} vendorId={product.vendorId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out" onClick={() => setLightbox(false)}>
          <button 
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="relative w-[90vw] max-w-xl aspect-[3/4]">
            <Image src={product.images[selectedImg]!} alt={product.name} fill className="object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedImg((i) => (i - 1 + product.images.length) % product.images.length); }}
          ><ChevronLeft className="h-6 w-6 text-white" /></button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedImg((i) => (i + 1) % product.images.length); }}
          ><ChevronRight className="h-6 w-6 text-white" /></button>
        </div>
      )}

      {/* ── Size Chart Modal ───────────────────────────────────────────────────── */}
      {sizeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSizeChart(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h3 className="font-display text-xl font-medium">Size Guide</h3>
              <button onClick={() => setSizeChart(false)} className="p-1.5 rounded-full hover:bg-[var(--cream-dark)] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {sizeChartHeaders.map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChartRows.map((row) => {
                    const [size, ...vals] = row;
                    return (
                      <tr key={size} className={`border-b border-[var(--border)] last:border-0 ${isSelectedSizeRow(row) ? "bg-[var(--rose)]/5 font-semibold" : ""}`}>
                        <td className="py-3 px-3 font-semibold text-[var(--charcoal)]">{size}</td>
                        {vals.map((v, i) => <td key={i} className="py-3 px-3 text-[var(--charcoal-mid)]">{v}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs font-body text-[var(--muted)] mt-4">{sizeChartNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
