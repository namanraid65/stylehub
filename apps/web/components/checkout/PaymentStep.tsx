"use client";
import { useState } from "react";
import { ChevronLeft, Truck, CreditCard, Lock, ShieldCheck, Loader2, QrCode, Coins } from "lucide-react";
import { useCartStore, cartTotal, groupByVendor } from "@/lib/stores/cart.store";
import { useWalletStore } from "@/lib/stores/wallet.store";
import UpiQrModal from "./UpiQrModal";
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
  const { balance, isApplied, appliedAmount, toggleApply, resetWallet } = useWalletStore();
  
  const rawTotals = cartTotal(items, coupon);
  const walletDiscount = isApplied ? Math.min(appliedAmount, rawTotals.total) : 0;
  const finalPayableTotal = Math.max(0, rawTotals.total - walletDiscount);

  const [placing, setPlacing] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const placeOrder = async () => {
    await executeOrderPlacement();
  };


  const executeOrderPlacement = async () => {
    setPlacing(true);

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

    const finalTotals = {
      ...rawTotals,
      walletDiscount,
      total: finalPayableTotal,
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
      // Try multiple token sources: direct key, Zustand persisted auth store
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('stylehub-token');
        if (!token) {
          try {
            const stored = localStorage.getItem('stylehub-auth');
            if (stored) {
              const parsed = JSON.parse(stored);
              token = parsed?.state?.accessToken ?? null;
            }
          } catch { /* ignore parse errors */ }
        }
      }
      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ address, paymentMethod: payment, fulfillments, coupon, totals: finalTotals }),
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
              totals: finalTotals,
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

        resetWallet();
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
        <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">Select Payment Method</h2>

        {renderPaymentCard("cod",  "Cash on Delivery",   "Pay when your order arrives. No extra charges.", Truck)}
        {renderPaymentCard("card", "Credit / Debit Card", "Powered by Stripe. 256-bit SSL encrypted.", CreditCard)}


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
            <div className="flex justify-between text-[var(--charcoal-mid)]">
              <span>Subtotal</span><span>{fmt(rawTotals.subtotal)}</span>
            </div>
            {rawTotals.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Coupon Discount</span><span>-{fmt(rawTotals.discount)}</span>
              </div>
            )}
            {walletDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-semibold">
                <span>StyleCoins Redeemed</span><span>-{fmt(walletDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--charcoal-mid)]">
              <span>GST (18%)</span><span>{fmt(rawTotals.tax)}</span>
            </div>
            <div className="flex justify-between text-[var(--charcoal-mid)]">
              <span>Delivery</span><span>{rawTotals.delivery === 0 ? "FREE" : fmt(rawTotals.delivery)}</span>
            </div>

            <div className="h-px bg-[var(--border)]" />
            <div className="flex justify-between font-bold text-base text-[var(--charcoal)]">
              <span>Total Payable</span>
              <span className="text-[var(--rose)]">{fmt(finalPayableTotal)}</span>
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
                `Place Order • ${fmt(finalPayableTotal)}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* UPI QR Modal Trigger */}
      <UpiQrModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        onPaymentSuccess={async () => {
          setShowUpiModal(false);
          await executeOrderPlacement();
        }}
        totalAmount={finalPayableTotal}
      />
    </div>
  );
}
