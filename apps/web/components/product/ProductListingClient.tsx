"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Grid3X3, List } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product, Category } from "@/lib/mock-data";

const SORT_OPTIONS = [
  { value: "popular",  label: "Most Popular" },
  { value: "newest",   label: "Newest First" },
  { value: "price-asc",label: "Price: Low to High" },
  { value: "price-desc",label:"Price: High to Low" },
  { value: "rating",   label: "Top Rated" },
];

const SIZE_OPTIONS = ["XS","S","M","L","XL","XXL","UK 4","UK 5","UK 6","UK 7","UK 8","Free Size"];
const COLOR_OPTIONS = [
  { name:"Black",      hex:"#0A0A0A" },{ name:"White",      hex:"#F5F5F5" },
  { name:"Ivory",      hex:"#FFFFF0" },{ name:"Dusty Pink", hex:"#D4A0A0" },
  { name:"Rose",       hex:"#B5536A" },{ name:"Navy",       hex:"#191970" },
  { name:"Camel",      hex:"#C19A6B" },{ name:"Sage",       hex:"#9CAF88" },
  { name:"Terracotta", hex:"#CC4E2A" },{ name:"Gold",       hex:"#FFD700" },
];

interface Props {
  initialProducts: Product[];
  categories:      Category[];
}

// Collapsible filter section
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--border)] pb-5 mb-5 last:border-0">
      <button
        className="flex items-center justify-between w-full text-sm font-body font-semibold text-[var(--charcoal)] uppercase tracking-wider mb-3"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-[var(--muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted)]" />}
      </button>
      {open && children}
    </div>
  );
}

