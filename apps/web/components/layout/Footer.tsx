import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[var(--charcoal)] text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl font-medium">Stay in style.</h3>
              <p className="text-white/60 text-sm mt-1 font-body">New arrivals, exclusive deals, and style inspiration — delivered to you.</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--rose-light)] font-body"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[var(--rose)] hover:bg-[var(--rose-dark)] text-white text-sm font-medium transition-colors shrink-0 font-body"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-2xl font-semibold">
              Style<span className="text-[var(--rose-light)]">Hub</span>
            </span>
            <p className="text-white/50 text-sm mt-3 font-body leading-relaxed">
              India's premium multi-vendor fashion marketplace. Handpicked artisan brands, delivered to your door.
            </p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-full bg-white/10 hover:bg-[var(--rose)] transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-body font-semibold text-white/90 text-sm uppercase tracking-widest mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { label: "New Arrivals", href: "/products?sort=newest" },
                { label: "Dresses",      href: "/products?category=dresses" },
                { label: "Ethnic Wear",  href: "/products?category=ethnic" },
                { label: "Footwear",     href: "/products?category=footwear" },
                { label: "Accessories",  href: "/products?category=accessories" },
                { label: "Sale",         href: "/products" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/50 hover:text-white text-sm transition-colors font-body">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body font-semibold text-white/90 text-sm uppercase tracking-widest mb-4">Help</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-white/50 hover:text-white text-sm transition-colors font-body">About Us</Link></li>
              <li><Link href="/returns" className="text-white/50 hover:text-white text-sm transition-colors font-body">Returns & Refunds</Link></li>
              <li><Link href="/contact" className="text-white/50 hover:text-white text-sm transition-colors font-body">Contact Us</Link></li>
              <li><Link href="/vendors/register" className="text-white/50 hover:text-white text-sm transition-colors font-body">Sell on StyleHub</Link></li>
              <li><Link href="/faq" className="text-white/50 hover:text-white text-sm transition-colors font-body">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-body font-semibold text-white/90 text-sm uppercase tracking-widest mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-white/50 text-sm font-body"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-[var(--rose-light)]" />hello@stylehub.in</li>
              <li className="flex items-start gap-2 text-white/50 text-sm font-body"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-[var(--rose-light)]" />+91 98765 43210</li>
              <li className="flex items-start gap-2 text-white/50 text-sm font-body"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[var(--rose-light)]" />Mumbai, Maharashtra, India</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/40 text-xs font-body">© 2026 StyleHub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="text-white/40 hover:text-white/70 text-xs transition-colors font-body">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-white/40 hover:text-white/70 text-xs transition-colors font-body">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
