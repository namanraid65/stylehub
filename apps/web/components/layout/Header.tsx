"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Heart, User, Menu, X, Coins } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import { useWishlistStore } from "@/lib/stores/wishlist.store";
import { useWalletStore } from "@/lib/stores/wallet.store";
import NotificationBell from "@/components/notifications/NotificationBell";

const NAV = [
  { label: "Men",          href: "/products?gender=men" },
  { label: "Women",        href: "/products?gender=women" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Dresses",      href: "/products?category=dresses" },
  { label: "Ethnic Wear",  href: "/products?category=ethnic" },
  { label: "Footwear",     href: "/products?category=footwear" },
  { label: "Vendors",      href: "/vendors" },
];

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearch]   = useState(false);
  const [query, setQuery]         = useState("");
  const [mounted, setMounted]     = useState(false);

  const cartCount     = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const walletBalance = useWalletStore((s) => s.balance);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setSearch(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[var(--charcoal)] text-white text-xs text-center py-2 tracking-widest font-body">
        FREE SHIPPING ON ORDERS ABOVE ₹1999 &nbsp;·&nbsp; USE CODE <span className="text-[var(--gold)]" >STYLE10</span> FOR 10% OFF
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-[var(--border)]"
            : "bg-[var(--cream)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="font-display text-2xl font-semibold text-[var(--charcoal)] tracking-tight">
                Style<span className="text-[var(--rose)]">Hub</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-body text-[var(--charcoal-mid)] hover:text-[var(--rose)] transition-colors tracking-wide"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">


              {/* Search toggle */}
              <button
                onClick={() => setSearch(!searchOpen)}
                className="p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-[var(--charcoal)]" />
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors">
                <Heart className="h-5 w-5 text-[var(--charcoal)]" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-[var(--rose)] text-white text-[9px] flex items-center justify-center font-semibold">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors">
                <ShoppingBag className="h-5 w-5 text-[var(--charcoal)]" />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-[var(--rose)] text-white text-[9px] flex items-center justify-center font-semibold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* User */}
              <Link href="/account" className="hidden sm:flex p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors">
                <User className="h-5 w-5 text-[var(--charcoal)]" />
              </Link>


              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className={`overflow-hidden transition-all duration-300 ${
            searchOpen ? "max-h-16 pb-3" : "max-h-0"
          }`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search dresses, kurtas, heels…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--cream-dark)] border border-[var(--border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--rose)]/30 font-body"
              />
            </div>
          </form>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden border-t border-[var(--border)] overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-96" : "max-h-0"
        } bg-white`}>
          <nav className="px-4 py-4 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-3 text-sm font-body text-[var(--charcoal)] hover:text-[var(--rose)] hover:bg-[var(--cream)] rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
