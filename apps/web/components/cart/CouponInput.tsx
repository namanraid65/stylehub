"use client";
import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { useCartStore, type AppliedCoupon } from "@/lib/stores/cart.store";

const MOCK_COUPONS: Record<string, AppliedCoupon> = {
  STYLE10:  { code: "STYLE10",  type: "percent", value: 10, maxDiscount: 1000, description: "10% off (max ₹1,000)" },
  FLAT200:  { code: "FLAT200",  type: "fixed",   value: 200,                   description: "₹200 flat off" },
  WELCOME50:{ code: "WELCOME50",type: "percent", value: 50, maxDiscount: 500,  description: "50% off (max ₹500)" },
  FREESHIP: { code: "FREESHIP", type: "fixed",   value: 198,                   description: "Free delivery on all vendors" },
};

export default function CouponInput() {
  const { coupon, applyCoupon, removeCoupon } = useCartStore();
  const [code,    setCode]    = useState("");
  const [status,  setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (coupon) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold text-emerald-700">{coupon.code}</p>
          <p className="text-xs font-body text-emerald-600">{coupon.description}</p>
        </div>
        <button onClick={removeCoupon} className="text-emerald-500 hover:text-red-500 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setStatus("loading");

    // Simulate API call (replace with: POST /api/coupons/validate)
    await new Promise((r) => setTimeout(r, 800));

    const found = MOCK_COUPONS[trimmed];
    if (found) {
      applyCoupon(found);
      setStatus("success");
      setMessage(found.description);
    } else {
      setStatus("error");
      setMessage("Invalid or expired coupon code.");
    }
    setTimeout(() => {
      if (status !== "success") setStatus("idle");
    }, 3000);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setStatus("idle"); setMessage(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="w-full pl-9 pr-3 py-2.5 text-sm font-body border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--rose)] uppercase tracking-wider bg-white"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={status === "loading" || !code.trim()}
          className="px-4 py-2.5 rounded-lg bg-[var(--charcoal)] text-white text-sm font-body font-medium hover:bg-[var(--rose)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </div>

      {/* Available coupons hint */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(MOCK_COUPONS).map((c) => (
          <button
            key={c}
            onClick={() => setCode(c)}
            className="text-[10px] font-body font-semibold px-2 py-0.5 rounded border border-dashed border-[var(--rose)]/40 text-[var(--rose)] hover:bg-[var(--rose)]/5 transition-colors tracking-wider"
          >
            {c}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-xs font-body ${status === "error" ? "text-red-500" : "text-emerald-600"}`}>
          {status === "error" ? "✗" : "✓"} {message}
        </p>
      )}
    </div>
  );
}