export default function ProductListingClient({ initialProducts, categories }: Props) {
  // Filter state
  const [search,       setSearch]       = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSizes,setSelectedSizes]= useState<string[]>([]);
  const [selectedColors,setSelectedColors]=useState<string[]>([]);
  const [priceRange,   setPriceRange]   = useState<[number, number]>([0, 10000]);
  const [minRating,    setMinRating]    = useState(0);
  const [sort,         setSort]         = useState("popular");
  const [mobileFilter, setMobileFilter] = useState(false);
  const [viewMode,     setViewMode]     = useState<"grid"|"list">("grid");
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("category");
    const s = searchParams.get("sort");
    setSelectedCats(cat ? [cat] : []);
    setSort(s || "popular");
  }, [searchParams]);

  // Derived filtered + sorted list
  const products = useMemo(() => {
    let list = [...initialProducts];

    if (search)          list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
    if (selectedCats.length)  list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    if (selectedColors.length)list = list.filter(p => p.variants.some(v => selectedColors.includes(v.color)));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0)   list = list.filter(p => p.rating >= minRating);

    switch (sort) {
      case "newest":    list.sort((a,b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case "price-asc": list.sort((a,b) => a.basePrice - b.basePrice); break;
      case "price-desc":list.sort((a,b) => b.basePrice - a.basePrice); break;
      case "rating":    list.sort((a,b) => b.rating - a.rating); break;
      default:          list.sort((a,b) => b.soldCount - a.soldCount);
    }
    return list;
  }, [initialProducts, search, selectedCats, selectedSizes, selectedColors, priceRange, minRating, sort]);

  const toggleArr = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const activeFiltersCount = selectedCats.length + selectedSizes.length + selectedColors.length + (minRating > 0 ? 1 : 0);
  const clearAll = () => { setSelectedCats([]); setSelectedSizes([]); setSelectedColors([]); setPriceRange([0,10000]); setMinRating(0); };

  const FilterPanel = () => (
    <aside className="space-y-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl text-[var(--charcoal)]">Filters</h2>
        {activeFiltersCount > 0 && (
          <button onClick={clearAll} className="text-xs font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors">
            Clear all ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCats.includes(cat.slug)}
                onChange={() => toggleArr(selectedCats, setSelectedCats, cat.slug)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--rose)]"
              />
              <span className="text-sm font-body text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)] transition-colors flex-1">{cat.name}</span>
              <span className="text-xs text-[var(--muted)] font-body">{initialProducts.filter(p => p.categorySlug === cat.slug).length}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-body">
            <span className="text-[var(--muted)]">₹{priceRange[0].toLocaleString("en-IN")}</span>
            <span className="text-[var(--muted)]">—</span>
            <span className="text-[var(--charcoal)]">₹{priceRange[1].toLocaleString("en-IN")}</span>
          </div>
          <input
            type="range" min={0} max={10000} step={100}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-[var(--rose)]"
          />
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleArr(selectedSizes, setSelectedSizes, s)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-body font-medium transition-all ${
                selectedSizes.includes(s)
                  ? "border-[var(--rose)] bg-[var(--rose)] text-white"
                  : "border-[var(--border)] text-[var(--charcoal-mid)] hover:border-[var(--rose)] hover:text-[var(--rose)]"
              }`}
            >{s}</button>
          ))}
        </div>
      </FilterSection>

      {/* Color */}
      <FilterSection title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => toggleArr(selectedColors, setSelectedColors, c.name)}
              className={`relative h-7 w-7 rounded-full border-2 transition-all ${
                selectedColors.includes(c.name) ? "border-[var(--rose)] scale-110" : "border-[var(--border)] hover:scale-105"
              }`}
              style={{ background: c.hex }}
            >
              {selectedColors.includes(c.name) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
                </span>
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Min. Rating" defaultOpen={false}>
        <div className="space-y-1.5">
          {[4.5,4.0,3.5,3.0].map(r => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={`flex items-center gap-2 text-sm font-body w-full py-1 transition-colors ${
                minRating === r ? "text-[var(--rose)]" : "text-[var(--charcoal-mid)] hover:text-[var(--charcoal)]"
              }`}
            >
              <span className="text-[var(--gold)]">{"★".repeat(Math.floor(r))}{r % 1 ? "½" : ""}</span>
              {r}+ & above
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Page header */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--charcoal)] mb-2">All Collections</h1>
          <p className="text-sm font-body text-[var(--muted)]">
            {products.length} styles from India's finest artisan vendors
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm">
              <FilterPanel />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFilter(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] text-sm font-body font-medium text-[var(--charcoal)] bg-white hover:border-[var(--rose)] transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>

              {/* Search */}
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-[180px] px-4 py-2 rounded-full border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)]"
              />

              <div className="ml-auto flex items-center gap-2">
                {/* View toggle */}
                <div className="hidden sm:flex gap-1 p-1 bg-white rounded-lg border border-[var(--border)]">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--rose)] text-white" : "text-[var(--muted)] hover:text-[var(--charcoal)]"}`}>
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--rose)] text-white" : "text-[var(--muted)] hover:text-[var(--charcoal)]"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="px-3 py-2 rounded-full border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] text-[var(--charcoal)] cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedCats.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-xs font-body font-medium">
                    {c} <button onClick={() => toggleArr(selectedCats, setSelectedCats, c)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedSizes.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--charcoal)]/10 text-[var(--charcoal)] text-xs font-body font-medium">
                    Size: {s} <button onClick={() => toggleArr(selectedSizes, setSelectedSizes, s)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedColors.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold)]/15 text-[var(--charcoal)] text-xs font-body font-medium">
                    {c} <button onClick={() => toggleArr(selectedColors, setSelectedColors, c)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Product grid */}
            {products.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-display text-2xl text-[var(--charcoal)] mb-3">No styles found</p>
                <p className="text-[var(--muted)] font-body text-sm mb-6">Try adjusting your filters or search terms.</p>
                <button onClick={clearAll} className="px-6 py-3 rounded-full bg-[var(--rose)] text-white text-sm font-body font-medium hover:bg-[var(--rose-dark)] transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">Filters</h2>
              <button onClick={() => setMobileFilter(false)} className="p-1.5 rounded-full hover:bg-[var(--cream-dark)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setMobileFilter(false)}
              className="mt-6 w-full py-3 rounded-full bg-[var(--rose)] text-white font-body font-medium text-sm hover:bg-[var(--rose-dark)] transition-colors"
            >
              Show {products.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
