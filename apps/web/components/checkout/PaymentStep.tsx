"use client";
import { useState } from "react";
import { ChevronLeft, Truck, CreditCard, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { useCartStore, cartTotal, groupByVendor } from "@/lib/stores/cart.store";
import type { Address } from "@/lib/stores/address.store";
import type { OrderResult } from "./CheckoutClient";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

interface Props {
  address:         Address;
  payment:         "cod" | "card";
  onPaymentChange: (p: "cod" | "card") => void;
  onBack:          () => void;
  onSuccess:       (r: OrderResult) => void;
}

export default function PaymentStep({ address, payment, onPaymentChange, onBack, onSuccess }: Props) {
  const { items, coupon, clearCart } = useCartStore();
  const totals   = cartTotal(items, coupon);
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    setPlacing(true);

    // Build fulfillments for multi-vendor split
    const fulfillments = groupByVendor(items).map((g) => ({
      vendorId:   g.vendorId,
      vendorName: g.vendorName,
      items:      g.items.map((i) => ({
        productId: i.productId, name: i.name, sku: i.sku,
        price: i.price, quantity: i.quantity, size: i.size, color: i.color,
      })),
      subtotal: g.subtotal,
      delivery: g.delivery,
    }));

    // POST to API (backend integration point)
    const orderNumber = `SH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('stylehub-token') : null;
      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ address, paymentMethod: payment, fulfillments, coupon, totals }),
      });
      const data = await res.json();

      if (data.success) {
        if (typeof window !== "undefined") {
          const storedOrders = localStorage.getItem("stylehub-placed-orders") || "[]";
          try {
            const orders = JSON.parse(storedOrders);
            const newOrder = {
              orderId: data.orderId,
              orderNumber: data.orderNumber,
              placedAt: new Date().toISOString(),
              address,
              paymentMethod: payment,
              totals,
              items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                image: item.image,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                sku: item.sku,
              })),
            };
            orders.unshift(newOrder);
            localStorage.setItem("stylehub-placed-orders", JSON.stringify(orders));
          } catch (e) {
            console.error("Failed to store order in local storage:", e);
          }
        }

        clearCart();
        onSuccess({
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          placedAt: new Date().toISOString(),
          address,
          paymentMethod: payment,
        });
      } else {
        alert(data.message || "Failed to place order.");
        setPlacing(false);
      }
    } catch (err) {
      alert("Failed to connect to order server.");
      setPlacing(false);
    }
  };

  const renderPaymentCard = (id: "cod" | "card", title: string, desc: string, Icon: React.FC<{ className?: string }>) => (
    <div
      onClick={() => onPaymentChange(id)}
      className={`p-5 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
        payment === id
          ? "border-[var(--rose)] bg-[var(--rose)]/5 shadow-sm"
          : "border-[var(--border)] bg-white hover:border-[var(--rose)]/40"
      }`}
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
        payment === id ? "bg-[var(--rose)] text-white" : "bg-[var(--cream-dark)] text-[var(--charcoal-mid)]"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-body font-semibold text-[var(--charcoal)]">{title}</p>
        <p className="text-xs font-body text-[var(--muted)]">{desc}</p>
      </div>
      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
        payment === id ? "border-[var(--rose)]" : "border-[var(--border)]"
      }`}>
        {payment === id && <div className="h-2.5 w-2.5 rounded-full bg-[var(--rose)]" />}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Payment options */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">Payment Method</h2>

        {renderPaymentCard("cod",  "Cash on Delivery",   "Pay when your order arrives. No extra charges.", Truck)}
        {renderPaymentCard("card", "Credit / Debit Card", "Powered by Stripe. 256-bit SSL encrypted.", CreditCard)}

        {/* Card form (placeholder for Stripe Elements) */}
        {payment === "card" && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-[var(--muted)]" />
              <span className="text-xs font-body text-[var(--muted)]">Secure card entry (Stripe)</span>
            </div>
            {[
              { label: "Card Number",   placeholder: "4242 4242 4242 4242", type: "text"  },
              { label: "Cardholder Name", placeholder: "Priya Sharma",     type: "text"  },
            ].map(({ label, placeholder, type }) => (
              <div key={label}>
                <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">{label}</label>
                <input type={type} placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] placeholder-[var(--muted)]" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Expiry (MM/YY)</label>
                <input type="text" placeholder="12/27"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] placeholder-[var(--muted)]" />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">CVV</label>
                <input type="password" placeholder="•••"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] placeholder-[var(--muted)]" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs font-body text-[var(--muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Your card details are encrypted and never stored on our servers
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 pt-1">
          {["🔒 SSL Secured", "✓ No Hidden Fees", "🔄 Easy Refunds"].map((t) => (
            <span key={t} className="text-xs font-body text-[var(--muted)] px-3 py-1.5 bg-white border border-[var(--border)] rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Final summary */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm sticky top-24 space-y-4">
          <h3 className="font-display text-lg font-medium text-[var(--charcoal)]">Pay Summary</h3>

          <div className="space-y-2 text-sm font-body">
            {[
              { label: "Subtotal",         value: fmt(totals.subtotal) },
              ...(totals.discount > 0 ? [{ label: "Discount", value: `-${fmt(totals.discount)}` }] : []),
              { label: "GST (18%)",        value: fmt(totals.tax) },
              { label: "Delivery",         value: totals.delivery === 0 ? "FREE" : fmt(totals.delivery) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[var(--charcoal-mid)]">
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
            <div className="h-px bg-[var(--border)]" />
            <div className="flex justify-between font-bold text-base text-[var(--charcoal)]">
              <span>Total</span>
              <span className="text-[var(--rose)]">{fmt(totals.total)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onBack}
              className="flex-none px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-body text-[var(--charcoal-mid)] hover:bg-[var(--cream-dark)] transition-colors flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="flex-1 py-3 rounded-xl bg-[var(--rose)] text-white text-sm font-body font-bold hover:bg-[var(--rose-dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {placing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
              ) : (
                `Place Order • ${fmt(totals.total)}`
              )}
            </button>
          </div>
          <p className="text-[10px] font-body text-[var(--muted)] text-center">
            By placing your order you agree to StyleHub's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
