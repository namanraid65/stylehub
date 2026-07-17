"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { CATEGORIES } from '@/lib/mock-data';
import type { CmsBlock } from '@/lib/cms-data';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface CMSRendererProps {
  blocks: CmsBlock[];
}

export default function CMSRenderer({ blocks }: CMSRendererProps) {
  return (
    <div className="flex flex-col w-full">
      {blocks.map((block) => {
        if (!block.isActive) return null;
        return (
          <React.Fragment key={block.id}>
            {renderBlock(block)}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function renderBlock(block: CmsBlock) {
  const data = block.data || {};

  switch (block.type) {
    case 'hero': {
      return <HeroBlock data={data} />;
    }

    case 'banner_strip': {
      const items = Array.isArray(data.items) 
        ? data.items 
        : [
            { icon: '🚚', text: 'Free Delivery above ₹1999' },
            { icon: '↩️', text: 'Easy 15-day Returns' },
            { icon: '🔒', text: '100% Authentic Products' },
            { icon: '💳', text: 'Secure Payments' }
          ];

      return (
        <section className="bg-[var(--charcoal)] text-white/90 py-5 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {items.map((item: any, i: number) => {
                const text = typeof item === 'string' ? item : item?.text;
                const icon = typeof item === 'string' ? '✨' : item?.icon;
                return (
                  <div key={i} className="flex items-center justify-center gap-3 group">
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
                    <span className="text-xs sm:text-sm font-body tracking-wider uppercase font-medium">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    case 'featured_products': {
      const title    = String(data.title    || 'Featured Products');
      const subtitle = String(data.subtitle || '');
      const filter   = String(data.filter   || 'isFeatured');
      const limit    = Number(data.limit    || 8);
      return <FeaturedProductsBlock title={title} subtitle={subtitle} filter={filter} limit={limit} />;
    }

    case 'image_grid': {
      const title = String(data.title || 'Shop by Category');
      const catsToShow = Array.isArray(data.categories) ? data.categories : [];

      const filteredCategories = catsToShow.length > 0
        ? CATEGORIES.filter(c => catsToShow.includes(c.name))
        : CATEGORIES.slice(0, 6);

      return (
        <section className="py-20 bg-[var(--cream)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-[var(--rose)] mb-3">
                Curated Collections
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-medium text-[var(--charcoal)]">
                {title}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {filteredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-white text-center">
                    <h3 className="font-display text-base font-medium leading-tight mb-1">{cat.name}</h3>
                    <p className="text-white/70 text-[10px] font-body uppercase tracking-wider">Explore</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'cta': {
      const headline = String(data.headline || 'Exclusive Offers');
      const subheadline = String(data.subheadline || '');
      const buttonLabel = String(data.buttonLabel || 'Shop Now');
      const buttonHref = String(data.buttonHref || '/products');
      const bgColor = String(data.bgColor || '#C84B31');
      const textColor = String(data.textColor || '#FFFFFF');

      return (
        <section 
          className="mx-4 sm:mx-8 md:mx-12 my-12 rounded-3xl overflow-hidden py-16 px-6 relative text-center shadow-lg"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-3xl sm:text-5xl font-light tracking-tight">
              {headline}
            </h2>
            {subheadline && (
              <p className="text-sm sm:text-base font-body opacity-95 max-w-md mx-auto leading-relaxed">
                {subheadline}
              </p>
            )}
            <div className="pt-4">
              <Link
                href={buttonHref}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-body font-semibold tracking-wide bg-white text-[var(--charcoal)] hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ color: bgColor }}
              >
                {buttonLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      );
    }

    case 'rich_text': {
      const html = String(data.html || '');
      return (
        <section className="py-16 max-w-3xl mx-auto px-6 w-full">
          <div
            className="prose prose-sm max-w-none
              prose-headings:font-display prose-headings:text-[var(--charcoal)]
              prose-h2:text-2xl prose-h3:text-xl
              prose-p:text-[var(--charcoal-mid)] prose-p:font-body prose-p:leading-relaxed
              prose-li:text-[var(--charcoal-mid)] prose-li:font-body
              prose-strong:text-[var(--charcoal)]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </section>
      );
    }

    case 'testimonials': {
      const title = String(data.title || 'What Our Customers Say');
      const testList = Array.isArray(data.testimonials)
        ? data.testimonials
        : [
            { name: 'Priya S.', location: 'Mumbai', rating: 5, text: 'The ivory anarkali is stunning! Quality is exceptional and shipping was super fast.' },
            { name: 'Ananya K.', location: 'Bengaluru', rating: 5, text: 'Finally a marketplace that curates only the best. StyleHub has become my go-to.' },
            { name: 'Meera P.', location: 'Delhi', rating: 5, text: 'The jewellery I ordered is even more beautiful in person. Packaging was lovely too.' }
          ];

      return (
        <section className="py-24 bg-[var(--charcoal)] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-[var(--gold)] mb-3">Real Stories</p>
              <h2 className="font-display text-4xl md:text-5xl font-medium text-white">{title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testList.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: Number(t.rating || 5) }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                    ))}
                  </div>
                  <p className="text-white/85 text-sm font-body leading-relaxed mb-6 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--rose)] to-[var(--gold)] flex items-center justify-center text-white font-display font-medium text-sm shrink-0">
                      {String(t.name || 'C').charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-body font-medium">{t.name}</p>
                      <p className="text-white/40 text-xs font-body">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'faq': {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <section className="py-16 max-w-3xl mx-auto px-6 w-full">
          <h2 className="font-display text-3xl font-medium text-[var(--charcoal)] text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {items.map((item: any, i: number) => (
              <details key={i} className="group bg-white rounded-2xl border border-[var(--border)] p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-display text-base font-semibold text-[var(--charcoal)] pr-4">{item.question}</h3>
                  <span className="shrink-0 transition-transform group-open:-rotate-180">
                    <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                  </span>
                </summary>
                <div className="mt-3 text-sm font-body text-[var(--charcoal-mid)] leading-relaxed border-t border-[var(--border)] pt-3">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      );
    }

    case 'contact_form': {
      return <ContactFormBlock />;
    }

    case 'spacer': {
      const height = Number(data.height || 40);
      return <div style={{ height: `${height}px` }} />;
    }

    case 'divider': {
      return <hr className="border-t border-[var(--border)] max-w-7xl mx-auto my-6" />;
    }

    default:
      return null;
  }
}

// ─── HeroBlock — single image (legacy) or multi-slide carousel ────────────────
function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const slides = Array.isArray(data.slides) && (data.slides as any[]).length > 0
    ? (data.slides as any[])
    : null;

  const [current,      setCurrent]      = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!slides) return;
    const t = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % slides.length);
        setTransitioning(false);
      }, 400);
    }, 6000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides?.length]);

  // ── Multi-slide carousel mode ─────────────────────────────────────────────
  if (slides) {
    const slide = slides[current]!;
    const ctaLabel    = slide.cta       || 'Shop Now';
    const ctaHref     = slide.href      || '/products';
    const secLabel    = slide.ctaSec    || 'Meet the Vendors';
    const secHref     = slide.hrefSec   || '/vendors';
    return (
      <section className="relative h-[90vh] min-h-[600px] max-h-[900px] overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          <Image src={slide.img || slide.imageUrl || ''} alt={slide.headline || ''} fill priority className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className={`max-w-2xl transition-all duration-700 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              {slide.badge && (
                <span className="inline-flex items-center gap-1.5 text-xs font-body font-medium tracking-[0.15em] uppercase px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 mb-6">
                  {slide.badge}
                </span>
              )}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium text-white leading-[1.05] mb-5 whitespace-pre-line">
                {slide.headline || ''}
              </h1>
              {slide.sub && (
                <p className="text-white/80 text-base sm:text-lg font-body leading-relaxed mb-8 max-w-lg">{slide.sub}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <Link href={ctaHref} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[var(--charcoal)] text-sm font-body font-medium hover:bg-[var(--cream)] transition-all duration-200 shadow-lg shadow-black/20 group">
                  {ctaLabel} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href={secHref} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/50 text-white text-sm font-body font-medium hover:bg-white/15 transition-all duration-200 backdrop-blur-sm">
                  {secLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--cream)] to-transparent" />
      </section>
    );
  }

  // ── Single image legacy mode ──────────────────────────────────────────────
  const headline     = String(data.headline    || 'Discover Your Style');
  const subheadline  = String(data.subheadline || '');
  const imageUrl     = String(data.imageUrl    || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600');
  const overlayColor = String(data.overlayColor|| 'rgba(0,0,0,0.35)');
  let ctaLabel = 'Shop Now', ctaHref = '/products';
  if (data.cta) {
    if (typeof data.cta === 'object' && data.cta !== null) {
      ctaLabel = (data.cta as any).label || 'Shop Now';
      ctaHref  = (data.cta as any).href  || '/products';
    } else {
      ctaLabel = String(data.cta);
      ctaHref  = String(data.ctaHref || '/products');
    }
  }
  let ctaSecLabel = '', ctaSecHref = '/vendors';
  if (data.ctaSecondary) {
    if (typeof data.ctaSecondary === 'object' && data.ctaSecondary !== null) {
      ctaSecLabel = (data.ctaSecondary as any).label || '';
      ctaSecHref  = (data.ctaSecondary as any).href  || '/vendors';
    } else {
      ctaSecLabel = String(data.ctaSecondary);
      ctaSecHref  = String(data.ctaSecondaryHref || '/vendors');
    }
  }

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden py-20 px-4">
      <Image src={imageUrl} alt={headline} fill priority className="object-cover object-center absolute inset-0 transition-transform duration-[10000ms] hover:scale-105" />
      <div className="absolute inset-0 transition-opacity duration-500" style={{ backgroundColor: overlayColor }} />
      <div className="relative z-10 max-w-4xl mx-auto text-center text-white space-y-6">
        <span className="text-xs font-body font-semibold tracking-[0.25em] uppercase text-[var(--gold)] drop-shadow-sm">NEW ARRIVALS</span>
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.1] drop-shadow-md">{headline}</h1>
        {subheadline && <p className="text-base sm:text-lg font-body max-w-xl mx-auto text-white/90 font-light leading-relaxed drop-shadow-sm">{subheadline}</p>}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href={ctaHref} className="px-8 py-3.5 rounded-full bg-[var(--rose)] hover:bg-[var(--rose-dark)] text-white text-sm font-body font-semibold tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">{ctaLabel}</Link>
          {ctaSecLabel && <Link href={ctaSecHref} className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-body font-semibold tracking-wide backdrop-blur-md border border-white/30 transition-all hover:-translate-y-0.5">{ctaSecLabel}</Link>}
        </div>
      </div>
    </section>
  );
}

// ─── FeaturedProductsBlock — fetches real products from the API ───────────────
function FeaturedProductsBlock({
  title, subtitle, filter, limit,
}: { title: string; subtitle: string; filter: string; limit: number }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      try {
        // Build query: isNew, isTrending, isFeatured are boolean flags on the Product model
        const param =
          filter === 'isNew'      ? 'isNew=true' :
          filter === 'isTrending' ? 'isTrending=true' :
          filter === 'isFeatured' ? 'isFeatured=true' : '';
        const url = `${API}/products?${param}&limit=${limit}&status=active`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        const raw: any[] = json.data?.products || json.data || [];
        if (!cancelled) {
          setProducts(raw.slice(0, limit).map((p: any) => {
            const vName = typeof p.vendor === 'object' ? (p.vendor?.storeName || 'StyleHub') : 'StyleHub';
            const vSlug = typeof p.vendor === 'object' ? (p.vendor?.storeSlug || 'stylehub') : 'stylehub';
            return {
              id: p._id, name: p.name, slug: p.slug,
              brand: p.brand || vName,
              category: typeof p.category === 'object' ? (p.category?.name || 'Fashion') : 'Fashion',
              categorySlug: typeof p.category === 'object' ? (p.category?.slug || 'fashion') : 'fashion',
              vendor: { id: typeof p.vendor === 'object' ? p.vendor?._id : '', name: vName, slug: vSlug, logo: '', banner: '', description: '', rating: 0, reviewCount: 0, productCount: 0, location: 'India', tags: [], verified: true },
              vendorId: typeof p.vendor === 'object' ? p.vendor?._id : '',
              vendorName: vName, vendorSlug: vSlug,
              description: p.description || '', longDescription: p.description || '',
              images: p.images || [], basePrice: p.basePrice || 0, compareAtPrice: p.compareAtPrice,
              rating: p.avgRating ?? 0, reviewCount: p.reviewCount || 0, soldCount: 0,
              gender: p.gender || 'unisex', tags: p.tags || [], material: p.material || '', careInstructions: '',
              variants: (p.variants || []).map((v: any) => ({ size: v.size, color: v.color, colorHex: v.colorHex || '#9ca3af', stock: v.stock || 0, price: v.price || p.basePrice, sku: v.sku || '' })),
              reviews: [], isFeatured: !!p.isFeatured, isNew: !!p.isNew, isBestSeller: false,
            };
          }));
        }
      } catch {
        // Leave products empty on failure — show empty state, not mock data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [filter, limit]);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-[var(--rose)] mb-3">
              StyleHub Curated
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-medium text-[var(--charcoal)] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm font-body text-[var(--muted)] mt-2">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-body text-[var(--rose)] hover:text-[var(--rose-dark)] transition-colors group shrink-0"
          >
            Explore all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: limit > 8 ? 8 : limit }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[var(--cream-dark)] animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--cream)] rounded-2xl border border-[var(--border)]">
            <p className="font-body text-sm text-[var(--muted)]">No products found for this section yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ContactFormBlock() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('All fields are required.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('stylehub-token');
      const userId = localStorage.getItem('stylehub-user-id');
      const res = await fetch(`${API}/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          subject: 'CMS Page Contact Form Inquiry',
          message,
          enquiryType: 'general'
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert('Message sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setError(json.message || 'Failed to submit enquiry.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 max-w-3xl mx-auto px-6 w-full">
      <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm">
        <h3 className="font-display text-2xl font-medium text-[var(--charcoal)] mb-6">Send an Inquiry</h3>
        {error && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-body">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)]" />
            </div>
            <div>
              <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-body font-semibold text-[var(--charcoal)] uppercase tracking-wide block mb-1.5">Message</label>
            <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-body bg-[var(--cream)] resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[var(--rose)] text-white text-sm font-body font-semibold hover:bg-[var(--rose-dark)] transition-colors disabled:opacity-75">
            {loading ? 'Submitting...' : 'Submit Form'}
          </button>
        </form>
      </div>
    </section>
  );
}
