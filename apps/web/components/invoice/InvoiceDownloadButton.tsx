"use client";
/**
 * InvoiceDownloadButton.tsx
 * Must be dynamically imported with { ssr: false } — @react-pdf/renderer
 * cannot run during SSR in Next.js App Router.
 */
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import InvoiceDocument from "./InvoiceDocument";
import type { OrderResult } from "@/components/checkout/CheckoutClient";

// Bring in cart totals — by the time this renders, cart is already cleared.
// We receive totals via props from the parent (OrderConfirmation passes them in).
interface Props {
  result:   OrderResult;
  // These are passed from the parent who reads the store before clearing
  items?:   Array<{ name: string; sku: string; quantity: number; price: number; size: string; color: string }>;
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  tax?:      number;
  delivery?: number;
  total?:    number;
}

export default function InvoiceDownloadButton({
  result,
  items       = [],
  subtotal    = 0,
  discount    = 0,
  couponCode  = "",
  tax         = 0,
  delivery    = 0,
  total       = 0,
}: Props) {
  const docProps = { result, items, subtotal, discount, couponCode, tax, delivery, total };

  return (
    <PDFDownloadLink
      document={<InvoiceDocument {...docProps} />}
      fileName={`StyleHub-Invoice-${result.orderNumber}.pdf`}
      className="flex-1"
    >
      {({ loading }) => (
        <button
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--rose)] text-[var(--rose)] text-sm font-body font-semibold hover:bg-[var(--rose)] hover:text-white transition-all disabled:opacity-50"
          disabled={loading}
        >
          <Download className="h-4 w-4" />
          {loading ? "Preparing PDF…" : "Download Invoice"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
