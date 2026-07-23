import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCmsPage, getActiveBlocks } from '@/lib/cms-data';
import CMSRenderer from '@/components/cms/CMSRenderer';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About StyleHub — Our Story',
  description: 'Learn about StyleHub, India\'s premium multi-vendor fashion marketplace celebrating artisan brands.',
};

const TEAM = [
  { name: 'Anika Sharma', role: 'Co-Founder & CEO', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400' },
  { name: 'Rohan Mehta',  role: 'Co-Founder & CTO', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
  { name: 'Priya Nair',   role: 'Head of Curation',  img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400' },
  { name: 'Karan Verma',  role: 'Head of Operations', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
];

const STATS = [
  { number: '38+', label: 'Curated Vendors' },
  { number: '1,200+', label: 'Products' },
  { number: '25K+', label: 'Happy Customers' },
  { number: '4.8★', label: 'Average Rating' },
];

const VALUES = [
  { icon: '🌿', title: 'Authenticity First', text: 'Every vendor is personally vetted by our curation team. No mass-produced fast fashion.' },
  { icon: '🤝', title: 'Artisan Community', text: 'We partner with small-batch creators, family workshops, and heritage craft enterprises.' },
  { icon: '♻️', title: 'Conscious Fashion', text: 'We prioritize vendors who use sustainable materials, ethical labour, and eco-friendly packaging.' },
  { icon: '🛡️', title: 'Buyer Protection', text: 'Every purchase is backed by our 15-day return policy and dedicated customer support.' },
];

export default async function AboutPage() {
  const page = await fetchCmsPage('about');
  const activeBlocks = page ? getActiveBlocks(page) : [];

  if (activeBlocks.length > 0) {
    return <CMSRenderer blocks={activeBlocks} />;
  }

  return (

    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-[50vh] min-h-[340px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400"
          alt="StyleHub — About Us"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-body tracking-widest mb-4">OUR STORY</span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white">Built for Indian Fashion</h1>
          <p className="text-white/80 text-base font-body mt-3 max-w-xl">
            Celebrating artisan brands, heritage crafts, and the designers shaping tomorrow's style.
          </p>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--charcoal)]">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ number, label }) => (
            <div key={label}>
              <p className="font-display text-3xl font-semibold text-[var(--gold)]">{number}</p>
              <p className="text-white/60 text-xs font-body mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Story Section ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl font-medium text-[var(--charcoal)] mb-5">Who We Are</h2>
            <div className="space-y-4 text-[var(--charcoal-mid)] font-body leading-relaxed text-sm">
              <p>
                StyleHub is India's premium multi-vendor fashion marketplace, founded in 2023 with a single mission: to connect discerning shoppers with the country's finest artisan brands and boutique fashion labels.
              </p>
              <p>
                We hand-curate every vendor on our platform, ensuring authenticity, quality craftsmanship, and a seamless shopping experience from discovery to delivery.
              </p>
              <p>
                We believe Indian fashion deserves a global stage. From Jaipur's master embroiderers to Chennai's filigree jewellers, every piece on StyleHub carries a story — and we're here to help you discover it.
              </p>
            </div>
          </div>
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=800"
              alt="Artisan workshop"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* ── Values ───────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--cream)] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-medium text-[var(--charcoal)]">Our Values</h2>
            <p className="text-sm font-body text-[var(--muted)] mt-2">What guides every decision we make</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon, title, text }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-[var(--border)] hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-4">{icon}</span>
                <h3 className="font-display font-medium text-[var(--charcoal)] mb-2">{title}</h3>
                <p className="text-xs font-body text-[var(--muted)] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-medium text-[var(--charcoal)]">Meet the Team</h2>
          <p className="text-sm font-body text-[var(--muted)] mt-2">The people behind StyleHub</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TEAM.map(({ name, role, img }) => (
            <div key={name} className="text-center">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-md">
                <Image src={img} alt={name} fill className="object-cover" />
              </div>
              <p className="font-body font-semibold text-sm text-[var(--charcoal)]">{name}</p>
              <p className="font-body text-xs text-[var(--muted)] mt-0.5">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[var(--rose)] to-[#9B4DCA] py-16">
        <div className="max-w-xl mx-auto px-6 text-center text-white">
          <h2 className="font-display text-3xl font-medium mb-3">Start Shopping</h2>
          <p className="font-body text-white/80 text-sm mb-6">Discover thousands of handpicked fashion pieces from India's finest artisans.</p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 rounded-full bg-white text-[var(--rose)] font-body font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            Explore the Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
