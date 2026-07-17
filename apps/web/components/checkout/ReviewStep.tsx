"use client";
import Image from "next/image";
import { ChevronLeft, Store, MapPin } from "lucide-react";
import { useCartStore, cartTotal, groupByVendor } from "@/lib/stores/cart.store";
import type { Address } from "@/lib/stores/address.store";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

interface Props { address: Address; onBack: () => void; onNext: () => void; }

export default function ReviewStep({ address, onBack, onNext }: Props) {
  const { items, coupon } = useCartStore();
  const groups            = groupByVendor(items);
  const totals            = cartTotal(items, coupon);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Order details */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">Review Your Order</h2>

        {/* Delivery address summary */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-[var(--rose)]" />
            <h3 className="text-sm font-body font-semibold text-[var(--charcoal)]">Delivering to</h3>
          </div>
          <p className="text-sm font-body font-semibold text-[var(--charcoal)]">{address.fullName}</p>
          <p className="text-xs font-body text-[var(--charcoal-mid)] mt-0.5 leading-relaxed">
            {address.line1}{address.line2 ? `, ${address.line2}` : ""},{" "}
            {address.city}, {address.state} — {address.pincode}
          </p>
          <p className="text-xs font-body text-[var(--muted)] mt-1">📞 {address.phone}</p>
          <button onClick={onBack} className="text-xs font-body text-[var(--rose)] hover:underline mt-2">Change address</button>
        </div>

        {/* Items by vendor */}
        {groups.map((group) => (
          <div key={group.vendorId} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--cream)]">
              <Store className="h-4 w-4 text-[var(--rose)]" />
              <span className="text-sm font-body font-semibold text-[var(--charcoal)]">{group.vendorName}</span>
              <span className="ml-auto text-xs font-body text-[var(--muted)]">Est. delivery: 5-7 days</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {group.items.map((item) => (
                <div key={item.sku} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-[var(--cream-dark)] shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-[var(--charcoal)] line-clamp-1">{item.name}</p>
                    <p className="text-xs font-body text-[var(--muted)] mt-0.5">
                      {item.color} · {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-body font-semibold text-[var(--charcoal)] shrink-0">
                    {fmt(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--cream)] flex justify-between text-xs font-body text-[var(--muted)]">
              <span>Delivery</span>
              <span className={group.delivery === 0 ? "text-emerald-600 font-medium" : ""}>
                {group.delivery === 0 ? "FREE" : fmt(group.delivery)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Price summary */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm sticky top-24 space-y-4">
          <h3 className="font-display text-lg font-medium text-[var(--charcoal)]">Price Summary</h3>
          <div className="space-y-2.5 text-sm font-body">
            {[
              { label: "Subtotal",   value: fmt(totals.subtotal),    cls: "" },
              ...(totals.discount > 0 ? [{ label: `Coupon (${coupon!.code})`, value: `-${fmt(totals.discount)}`, cls: "text-emerald-600" }] : []),
              { label: "GST (18%)", value: fmt(totals.tax),         cls: "" },
              { label: "Delivery",  value: totals.delivery === 0 ? "FREE" : fmt(totals.delivery), cls: totals.delivery === 0 ? "text-emerald-600 font-medium" : "" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex justify-between text-[var(--charcoal-mid)]">
                <span>{label}</span>
                <span className={cls}>{value}</span>
              </div>
            ))}
            <div className="h-px bg-[var(--border)]" />
            <div className="flex justify-between font-semibold text-base text-[var(--charcoal)]">
              <span>Total Payable</span>
              <span>{fmt(totals.total)}</span>
            </div>
            {totals.discount > 0 && (
              <p className="text-xs text-emerald-600 font-body text-center">You save {fmt(totals.discount)} 🎉</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-body text-[var(--charcoal-mid)] hover:bg-[var(--cream-dark)] transition-colors flex items-center justify-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={onNext}
              className="flex-1 py-3 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] transition-colors">
              To Payment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
