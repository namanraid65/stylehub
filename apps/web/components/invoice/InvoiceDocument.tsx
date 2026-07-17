/**
 * InvoiceDocument.tsx
 * @react-pdf/renderer document — NOT a Next.js page.
 * Must be dynamically imported with ssr: false.
 */
import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";
import type { OrderResult } from "@/components/checkout/CheckoutClient";

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 9, color: "#2C2828", padding: 36, backgroundColor: "#FAF7F2" },
  // Header
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  logo:         { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#2C2828" },
  logoSpan:     { color: "#B5536A" },
  invoiceLabel: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#B5536A", textAlign: "right" },
  invoiceSub:   { fontSize: 8, color: "#9A8F8F", textAlign: "right", marginTop: 2 },
  // Divider
  divider:      { borderBottomWidth: 1, borderBottomColor: "#E8DDD5", marginVertical: 12 },
  thickDivider: { borderBottomWidth: 2, borderBottomColor: "#B5536A", marginVertical: 12 },
  // Grid 2-col
  row2:         { flexDirection: "row", gap: 16, marginBottom: 16 },
  box:          { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 6, padding: 12, borderWidth: 1, borderColor: "#E8DDD5" },
  boxTitle:     { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#9A8F8F", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  boxLine:      { fontSize: 9, color: "#2C2828", lineHeight: 1.5 },
  // Table
  tableHeader:  { flexDirection: "row", backgroundColor: "#2C2828", borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 4 },
  tableHCell:   { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  tableRow:     { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#F3EDE3" },
  tableRowAlt:  { backgroundColor: "#F9F5F0" },
  tableCell:    { color: "#2C2828", fontSize: 8.5 },
  // Totals
  totalsBox:    { backgroundColor: "#FFFFFF", borderRadius: 6, padding: 14, borderWidth: 1, borderColor: "#E8DDD5", marginTop: 12, width: "50%", alignSelf: "flex-end" },
  totalsRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel:  { color: "#5A5252", fontSize: 8.5 },
  totalsValue:  { color: "#2C2828", fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  grandRow:     { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: "#B5536A" },
  grandLabel:   { color: "#B5536A", fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandValue:   { color: "#B5536A", fontSize: 11, fontFamily: "Helvetica-Bold" },
  // Footer
  footer:       { marginTop: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  footerLeft:   { fontSize: 7.5, color: "#9A8F8F", lineHeight: 1.6 },
  footerRight:  { fontSize: 7.5, color: "#9A8F8F", textAlign: "right" },
  thanks:       { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#B5536A", textAlign: "center", marginTop: 16 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;

const COL_WIDTHS = { desc: "40%", sku: "16%", qty: "10%", price: "17%", total: "17%" };

interface DocProps {
  result:       OrderResult;
  items:        Array<{ name: string; sku: string; quantity: number; price: number; size: string; color: string }>;
  subtotal:     number;
  discount:     number;
  couponCode?:  string;
  tax:          number;
  delivery:     number;
  total:        number;
}

export default function InvoiceDocument({
  result, items, subtotal, discount, couponCode, tax, delivery, total,
}: DocProps) {
  const placedAt = new Date(result.placedAt);

  return (
    <Document title={`Invoice ${result.orderNumber}`} author="StyleHub" creator="StyleHub">
      <Page size="A4" style={S.page}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <View>
            <Text style={S.logo}>Style<Text style={S.logoSpan}>Hub</Text></Text>
            <Text style={{ fontSize: 7.5, color: "#9A8F8F", marginTop: 2 }}>hello@stylehub.in · +91 98765 43210</Text>
            <Text style={{ fontSize: 7.5, color: "#9A8F8F" }}>Mumbai, Maharashtra, India · GST: 27AABCS1429B1ZB</Text>
          </View>
          <View>
            <Text style={S.invoiceLabel}>TAX INVOICE</Text>
            <Text style={S.invoiceSub}>Order: {result.orderNumber}</Text>
            <Text style={S.invoiceSub}>Date: {placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</Text>
            <Text style={S.invoiceSub}>Payment: {result.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}</Text>
          </View>
        </View>

        <View style={S.thickDivider} />

        {/* ── Bill To / Ship To ──────────────────────────────────────────────── */}
        <View style={S.row2}>
          <View style={S.box}>
            <Text style={S.boxTitle}>Bill To</Text>
            <Text style={[S.boxLine, { fontFamily: "Helvetica-Bold" }]}>{result.address.fullName}</Text>
            <Text style={S.boxLine}>{result.address.line1}</Text>
            {result.address.line2 && <Text style={S.boxLine}>{result.address.line2}</Text>}
            <Text style={S.boxLine}>{result.address.city}, {result.address.state} — {result.address.pincode}</Text>
            <Text style={S.boxLine}>📞 {result.address.phone}</Text>
          </View>
          <View style={S.box}>
            <Text style={S.boxTitle}>Ship To</Text>
            <Text style={[S.boxLine, { fontFamily: "Helvetica-Bold" }]}>{result.address.fullName}</Text>
            <Text style={S.boxLine}>{result.address.line1}</Text>
            {result.address.line2 && <Text style={S.boxLine}>{result.address.line2}</Text>}
            <Text style={S.boxLine}>{result.address.city}, {result.address.state} — {result.address.pincode}</Text>
            <Text style={[S.boxLine, { marginTop: 4, color: "#9A8F8F" }]}>Est. delivery: 5–7 business days</Text>
          </View>
        </View>

        {/* ── Items Table ────────────────────────────────────────────────────── */}
        {/* Table header */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHCell, { width: COL_WIDTHS.desc }]}>Description</Text>
          <Text style={[S.tableHCell, { width: COL_WIDTHS.sku }]}>SKU</Text>
          <Text style={[S.tableHCell, { width: COL_WIDTHS.qty, textAlign: "center" }]}>Qty</Text>
          <Text style={[S.tableHCell, { width: COL_WIDTHS.price, textAlign: "right" }]}>Unit Price</Text>
          <Text style={[S.tableHCell, { width: COL_WIDTHS.total, textAlign: "right" }]}>Total</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.sku} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
            <View style={{ width: COL_WIDTHS.desc }}>
              <Text style={[S.tableCell, { fontFamily: "Helvetica-Bold" }]}>{item.name}</Text>
              <Text style={[S.tableCell, { color: "#9A8F8F", fontSize: 7.5 }]}>{item.color} · Size {item.size}</Text>
            </View>
            <Text style={[S.tableCell, { width: COL_WIDTHS.sku, color: "#9A8F8F" }]}>{item.sku}</Text>
            <Text style={[S.tableCell, { width: COL_WIDTHS.qty, textAlign: "center" }]}>{item.quantity}</Text>
            <Text style={[S.tableCell, { width: COL_WIDTHS.price, textAlign: "right" }]}>{fmt(item.price)}</Text>
            <Text style={[S.tableCell, { width: COL_WIDTHS.total, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
              {fmt(item.price * item.quantity)}
            </Text>
          </View>
        ))}

        {/* ── Totals ────────────────────────────────────────────────────────── */}
        <View style={S.totalsBox}>
          {[
            { label: "Subtotal",              value: fmt(subtotal) },
            ...(discount > 0 ? [{ label: `Discount (${couponCode})`, value: `-${fmt(discount)}` }] : []),
            { label: "GST @ 18%",             value: fmt(tax) },
            { label: "Delivery Charges",      value: delivery === 0 ? "FREE" : fmt(delivery) },
          ].map(({ label, value }) => (
            <View key={label} style={S.totalsRow}>
              <Text style={S.totalsLabel}>{label}</Text>
              <Text style={S.totalsValue}>{value}</Text>
            </View>
          ))}
          <View style={S.grandRow}>
            <Text style={S.grandLabel}>GRAND TOTAL</Text>
            <Text style={S.grandValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <View style={[S.divider, { marginTop: 20 }]} />
        <View style={S.footer}>
          <View>
            <Text style={S.footerLeft}>Terms & Conditions</Text>
            <Text style={S.footerLeft}>• All sales are subject to StyleHub's Return Policy (15 days).</Text>
            <Text style={S.footerLeft}>• This is a computer-generated invoice and requires no signature.</Text>
            <Text style={S.footerLeft}>• For disputes, contact: support@stylehub.in</Text>
          </View>
          <View>
            <Text style={S.footerRight}>StyleHub · Mumbai, India</Text>
            <Text style={S.footerRight}>GST: 27AABCS1429B1ZB</Text>
            <Text style={S.footerRight}>www.stylehub.in</Text>
          </View>
        </View>

        <Text style={S.thanks}>Thank you for shopping with StyleHub! ✦</Text>

      </Page>
    </Document>
  );
}
