import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "StyleHub — Premium Fashion Marketplace",
  description:
    "Discover handpicked fashion from India's finest artisan vendors. Shop ethnic wear, contemporary dresses, luxury footwear, and premium accessories.",
  keywords: "fashion, ethnic wear, saree, kurta, dress, footwear, accessories, India",
  openGraph: {
    title: "StyleHub — Premium Fashion Marketplace",
    description: "Discover handpicked fashion from India's finest artisan vendors.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
