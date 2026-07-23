"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Grid3X3, List, Search } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product, Category } from "@/lib/mock-data";

const SORT_OPTIONS = [
  { value: "popular",  label: "Most Popular" },
  { value: "newest",   label: "Newest First" },
  { value: "price-asc",label: "Price: Low to High" },
  { value: "price-desc",label:"Price: High to Low" },
  { value: "rating",   label: "Top Rated" },
];

const SIZE_OPTIONS = [
  "XS","S","M","L","XL","XXL",
  "28","30","32","34","36",
  "4-5Y","6-7Y","8-9Y","10-11Y","12-13Y",
  "37","38","39","40","41","42","43","44","45",
  "Free Size"
];
const COLOR_OPTIONS = [
  { name:"Black",      hex:"#0A0A0A" },
  { name:"White",      hex:"#F5F5F5" },
  { name:"Ivory",      hex:"#FFFFF0" },
  { name:"Blush",      hex:"#DE5D83" },
  { name:"Crimson",    hex:"#B7410E" },
  { name:"Navy",       hex:"#191970" },
  { name:"Camel",      hex:"#C19A6B" },
  { name:"Sage",       hex:"#9CAF88" },
  { name:"Teal",       hex:"#008080" },
  { name:"Gold",       hex:"#FFD700" },
];

const PRESET_PRICES = [
  { label: "All Prices", range: [0, 20000] as [number, number] },
  { label: "Under ₹999", range: [0, 999] as [number, number] },
  { label: "₹1,000 - ₹2,999", range: [1000, 2999] as [number, number] },
  { label: "₹3,000 - ₹4,999", range: [3000, 4999] as [number, number] },
  { label: "₹5,000+", range: [5000, 20000] as [number, number] },
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

function matchSearch(product: any, query: string): boolean {
  if (!query) return true;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  return terms.every(term => {
    if (term === "men" || term === "mens") {
      return product.gender === "men" || product.gender === "unisex";
    }
    if (term === "women" || term === "womens") {
      return product.gender === "women" || product.gender === "unisex";
    }
    if (term === "unisex") {
      return product.gender === "unisex";
    }
    if (term === "boys" || term === "boy") {
      return product.gender === "boys";
    }
    if (term === "girls" || term === "girl") {
      return product.gender === "girls";
    }
    
    const name = (product.name || "").toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    const cat = (product.category || "").toLowerCase();
    const desc = (product.description || "").toLowerCase();
    
    if (term.length <= 3) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(name) || regex.test(brand) || regex.test(cat) || regex.test(desc);
    }
    
    return name.includes(term) || brand.includes(term) || cat.includes(term) || desc.includes(term);
  });
}

