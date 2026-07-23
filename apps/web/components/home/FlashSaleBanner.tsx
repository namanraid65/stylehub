"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, ArrowRight, Flame, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export default function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });
  const [dismissed, setDismissed] = useState(false);
  const [activeDiscount, setActiveDiscount] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkActiveSale = async () => {
      try {
        // 1. Check if Flash Sale Banner was explicitly disabled by Admin
        if (typeof window !== 'undefined') {
          const bannerEnabled = localStorage.getItem('stylehub_flash_banner_active');
          if (bannerEnabled === 'false') {
            setActiveDiscount(null);
            setHasChecked(true);
            return;
          }

          const saved = localStorage.getItem('stylehub_admin_discounts_state');
          if (saved) {
            try {
              const list: any[] = JSON.parse(saved);
              const active = list.find((d) => d.isActive);
              if (!active) {
                setActiveDiscount(null);
                setHasChecked(true);
                return;
              } else {
                setActiveDiscount(active);
                setHasChecked(true);
                return;
              }
            } catch {}
          }
        }


        // 2. Fetch active campaign from API
        const res = await fetch(`${API}/discounts?activeOnly=true`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setActiveDiscount(json.data[0]);
          } else {
            setActiveDiscount(null);
          }
        }
      } catch (err) {
        console.error("Failed to check active discount campaign:", err);
      } finally {
        setHasChecked(true);
      }
    };
    checkActiveSale();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hide banner completely if dismissed or if Admin turned off all discount campaigns
  if (dismissed || (hasChecked && !activeDiscount)) return null;

  const formatDigit = (num: number) => String(num).padStart(2, "0");

  const title = activeDiscount?.title || "Flat 30% OFF Storewide & New Drops";
  const badgeText = activeDiscount?.badgeText || "Limited Time Festive Flash Sale";
  const discountVal = activeDiscount ? (activeDiscount.discountType === 'percent' ? `${activeDiscount.discountValue}% OFF` : `₹${activeDiscount.discountValue} OFF`) : "30% OFF";

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-rose-950 text-white rounded-2xl p-6 md:p-8 my-8 shadow-xl border border-rose-900/30">
      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 z-20 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 p-1.5 rounded-full transition"
        title="Close Sale Banner"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 pr-6">
        {/* Left Info */}
        <div className="space-y-2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold uppercase tracking-wider border border-rose-500/30">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            {badgeText}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
            {title} — <span className="text-rose-400">{discountVal}</span>
          </h2>
          <p className="text-neutral-300 text-sm max-w-xl">
            Applied automatically at checkout for all boutique collections. Hurry, stock is selling out fast!
          </p>

          {/* Stock Scarcity Bar */}
          <div className="pt-2 max-w-sm">
            <div className="flex justify-between text-xs text-neutral-300 mb-1">
              <span>Claimed: 84%</span>
              <span className="text-amber-400 font-medium">⚡ Only 16 items left!</span>
            </div>
            <div className="w-full bg-neutral-700/60 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-2 rounded-full w-[84%] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Timer & CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-sm p-3 rounded-xl border border-neutral-700/50">
            <Clock className="w-5 h-5 text-amber-400 mr-1" />
            <div className="text-center">
              <div className="bg-neutral-800 text-amber-300 text-xl font-mono font-bold px-2.5 py-1 rounded">
                {formatDigit(timeLeft.hours)}
              </div>
              <span className="text-[10px] text-neutral-400 uppercase">Hours</span>
            </div>
            <span className="text-amber-400 font-bold text-lg">:</span>
            <div className="text-center">
              <div className="bg-neutral-800 text-amber-300 text-xl font-mono font-bold px-2.5 py-1 rounded">
                {formatDigit(timeLeft.minutes)}
              </div>
              <span className="text-[10px] text-neutral-400 uppercase">Mins</span>
            </div>
            <span className="text-amber-400 font-bold text-lg">:</span>
            <div className="text-center">
              <div className="bg-rose-950 text-rose-300 text-xl font-mono font-bold px-2.5 py-1 rounded border border-rose-500/30">
                {formatDigit(timeLeft.seconds)}
              </div>
              <span className="text-[10px] text-neutral-400 uppercase">Secs</span>
            </div>
          </div>

          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-rose-600/30 text-sm whitespace-nowrap"
          >
            Shop Sale Deals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
