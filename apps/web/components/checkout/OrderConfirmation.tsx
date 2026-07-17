"use client";
import Link from "next/link";
import { CheckCircle2, Download, Package, ArrowRight, MapPin, Calendar, CreditCard } from "lucide-react";
import dynamic from "next/dynamic";
import type { OrderResult } from "./CheckoutClient";

// Lazy-load PDF download button (client-only library)
const InvoiceDownloadButton = dynamic(
  () => import("@/components/invoice/InvoiceDownloadButton"),
  { ssr: false, loading: () => (
    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-sm font-body text-[var(--muted)]">
      <Download className="h-4 w-4" /> Preparing Invoice…
    </button>
  )},
);

interface Props { result: OrderResult; }

export default function OrderConfirmation({ result }: Props) {
  const placedDate = new Date(result.placedAt);
  const deliveryDate = new Date(result.placedAt);
  deliveryDate.setDate(deliveryDate.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });

  // Read stored order details for invoice generation
  let orderDetails: any = null;
  if (typeof window !== "undefined") {
    const storedOrders = localStorage.getItem("stylehub-placed-orders");
    if (storedOrders) {
      try {
        const orders = JSON.parse(storedOrders);
        orderDetails = orders.find((o: any) => o.orderNumber === result.orderNumber || o.orderId === result.orderId);
      } catch (e) {
        console.error("Failed to read order details for invoice:", e);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4">
        {/* Success hero */}
        <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-8 text-center">
          {/* Animated check */}
          <div className="relative mx-auto h-20 w-20 mb-5">
            <div className="h-20 w-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </div>

          <h1 className="font-display text-3xl font-medium text-[var(--charcoal)] mb-2">Order Confirmed!</h1>
          <p className="text-sm font-body text-[var(--muted)] mb-4">
            Thank you for shopping with StyleHub. Your order has been placed and will be processed shortly.
          </p>

          {/* Order number */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cream)] rounded-full border border-[var(--border)]">
            <Package className="h-4 w-4 text-[var(--rose)]" />
            <span className="text-sm font-body font-bold text-[var(--charcoal)] tracking-wider">{result.orderNumber}</span>
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-[var(--border)]">
          {[
            {
              icon: Calendar, label: "Order Placed",
              value: fmt(placedDate),
            },
            {
              icon: Package, label: "Expected Delivery",
              value: fmt(deliveryDate),
            },
            {
              icon: MapPin, label: "Delivering to",
              value: `${result.address.line1}, ${result.address.city}`,
            },
            {
              icon: CreditCard, label: "Payment",
              value: result.paymentMethod === "cod" ? "Cash on Delivery" : "Card (Stripe)",
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <div className="h-9 w-9 rounded-full bg-[var(--cream)] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[var(--rose)]" />
              </div>
              <div>
                <p className="text-[10px] font-body font-medium text-[var(--muted)] uppercase tracking-wider">{label}</p>
                <p className="text-sm font-body font-medium text-[var(--charcoal)]">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <InvoiceDownloadButton
            result={result}
            items={orderDetails?.items ?? []}
            subtotal={orderDetails?.totals?.subtotal ?? 0}
            discount={orderDetails?.totals?.discount ?? 0}
            tax={orderDetails?.totals?.tax ?? 0}
            delivery={orderDetails?.totals?.delivery ?? 0}
            total={orderDetails?.totals?.total ?? 0}
            couponCode={orderDetails?.coupon?.code ?? ""}
          />
          <Link
            href="/products"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] transition-colors"
          >
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Confetti dots */}
        <p className="text-center text-xs font-body text-[var(--muted)]">
          A confirmation email will be sent to you shortly ✨
        </p>
      </div>
    </div>
  );
}