export default function ProductListingClient({ initialProducts, categories }: Props) {
  // Filter state
  const [search,       setSearch]       = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSizes,setSelectedSizes]= useState<string[]>([]);
  const [selectedColors,setSelectedColors]=useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange,   setPriceRange]   = useState<[number, number]>([0, 20000]);
  const [customMin,    setCustomMin]    = useState<number>(0);
  const [customMax,    setCustomMax]    = useState<number>(20000);
  const [minRating,    setMinRating]    = useState(0);
  const [minDiscount,  setMinDiscount]  = useState<number>(0);
  const [sort,         setSort]         = useState("popular");
  const [mobileFilter, setMobileFilter] = useState(false);
  const [viewMode,     setViewMode]     = useState<"grid"|"list">("grid");
  const [showSidebar,  setShowSidebar]  = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === "category") {
      const current = selectedCats.includes(value)
        ? selectedCats.filter(x => x !== value)
        : [...selectedCats, value];
      setSelectedCats(current);
      if (current.length) params.set("category", current.join(","));
      else params.delete("category");
    } else if (type === "brand") {
      const current = selectedBrands.includes(value)
        ? selectedBrands.filter(x => x !== value)
        : [...selectedBrands, value];
      setSelectedBrands(current);
      if (current.length) params.set("brand", current.join(","));
      else params.delete("brand");
    } else if (type === "gender") {
      const current = selectedGenders.includes(value)
        ? selectedGenders.filter(x => x !== value)
        : [...selectedGenders, value];
      setSelectedGenders(current);
      if (current.length) params.set("gender", current.join(","));
      else params.delete("gender");
    } else if (type === "sort") {
      setSort(value);
      if (value && value !== "popular") params.set("sort", value);
      else params.delete("sort");
    }
    
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const cat = searchParams.get("category");
    const s = searchParams.get("sort");
    const g = searchParams.get("gender");
    const b = searchParams.get("brand");
    const q = searchParams.get("q") || searchParams.get("search");
    
    const urlCats = cat ? cat.split(",") : [];
    const urlGenders = g ? g.split(",") : [];
    const urlBrands = b ? b.split(",") : [];
    const urlSearch = q || "";
    const urlSort = s || "popular";
    
    if (JSON.stringify(selectedCats) !== JSON.stringify(urlCats)) setSelectedCats(urlCats);
    if (JSON.stringify(selectedGenders) !== JSON.stringify(urlGenders)) setSelectedGenders(urlGenders);
    if (JSON.stringify(selectedBrands) !== JSON.stringify(urlBrands)) setSelectedBrands(urlBrands);
    if (search !== urlSearch) setSearch(urlSearch);
    if (sort !== urlSort) setSort(urlSort);
  }, [searchParams]);

  // Sync custom input fields with price range changes
  useEffect(() => {
    setCustomMin(priceRange[0]);
    setCustomMax(priceRange[1]);
  }, [priceRange]);

  // Dynamic counts helper for Genders
  const productsForGenderCounts = useMemo(() => {
    let list = [...initialProducts];
    if (search) list = list.filter(p => matchSearch(p, search));
    if (selectedCats.length) list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    if (selectedColors.length) list = list.filter(p => p.variants.some(v => selectedColors.some(cf => v.color.toLowerCase().includes(cf.toLowerCase()))));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (minDiscount > 0) {
      list = list.filter(p => {
        const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
        return discount >= minDiscount;
      });
    }
    return list;
  }, [initialProducts, search, selectedCats, selectedBrands, selectedSizes, selectedColors, priceRange, minRating, minDiscount]);

  // Dynamic counts helper for Categories
  const productsForCategoryCounts = useMemo(() => {
    let list = [...initialProducts];
    if (search) list = list.filter(p => matchSearch(p, search));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.includes(p.gender));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    if (selectedColors.length) list = list.filter(p => p.variants.some(v => selectedColors.some(cf => v.color.toLowerCase().includes(cf.toLowerCase()))));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (minDiscount > 0) {
      list = list.filter(p => {
        const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
        return discount >= minDiscount;
      });
    }
    return list;
  }, [initialProducts, search, selectedGenders, selectedBrands, selectedSizes, selectedColors, priceRange, minRating, minDiscount]);

  // Dynamic counts helper for Brands/Vendors
  const productsForBrandCounts = useMemo(() => {
    let list = [...initialProducts];
    if (search) list = list.filter(p => matchSearch(p, search));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.includes(p.gender));
    if (selectedCats.length) list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    if (selectedColors.length) list = list.filter(p => p.variants.some(v => selectedColors.some(cf => v.color.toLowerCase().includes(cf.toLowerCase()))));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (minDiscount > 0) {
      list = list.filter(p => {
        const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
        return discount >= minDiscount;
      });
    }
    return list;
  }, [initialProducts, search, selectedGenders, selectedCats, selectedSizes, selectedColors, priceRange, minRating, minDiscount]);

  // Dynamic counts helper for Sizes
  const productsForSizeCounts = useMemo(() => {
    let list = [...initialProducts];
    if (search) list = list.filter(p => matchSearch(p, search));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.includes(p.gender));
    if (selectedCats.length) list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedColors.length) list = list.filter(p => p.variants.some(v => selectedColors.some(cf => v.color.toLowerCase().includes(cf.toLowerCase()))));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (minDiscount > 0) {
      list = list.filter(p => {
        const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
        return discount >= minDiscount;
      });
    }
    return list;
  }, [initialProducts, search, selectedGenders, selectedCats, selectedBrands, selectedColors, priceRange, minRating, minDiscount]);

  // Dynamic counts helper for Colors
  const productsForColorCounts = useMemo(() => {
    let list = [...initialProducts];
    if (search) list = list.filter(p => matchSearch(p, search));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.includes(p.gender));
    if (selectedCats.length) list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (minDiscount > 0) {
      list = list.filter(p => {
        const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
        return discount >= minDiscount;
      });
    }
    return list;
  }, [initialProducts, search, selectedGenders, selectedCats, selectedBrands, selectedSizes, priceRange, minRating, minDiscount]);

  // Dynamic counts helper for Discounts
  const productsForDiscountCounts = useMemo(() => {
    let list = [...initialProducts];
    if (search) list = list.filter(p => matchSearch(p, search));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.includes(p.gender));
    if (selectedCats.length) list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    if (selectedColors.length) list = list.filter(p => p.variants.some(v => selectedColors.some(cf => v.color.toLowerCase().includes(cf.toLowerCase()))));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    return list;
  }, [initialProducts, search, selectedGenders, selectedCats, selectedBrands, selectedSizes, selectedColors, priceRange, minRating]);

  // Derived filtered + sorted list
  const products = useMemo(() => {
    let list = [...initialProducts];
 
    if (search)          list = list.filter(p => matchSearch(p, search));
    if (selectedCats.length)  list = list.filter(p => selectedCats.includes(p.categorySlug));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter(p => p.variants.some(v => selectedSizes.includes(v.size)));
    if (selectedColors.length)list = list.filter(p => p.variants.some(v => selectedColors.some(cf => v.color.toLowerCase().includes(cf.toLowerCase()))));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.includes(p.gender));
    list = list.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);
    if (minRating > 0)   list = list.filter(p => p.rating >= minRating);
    if (minDiscount > 0) {
      list = list.filter(p => {
        const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
        return discount >= minDiscount;
      });
    }
 
    switch (sort) {
      case "newest":    list.sort((a,b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case "price-asc": list.sort((a,b) => a.basePrice - b.basePrice); break;
      case "price-desc":list.sort((a,b) => b.basePrice - a.basePrice); break;
      case "rating":    list.sort((a,b) => b.rating - a.rating); break;
      default:          list.sort((a,b) => b.soldCount - a.soldCount);
    }
    return list;
  }, [initialProducts, search, selectedCats, selectedBrands, selectedSizes, selectedColors, selectedGenders, priceRange, minRating, minDiscount, sort]);
 
  const toggleArr = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
 
  const activeFiltersCount =
    selectedCats.length +
    selectedSizes.length +
    selectedColors.length +
    selectedGenders.length +
    selectedBrands.length +
    (minRating > 0 ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 20000 ? 1 : 0);

  const clearAll = () => {
    setSelectedCats([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedGenders([]);
    setSelectedBrands([]);
    setPriceRange([0, 20000]);
    setMinRating(0);
    setMinDiscount(0);
    setSearch("");
    router.push("/products");
  };
 
  const renderFilterPanel = () => {
    const renderSizeGroup = (title: string, groupSizes: string[]) => {
      // Only show the size group if there is at least one product matching other filters that has a size in this group
      const hasAnyActiveSize = groupSizes.some(s => productsForSizeCounts.some(p => p.variants.some(v => v.size === s)));
      if (!hasAnyActiveSize) return null;

      return (
        <div className="mb-4 last:mb-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-2">{title}</span>
          <div className="flex flex-wrap gap-1.5">
            {groupSizes.map(s => {
              const count = productsForSizeCounts.filter(p => p.variants.some(v => v.size === s)).length;
              const isSelected = selectedSizes.includes(s);
              const isDisabled = count === 0 && !isSelected;

              return (
                <button
                  key={s}
                  disabled={isDisabled}
                  onClick={() => toggleArr(selectedSizes, setSelectedSizes, s)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-body font-medium transition-all ${
                    isSelected
                      ? "border-[var(--rose)] bg-[var(--rose)] text-white"
                      : isDisabled
                      ? "border-[var(--border)] text-[var(--muted)] opacity-30 cursor-not-allowed bg-[var(--cream)]"
                      : "border-[var(--border)] text-[var(--charcoal-mid)] hover:border-[var(--rose)] hover:text-[var(--rose)] bg-white"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      );
    };

    const handleCustomPriceGo = () => {
      setPriceRange([customMin, customMax || 20000]);
    };

    return (
      <aside className="space-y-0">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg font-bold text-[var(--charcoal)] tracking-wide uppercase">Filters</h2>
          </div>
          {activeFiltersCount > 0 && (
            <button onClick={clearAll} className="text-xs font-semibold font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors uppercase tracking-wider">
              Clear all
            </button>
          )}
        </div>

        {/* Gender */}
        <FilterSection title="Gender">
          <div className="space-y-2">
            {["men", "women", "boys", "girls", "unisex"].map(g => {
              const count = productsForGenderCounts.filter(p => p.gender === g).length;
              const isSelected = selectedGenders.includes(g);
              const isDisabled = count === 0 && !isSelected;

              return (
                <label key={g} className={`flex items-center gap-2.5 cursor-pointer group ${isDisabled ? "opacity-35 cursor-not-allowed" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={isSelected}
                    onChange={() => handleFilterChange("gender", g)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--rose)] disabled:opacity-40 cursor-pointer"
                  />
                  <span className={`text-sm font-body ${isSelected ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)]"} transition-colors flex-1 capitalize`}>{g}</span>
                  <span className="text-xs text-[var(--muted)] font-body">({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Category */}
        <FilterSection title="Category">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map(cat => {
              const count = productsForCategoryCounts.filter(p => p.categorySlug === cat.slug).length;
              const isSelected = selectedCats.includes(cat.slug);
              const isDisabled = count === 0 && !isSelected;

              return (
                <label key={cat.id} className={`flex items-center gap-2.5 cursor-pointer group ${isDisabled ? "opacity-35 cursor-not-allowed" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={isSelected}
                    onChange={() => handleFilterChange("category", cat.slug)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--rose)] disabled:opacity-40 cursor-pointer"
                  />
                  <span className={`text-sm font-body ${isSelected ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)]"} transition-colors flex-1`}>{cat.name}</span>
                  <span className="text-xs text-[var(--muted)] font-body">({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Brand / Vendor */}
        <FilterSection title="Brand">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {["DesiCouture", "UrbanThreads", "SoleMate", "GlimmerCo", "VelveteenRose"].map(b => {
              const count = productsForBrandCounts.filter(p => p.brand === b).length;
              const isSelected = selectedBrands.includes(b);
              const isDisabled = count === 0 && !isSelected;

              return (
                <label key={b} className={`flex items-center gap-2.5 cursor-pointer group ${isDisabled ? "opacity-35 cursor-not-allowed" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={isSelected}
                    onChange={() => handleFilterChange("brand", b)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--rose)] disabled:opacity-40 cursor-pointer"
                  />
                  <span className={`text-sm font-body ${isSelected ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)]"} transition-colors flex-1`}>{b}</span>
                  <span className="text-xs text-[var(--muted)] font-body">({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Price (Amazon style checkboxes + custom inputs) */}
        <FilterSection title="Price">
          <div className="space-y-2">
            {[
              { label: "All Prices", range: [0, 20000] as [number, number] },
              { label: "Under ₹999", range: [0, 999] as [number, number] },
              { label: "₹1,000 - ₹2,999", range: [1000, 2999] as [number, number] },
              { label: "₹3,000 - ₹4,999", range: [3000, 4999] as [number, number] },
              { label: "₹5,000 & Above", range: [5000, 20000] as [number, number] },
            ].map(p => {
              const isActive = priceRange[0] === p.range[0] && priceRange[1] === p.range[1];
              return (
                <label key={p.label} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="priceRangeRadio"
                    checked={isActive}
                    onChange={() => setPriceRange(p.range)}
                    className="h-4 w-4 rounded-full border-[var(--border)] accent-[var(--rose)] cursor-pointer"
                  />
                  <span className={`text-sm font-body ${isActive ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)]"} transition-colors flex-1`}>
                    {p.label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Custom Min/Max range entry */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)]/40">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={customMin === 0 ? "" : customMin}
                onChange={e => setCustomMin(Number(e.target.value))}
                className="w-full pl-5 pr-1 py-1 rounded-lg border border-[var(--border)] text-xs font-body focus:outline-none focus:border-[var(--rose)]"
              />
            </div>
            <span className="text-[10px] text-[var(--muted)]">to</span>
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={customMax === 0 ? "" : customMax}
                onChange={e => setCustomMax(Number(e.target.value))}
                className="w-full pl-5 pr-1 py-1 rounded-lg border border-[var(--border)] text-xs font-body focus:outline-none focus:border-[var(--rose)]"
              />
            </div>
            <button
              onClick={handleCustomPriceGo}
              className="px-2.5 py-1 rounded-lg bg-[var(--rose)] text-white text-xs font-body font-medium hover:bg-[var(--rose-dark)] transition-colors cursor-pointer"
            >
              Go
            </button>
          </div>
        </FilterSection>

        {/* Size */}
        <FilterSection title="Size">
          <div className="space-y-4">
            {renderSizeGroup("Apparel", ["XS", "S", "M", "L", "XL", "XXL"])}
            {renderSizeGroup("Waist (Jeans)", ["28", "30", "32", "34", "36"])}
            {renderSizeGroup("Kids", ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"])}
            {renderSizeGroup("Footwear (EU)", ["37", "38", "39", "40", "41", "42", "43", "44", "45"])}
            {renderSizeGroup("Accessories", ["Free Size"])}
          </div>
        </FilterSection>

        {/* Color (Myntra List Style) */}
        <FilterSection title="Colour">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {COLOR_OPTIONS.map(c => {
              const count = productsForColorCounts.filter(p => p.variants.some(v => v.color.toLowerCase().includes(c.name.toLowerCase()))).length;
              const isSelected = selectedColors.includes(c.name);
              const isDisabled = count === 0 && !isSelected;

              return (
                <label
                  key={c.name}
                  className={`flex items-center gap-2.5 cursor-pointer group ${isDisabled ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={isSelected}
                    onChange={() => toggleArr(selectedColors, setSelectedColors, c.name)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--rose)] disabled:opacity-40 cursor-pointer"
                  />
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-[var(--border)] shadow-sm shrink-0"
                    style={{ background: c.hex }}
                  />
                  <span className={`text-sm font-body ${isSelected ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)]"} transition-colors flex-1`}>
                    {c.name}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-body">({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Discount Range (Myntra style) */}
        <FilterSection title="Discount Range" defaultOpen={false}>
          <div className="space-y-2">
            {[0, 10, 20, 30, 50].map(d => {
              const label = d === 0 ? "All Products" : `${d}% and above`;
              const count = productsForDiscountCounts.filter(p => {
                const discount = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100) : 0;
                return discount >= d;
              }).length;

              return (
                <label key={d} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="discountRadio"
                    checked={minDiscount === d}
                    onChange={() => setMinDiscount(d)}
                    className="h-4 w-4 rounded-full border-[var(--border)] accent-[var(--rose)] cursor-pointer"
                  />
                  <span className={`text-sm font-body ${minDiscount === d ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] group-hover:text-[var(--charcoal)]"} transition-colors flex-1`}>
                    {label}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-body">({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Customer Ratings (Amazon Star style) */}
        <FilterSection title="Customer Ratings" defaultOpen={false}>
          <div className="space-y-2.5">
            {[4.5, 4.0, 3.5, 3.0].map(r => {
              const isActive = minRating === r;

              return (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? 0 : r)}
                  className={`flex items-center gap-2 text-sm font-body w-full py-0.5 text-left transition-colors cursor-pointer group ${
                    isActive ? "text-[var(--rose)] font-medium" : "text-[var(--charcoal-mid)] hover:text-[var(--charcoal)]"
                  }`}
                >
                  <div className="flex items-center gap-0.5 text-[var(--gold)] text-base">
                    {[1, 2, 3, 4, 5].map(star => {
                      if (star <= Math.floor(r)) {
                        return <span key={star}>★</span>;
                      } else if (star - 0.5 === r) {
                        return <span key={star} className="text-xs font-semibold">½</span>;
                      } else {
                        return <span key={star} className="opacity-30">★</span>;
                      }
                    })}
                  </div>
                  <span className="text-xs font-body text-[var(--charcoal-mid)]">& Up</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      </aside>
    );
  };

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
          <div
            className={`hidden lg:block transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
              showSidebar ? "w-64 opacity-100 mr-8" : "w-0 opacity-0 mr-0"
            }`}
          >
            <div className="w-64 sticky top-24 bg-white rounded-2xl p-6 shadow-sm border border-[var(--border)]/40">
              {renderFilterPanel()}
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

              {/* Desktop filter toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] text-sm font-body font-medium text-[var(--charcoal)] bg-white hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors shadow-sm cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showSidebar ? "Hide Filters" : "Show Filters"}
              </button>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-full border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/20 focus:border-[var(--rose)] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--cream-dark)] text-[var(--muted)] hover:text-[var(--charcoal)] transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

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
                  onChange={e => handleFilterChange("sort", e.target.value)}
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
                    {c} <button onClick={() => handleFilterChange("category", c)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedBrands.map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-xs font-body font-medium">
                    {b} <button onClick={() => handleFilterChange("brand", b)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedSizes.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--charcoal)]/10 text-[var(--charcoal)] text-xs font-body font-medium">
                    Size: {s} <button onClick={() => toggleArr(selectedSizes, setSelectedSizes, s)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedColors.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold)]/15 text-[var(--charcoal)] text-xs font-body font-medium">
                    {c} <button onClick={() => toggleArr(selectedColors, setSelectedColors, c)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {selectedGenders.map(g => (
                  <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-xs font-body font-medium capitalize">
                    {g} <button onClick={() => handleFilterChange("gender", g)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {minDiscount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-xs font-body font-medium">
                    Min Discount: {minDiscount}% <button onClick={() => setMinDiscount(0)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 20000) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/10 text-[var(--rose)] text-xs font-body font-medium">
                    ₹{priceRange[0]} - ₹{priceRange[1]} <button onClick={() => setPriceRange([0, 20000])} className="cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
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
              <div className={`grid gap-4 md:gap-6 transition-all duration-300 ${
                viewMode === "list"
                  ? "grid-cols-1"
                  : showSidebar
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4"
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
            {renderFilterPanel()}
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
