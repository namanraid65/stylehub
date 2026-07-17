// ─── CMS Types ────────────────────────────────────────────────────────────────
export type BlockType =
  | 'hero'
  | 'rich_text'
  | 'image'
  | 'image_grid'
  | 'featured_products'
  | 'banner_strip'
  | 'testimonials'
  | 'faq'
  | 'contact_form'
  | 'spacer'
  | 'divider'
  | 'cta';

export interface CmsBlock {
  id:       string;
  type:     BlockType;
  order:    number;
  isActive: boolean;
  data:     Record<string, unknown>;
  label?:   string;
}

export interface CmsPage {
  slug:        string;
  title:       string;
  description?: string;
  seoTitle?:   string;
  seoDesc?:    string;
  blocks:      CmsBlock[];
  isPublished: boolean;
}

export interface CmsBanner {
  _id:         string;
  title:       string;
  subtitle?:   string;
  imageUrl:    string;
  mobileImageUrl?: string;
  linkUrl?:    string;
  linkLabel?:  string;
  placement:   string;
  order:       number;
  isActive:    boolean;
  bgColor?:    string;
  textColor?:  string;
}

// ─── Default homepage CMS data (used when API is not available) ───────────────
const genId = () => Math.random().toString(36).substring(2, 10);

export const DEFAULT_HOMEPAGE_BLOCKS: CmsBlock[] = [
  {
    id: genId(), type: 'hero', order: 1, isActive: true,
    data: {
      headline: 'Discover Your Style',
      subheadline: "Handpicked fashion from India's finest artisan vendors",
      cta: 'Shop Now', ctaHref: '/products',
      ctaSecondary: 'Explore Vendors', ctaSecondaryHref: '/vendors',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600',
      overlayColor: 'rgba(0,0,0,0.35)',
    },
  },
  {
    id: genId(), type: 'banner_strip', order: 2, isActive: true,
    data: {
      items: [
        { icon: '🚚', text: 'Free Delivery above ₹1999' },
        { icon: '↩️', text: 'Easy 15-day Returns' },
        { icon: '🔒', text: '100% Authentic Products' },
        { icon: '💳', text: 'Secure Payments' },
      ],
    },
  },
  {
    id: genId(), type: 'featured_products', order: 3, isActive: true,
    data: { title: 'New Arrivals', subtitle: 'Fresh styles, just dropped', filter: 'isNew', limit: 8 },
  },
  {
    id: genId(), type: 'cta', order: 4, isActive: true,
    data: {
      headline: 'Monsoon Sale — Up to 40% Off',
      subheadline: "Curated deals on ethnic wear, dresses and more",
      buttonLabel: 'Shop the Sale',
      buttonHref: '/products?sale=1',
      bgColor: '#C84B31',
      textColor: '#FFFFFF',
    },
  },
  {
    id: genId(), type: 'featured_products', order: 5, isActive: true,
    data: { title: 'Trending Now', subtitle: "What StyleHub shoppers can't stop buying", filter: 'isTrending', limit: 8 },
  },
  {
    id: genId(), type: 'testimonials', order: 6, isActive: true,
    data: {
      title: 'What Our Customers Say',
      testimonials: [
        { name: 'Priya S.', location: 'Mumbai', rating: 5, text: 'The ivory anarkali is stunning! Quality is exceptional and shipping was super fast.' },
        { name: 'Ananya K.', location: 'Bengaluru', rating: 5, text: 'Finally a marketplace that curates only the best. StyleHub has become my go-to.' },
        { name: 'Meera P.', location: 'Delhi', rating: 5, text: 'The jewellery I ordered is even more beautiful in person. Packaging was lovely too.' },
        { name: 'Kavya R.', location: 'Chennai', rating: 5, text: 'I ordered the camel ribbed co-ord and it fits perfectly. The fabric is luxurious!' },
      ],
    },
  },
];

// ─── API fetcher (with fallback to mock) ─────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function fetchCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    const res = await fetch(`${API}/cms/pages/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const { page } = await res.json() as { page: CmsPage };
    return page;
  } catch {
    // Return default for homepage
    if (slug === 'homepage') {
      return {
        slug: 'homepage', title: 'Homepage',
        blocks: DEFAULT_HOMEPAGE_BLOCKS,
        isPublished: true,
      };
    }
    return null;
  }
}

export async function fetchBanners(placement?: string): Promise<CmsBanner[]> {
  try {
    const url = placement ? `${API}/cms/banners?placement=${placement}` : `${API}/cms/banners`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const { banners } = await res.json() as { banners: CmsBanner[] };
    return banners;
  } catch {
    return [];
  }
}

// ─── Helper — get active blocks sorted by order ───────────────────────────────
export function getActiveBlocks(page: CmsPage): CmsBlock[] {
  return page.blocks.filter((b) => b.isActive).sort((a, b) => a.order - b.order);
}
