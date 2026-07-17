// ─── StyleHub Mock Data ──────────────────────────────────────────────────────
// Replace with real API calls via fetch() in Server Components

export interface Category {
  id:          string;
  name:        string;
  slug:        string;
  image:       string;
  productCount:number;
  gradient:    string;
}

export interface Vendor {
  id:          string;
  name:        string;
  slug:        string;
  logo:        string;
  banner:      string;
  description: string;
  rating:      number;
  reviewCount: number;
  productCount:number;
  location:    string;
  tags:        string[];
  verified:    boolean;
}

export interface ProductVariant {
  size:     string;
  color:    string;
  colorHex: string;
  stock:    number;
  price:    number;   // effective price for this variant (defaults to basePrice)
  sku:      string;
}

export interface Review {
  id:        string;
  author:    string;
  avatar:    string;
  rating:    number;
  date:      string;
  title:     string;
  body:      string;
  verified:  boolean;
  helpful:   number;
  images?:   string[];
}

export interface Product {
  id:              string;
  name:            string;
  slug:            string;
  brand:           string;
  category:        string;
  categorySlug:    string;
  vendor:          Vendor;
  // Shortcut fields derived from vendor (used in cart store)
  vendorId:        string;
  vendorName:      string;
  vendorSlug:      string;
  description:     string;
  longDescription: string;
  images:          string[];
  basePrice:       number;
  compareAtPrice?: number;
  rating:          number;
  reviewCount:     number;
  soldCount:       number;
  gender:          string;
  tags:            string[];
  material:        string;
  careInstructions:string;
  variants:        ProductVariant[];
  reviews:         Review[];
  isFeatured:      boolean;
  isNew:           boolean;
  isBestSeller:    boolean;
  isTrending?:     boolean;
}

// ─── Vendors ─────────────────────────────────────────────────────────────────
export const VENDORS: Vendor[] = [
  {
    id: 'v1', name: 'UrbanThreads', slug: 'urban-threads',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop',
    banner: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&h=400&fit=crop',
    description: 'Premium everyday wear crafted from sustainable fabrics. Where comfort meets conscious fashion.',
    rating: 4.8, reviewCount: 1240, productCount: 312, location: 'Mumbai, India',
    tags: ['Sustainable', 'Minimalist', 'Premium Cotton'], verified: true,
  },
  {
    id: 'v2', name: 'DesiCouture', slug: 'desi-couture',
    logo: 'https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=80&h=80&fit=crop',
    banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&h=400&fit=crop',
    description: 'Celebrating the art of Indian craftsmanship with contemporary silhouettes.',
    rating: 4.7, reviewCount: 986, productCount: 278, location: 'Jaipur, India',
    tags: ['Ethnic', 'Handcrafted', 'Luxury'], verified: true,
  },
  {
    id: 'v3', name: 'SoleMate', slug: 'sole-mate',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop',
    banner: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&h=400&fit=crop',
    description: 'Where every step tells a story. Handcrafted footwear from the finest leathers.',
    rating: 4.6, reviewCount: 754, productCount: 201, location: 'Agra, India',
    tags: ['Handcrafted', 'Leather', 'Artisan'], verified: true,
  },
  {
    id: 'v4', name: 'EthnicVibe', slug: 'ethnic-vibe',
    logo: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=80&h=80&fit=crop',
    banner: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&h=400&fit=crop',
    description: 'Vibrant ethnic wear that blends tradition with a modern twist.',
    rating: 4.5, reviewCount: 620, productCount: 189, location: 'Delhi, India',
    tags: ['Festive', 'Block Print', 'Handloom'], verified: false,
  },
];

// ─── Categories ───────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Dresses',     slug: 'dresses',     image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop', productCount: 284, gradient: 'from-rose-900/70 to-rose-600/40' },
  { id: 'c2', name: 'Tops',        slug: 'tops',        image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400&h=500&fit=crop', productCount: 512, gradient: 'from-amber-900/70 to-amber-600/40' },
  { id: 'c3', name: 'Ethnic Wear', slug: 'ethnic',      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop', productCount: 198, gradient: 'from-purple-900/70 to-purple-600/40' },
  { id: 'c4', name: 'Footwear',    slug: 'footwear',    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop', productCount: 167, gradient: 'from-stone-900/70 to-stone-600/40' },
  { id: 'c5', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop', productCount: 340, gradient: 'from-teal-900/70 to-teal-600/40' },
  { id: 'c6', name: 'Denim',       slug: 'denim',       image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop', productCount: 143, gradient: 'from-blue-900/70 to-blue-600/40' },
];

// ─── Mock Reviews ──────────────────────────────────────────────────────────────
const SAMPLE_REVIEWS: Review[] = [
  { id: 'r1', author: 'Priya M.', avatar: 'P', rating: 5, date: '12 Jul 2026', title: 'Absolutely stunning!', body: 'The fabric quality is incredible. Fits perfectly and the colour is even more beautiful in person. Will definitely order again!', verified: true, helpful: 24 },
  { id: 'r2', author: 'Ananya S.', avatar: 'A', rating: 4, date: '8 Jul 2026', title: 'Great quality, slightly large', body: 'Love the design and fabric but I should have sized down. The details are exquisite though. Customer service was very helpful.', verified: true, helpful: 11 },
  { id: 'r3', author: 'Riya K.', avatar: 'R', rating: 5, date: '3 Jul 2026', title: 'Perfect for festive season', body: 'Ordered this for a wedding and received SO many compliments. The embroidery work is gorgeous. Packaging was also very premium.', verified: true, helpful: 38 },
  { id: 'r4', author: 'Neha T.', avatar: 'N', rating: 4, date: '28 Jun 2026', title: 'Beautiful piece', body: 'Very well made. The stitching is clean and the colours are vibrant. Delivery was faster than expected too!', verified: false, helpful: 7 },
];

// ─── Products ─────────────────────────────────────────────────────────────────
// Raw data — vendorId/vendorName/vendorSlug and variant prices are derived below
const RAW_PRODUCTS = [
  {
    id: 'p1',
    name: 'Ivory Embroidered Anarkali Kurta',
    slug: 'ivory-embroidered-anarkali-kurta',
    brand: 'DesiCouture',
    category: 'Ethnic Wear',
    categorySlug: 'ethnic',
    vendor: VENDORS[1]!,
    description: 'A regal Anarkali silhouette adorned with intricate thread embroidery.',
    longDescription: 'Crafted from premium georgette fabric, this Ivory Embroidered Anarkali Kurta is a masterpiece of Indian craftsmanship. The kurta features delicate threadwork embroidery across the yoke and hemline, creating an ethereal silhouette perfect for festive occasions. The flared design creates a graceful movement while the subtle ivory tone ensures timeless elegance. Paired with palazzo pants or churidaar, this piece transitions beautifully from daytime celebrations to evening gatherings.',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop',
    ],
    basePrice: 3499,
    compareAtPrice: 5200,
    rating: 4.8,
    reviewCount: 127,
    soldCount: 482,
    gender: 'women',
    tags: ['ethnic', 'kurta', 'festive', 'embroidery'],
    material: '100% Premium Georgette',
    careInstructions: 'Dry clean only. Store away from direct sunlight.',
    variants: [
      { size: 'XS', color: 'Ivory', colorHex: '#FFFFF0', stock: 5,  sku: 'DC-ANK-001-XS' },
      { size: 'S',  color: 'Ivory', colorHex: '#FFFFF0', stock: 12, sku: 'DC-ANK-001-S' },
      { size: 'M',  color: 'Ivory', colorHex: '#FFFFF0', stock: 8,  sku: 'DC-ANK-001-M' },
      { size: 'L',  color: 'Ivory', colorHex: '#FFFFF0', stock: 4,  sku: 'DC-ANK-001-L' },
      { size: 'XL', color: 'Ivory', colorHex: '#FFFFF0', stock: 3,  sku: 'DC-ANK-001-XL' },
      { size: 'S',  color: 'Blush Rose', colorHex: '#F4C2C2', stock: 6, sku: 'DC-ANK-001-S-ROSE' },
      { size: 'M',  color: 'Blush Rose', colorHex: '#F4C2C2', stock: 9, sku: 'DC-ANK-001-M-ROSE' },
      { size: 'L',  color: 'Blush Rose', colorHex: '#F4C2C2', stock: 7, sku: 'DC-ANK-001-L-ROSE' },
    ],
    reviews: SAMPLE_REVIEWS,
    isFeatured: true, isNew: false, isBestSeller: true,
  },
  {
    id: 'p2',
    name: 'Midnight Floral Maxi Dress',
    slug: 'midnight-floral-maxi-dress',
    brand: 'UrbanThreads',
    category: 'Dresses',
    categorySlug: 'dresses',
    vendor: VENDORS[0]!,
    description: 'An ethereal maxi dress with hand-painted floral motifs on midnight navy.',
    longDescription: 'The Midnight Floral Maxi Dress is a statement piece that effortlessly bridges bohemian charm with refined elegance. Crafted from a flowing crepe fabric, the dress drapes beautifully and moves with you through every occasion. The hand-printed floral design on a midnight navy base creates a rich, jewel-toned aesthetic that photographs beautifully. Features a V-neckline, adjustable spaghetti straps, and a hidden side zip for a secure fit.',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop',
    ],
    basePrice: 2899,
    compareAtPrice: 4200,
    rating: 4.6,
    reviewCount: 89,
    soldCount: 234,
    gender: 'women',
    tags: ['dress', 'maxi', 'floral', 'evening'],
    material: '100% Crepe Fabric',
    careInstructions: 'Hand wash cold. Do not tumble dry.',
    variants: [
      { size: 'XS', color: 'Midnight Navy', colorHex: '#191970', stock: 3, sku: 'UT-FMD-002-XS' },
      { size: 'S',  color: 'Midnight Navy', colorHex: '#191970', stock: 8, sku: 'UT-FMD-002-S' },
      { size: 'M',  color: 'Midnight Navy', colorHex: '#191970', stock: 11, sku: 'UT-FMD-002-M' },
      { size: 'L',  color: 'Midnight Navy', colorHex: '#191970', stock: 6, sku: 'UT-FMD-002-L' },
      { size: 'XL', color: 'Midnight Navy', colorHex: '#191970', stock: 2, sku: 'UT-FMD-002-XL' },
    ],
    reviews: SAMPLE_REVIEWS.slice(0, 3),
    isFeatured: true, isNew: true, isBestSeller: false,
  },
  {
    id: 'p3',
    name: 'Camel Ribbed Knit Co-ord Set',
    slug: 'camel-ribbed-knit-coord-set',
    brand: 'UrbanThreads',
    category: 'Tops',
    categorySlug: 'tops',
    vendor: VENDORS[0]!,
    description: 'Luxuriously soft ribbed knit co-ord set in warm camel tones.',
    longDescription: 'Elevate your everyday wardrobe with the Camel Ribbed Knit Co-ord Set. Made from a premium cotton-modal blend, this set offers an unparalleled softness that only improves with every wash. The ribbed texture adds visual interest while providing gentle stretch for an effortlessly flattering fit. The cropped top and high-waisted wide-leg trouser work seamlessly together or as separates for versatile styling.',
    images: [
      'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop',
    ],
    basePrice: 1899,
    compareAtPrice: 2800,
    rating: 4.7,
    reviewCount: 203,
    soldCount: 671,
    gender: 'women',
    tags: ['coord', 'knit', 'casual', 'minimal'],
    material: '60% Cotton, 40% Modal',
    careInstructions: 'Machine wash cold on gentle cycle.',
    variants: [
      { size: 'XS', color: 'Camel', colorHex: '#C19A6B', stock: 8, sku: 'UT-RKC-003-XS' },
      { size: 'S',  color: 'Camel', colorHex: '#C19A6B', stock: 15, sku: 'UT-RKC-003-S' },
      { size: 'M',  color: 'Camel', colorHex: '#C19A6B', stock: 12, sku: 'UT-RKC-003-M' },
      { size: 'L',  color: 'Camel', colorHex: '#C19A6B', stock: 7, sku: 'UT-RKC-003-L' },
      { size: 'S',  color: 'Ivory', colorHex: '#FFFFF0', stock: 9, sku: 'UT-RKC-003-S-IVR' },
      { size: 'M',  color: 'Ivory', colorHex: '#FFFFF0', stock: 11, sku: 'UT-RKC-003-M-IVR' },
    ],
    reviews: SAMPLE_REVIEWS.slice(1),
    isFeatured: true, isNew: false, isBestSeller: true,
  },
  {
    id: 'p4',
    name: 'Terracotta Block Print Palazzo',
    slug: 'terracotta-block-print-palazzo',
    brand: 'EthnicVibe',
    category: 'Ethnic Wear',
    categorySlug: 'ethnic',
    vendor: VENDORS[3]!,
    description: 'Hand block-printed palazzo in warm terracotta hues with Rajasthani motifs.',
    longDescription: 'Each Terracotta Block Print Palazzo is a unique work of art, hand-crafted by skilled artisans in Rajasthan using traditional wooden block printing techniques. The earthy terracotta and rust tones reflect the rich heritage of Indian textile art. Made from lightweight cotton, these palazzos are perfect for warm weather while the elastic waistband ensures comfort throughout the day.',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1610473228636-7a2e4bf0c37a?w=700&h=900&fit=crop',
    ],
    basePrice: 1199,
    rating: 4.4,
    reviewCount: 56,
    soldCount: 189,
    gender: 'women',
    tags: ['ethnic', 'palazzo', 'block-print', 'summer'],
    material: '100% Handloom Cotton',
    careInstructions: 'Hand wash in cold water. Dry in shade.',
    variants: [
      { size: 'S',  color: 'Terracotta', colorHex: '#CC4E2A', stock: 14, sku: 'EV-TBP-004-S' },
      { size: 'M',  color: 'Terracotta', colorHex: '#CC4E2A', stock: 18, sku: 'EV-TBP-004-M' },
      { size: 'L',  color: 'Terracotta', colorHex: '#CC4E2A', stock: 10, sku: 'EV-TBP-004-L' },
      { size: 'XL', color: 'Terracotta', colorHex: '#CC4E2A', stock: 6,  sku: 'EV-TBP-004-XL' },
    ],
    reviews: SAMPLE_REVIEWS.slice(2),
    isFeatured: false, isNew: true, isBestSeller: false,
  },
  {
    id: 'p5',
    name: 'Tan Leather Strappy Heels',
    slug: 'tan-leather-strappy-heels',
    brand: 'SoleMate',
    category: 'Footwear',
    categorySlug: 'footwear',
    vendor: VENDORS[2]!,
    description: 'Handcrafted strappy block heels in supple tan leather — effortlessly elegant.',
    longDescription: 'The SoleMate Tan Leather Strappy Heels are a testament to artisanal footwear craftsmanship. Each pair is hand-stitched by skilled cobblers in Agra using premium full-grain leather that develops a beautiful patina over time. The block heel provides stability without sacrificing elegance, making these heels as comfortable for all-day wear as they are stunning for evening occasions.',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=700&h=900&fit=crop',
    ],
    basePrice: 4200,
    compareAtPrice: 5800,
    rating: 4.9,
    reviewCount: 312,
    soldCount: 891,
    gender: 'women',
    tags: ['heels', 'leather', 'handcrafted', 'formal'],
    material: 'Full-grain vegetable-tanned leather',
    careInstructions: 'Use leather conditioner monthly. Store in dust bag.',
    variants: [
      { size: 'UK 4', color: 'Tan', colorHex: '#D2B48C', stock: 5,  sku: 'SM-LSH-005-4' },
      { size: 'UK 5', color: 'Tan', colorHex: '#D2B48C', stock: 8,  sku: 'SM-LSH-005-5' },
      { size: 'UK 6', color: 'Tan', colorHex: '#D2B48C', stock: 12, sku: 'SM-LSH-005-6' },
      { size: 'UK 7', color: 'Tan', colorHex: '#D2B48C', stock: 9,  sku: 'SM-LSH-005-7' },
      { size: 'UK 8', color: 'Tan', colorHex: '#D2B48C', stock: 4,  sku: 'SM-LSH-005-8' },
      { size: 'UK 5', color: 'Black', colorHex: '#0A0A0A', stock: 7, sku: 'SM-LSH-005-5-BLK' },
      { size: 'UK 6', color: 'Black', colorHex: '#0A0A0A', stock: 10, sku: 'SM-LSH-005-6-BLK' },
      { size: 'UK 7', color: 'Black', colorHex: '#0A0A0A', stock: 8, sku: 'SM-LSH-005-7-BLK' },
    ],
    reviews: SAMPLE_REVIEWS,
    isFeatured: true, isNew: false, isBestSeller: true,
  },
  {
    id: 'p6',
    name: 'Sage Linen Wide-Leg Trousers',
    slug: 'sage-linen-wide-leg-trousers',
    brand: 'UrbanThreads',
    category: 'Tops',
    categorySlug: 'tops',
    vendor: VENDORS[0]!,
    description: 'Breathable wide-leg linen trousers in calming sage green.',
    longDescription: 'The Sage Linen Wide-Leg Trousers represent the perfect marriage of comfort and sophistication. Cut from 100% European linen, these trousers offer exceptional breathability and a natural drape that only gets better with age. The wide-leg silhouette creates an elongating effect while the relaxed fit ensures all-day comfort. An elasticated waistband with a tie-front detail adds a touch of ease and style.',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=700&h=900&fit=crop',
    ],
    basePrice: 1699,
    compareAtPrice: 2400,
    rating: 4.5,
    reviewCount: 74,
    soldCount: 298,
    gender: 'women',
    tags: ['linen', 'trousers', 'casual', 'sustainable'],
    material: '100% European Linen',
    careInstructions: 'Machine wash cold. Tumble dry low.',
    variants: [
      { size: 'XS', color: 'Sage', colorHex: '#9CAF88', stock: 6,  sku: 'UT-LWT-006-XS' },
      { size: 'S',  color: 'Sage', colorHex: '#9CAF88', stock: 10, sku: 'UT-LWT-006-S' },
      { size: 'M',  color: 'Sage', colorHex: '#9CAF88', stock: 14, sku: 'UT-LWT-006-M' },
      { size: 'L',  color: 'Sage', colorHex: '#9CAF88', stock: 8,  sku: 'UT-LWT-006-L' },
      { size: 'XL', color: 'Sage', colorHex: '#9CAF88', stock: 4,  sku: 'UT-LWT-006-XL' },
      { size: 'S',  color: 'Oat', colorHex: '#D2B48C', stock: 8,  sku: 'UT-LWT-006-S-OAT' },
      { size: 'M',  color: 'Oat', colorHex: '#D2B48C', stock: 9,  sku: 'UT-LWT-006-M-OAT' },
    ],
    reviews: SAMPLE_REVIEWS.slice(0, 2),
    isFeatured: false, isNew: true, isBestSeller: false,
  },
  {
    id: 'p7',
    name: 'Dusty Pink Silk Slip Dress',
    slug: 'dusty-pink-silk-slip-dress',
    brand: 'UrbanThreads',
    category: 'Dresses',
    categorySlug: 'dresses',
    vendor: VENDORS[0]!,
    description: 'A whisper-light silk slip dress in the most flattering shade of dusty pink.',
    longDescription: 'The Dusty Pink Silk Slip Dress is our most requested piece — and for good reason. Cut from pure charmeuse silk, it glides effortlessly over the body, catching the light with every movement. The bias cut creates a subtly figure-skimming silhouette while thin adjustable straps allow for a perfectly personalised fit. Style it alone for warm evenings or layer over a white tee for a fashion-forward day look.',
    images: [
      'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&h=900&fit=crop',
    ],
    basePrice: 3299,
    compareAtPrice: 4800,
    rating: 4.9,
    reviewCount: 198,
    soldCount: 567,
    gender: 'women',
    tags: ['silk', 'dress', 'slip', 'evening', 'luxury'],
    material: '100% Pure Charmeuse Silk',
    careInstructions: 'Dry clean recommended. Hand wash cold if necessary.',
    variants: [
      { size: 'XS', color: 'Dusty Pink', colorHex: '#D4A0A0', stock: 4, sku: 'UT-SSD-007-XS' },
      { size: 'S',  color: 'Dusty Pink', colorHex: '#D4A0A0', stock: 7, sku: 'UT-SSD-007-S' },
      { size: 'M',  color: 'Dusty Pink', colorHex: '#D4A0A0', stock: 9, sku: 'UT-SSD-007-M' },
      { size: 'L',  color: 'Dusty Pink', colorHex: '#D4A0A0', stock: 5, sku: 'UT-SSD-007-L' },
      { size: 'S',  color: 'Champagne', colorHex: '#F7E7CE', stock: 6, sku: 'UT-SSD-007-S-CHMP' },
      { size: 'M',  color: 'Champagne', colorHex: '#F7E7CE', stock: 8, sku: 'UT-SSD-007-M-CHMP' },
    ],
    reviews: SAMPLE_REVIEWS,
    isFeatured: true, isNew: false, isBestSeller: true,
  },
  {
    id: 'p8',
    name: 'Gold Filigree Drop Earrings',
    slug: 'gold-filigree-drop-earrings',
    brand: 'DesiCouture',
    category: 'Accessories',
    categorySlug: 'accessories',
    vendor: VENDORS[1]!,
    description: 'Handcrafted 22K gold-plated filigree drop earrings inspired by Mughal art.',
    longDescription: 'These exquisite filigree drop earrings are a celebration of India\'s rich jewellery-making heritage. Each pair is handcrafted by master artisans using the ancient filigree technique, where fine threads of gold are twisted and soldered into intricate lace-like patterns. The 22K gold plating ensures a rich, enduring lustre while the lightweight construction makes them comfortable for extended wear.',
    images: [
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=700&h=900&fit=crop',
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=900&fit=crop',
    ],
    basePrice: 1499,
    rating: 4.7,
    reviewCount: 89,
    soldCount: 423,
    gender: 'women',
    tags: ['jewellery', 'earrings', 'gold', 'handcrafted'],
    material: 'Brass with 22K gold plating',
    careInstructions: 'Store in anti-tarnish pouch. Avoid moisture.',
    variants: [
      { size: 'Free Size', color: 'Gold', colorHex: '#FFD700', stock: 45, sku: 'DC-GFE-008' },
    ],
    reviews: SAMPLE_REVIEWS.slice(0, 2),
    isFeatured: false, isNew: true, isBestSeller: false,
  },
];

// Derive shortcut fields and variant prices automatically
export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  vendorId:   p.vendor.id,
  vendorName: p.vendor.name,
  vendorSlug: p.vendor.slug,
  variants: p.variants.map((v) => ({
    ...v,
    price: (v as { price?: number }).price ?? p.basePrice,
  })),
}));

// ─── Testimonials ──────────────────────────────────────────────────────────────
export const TESTIMONIALS = [
  { id: 't1', name: 'Aisha Kapoor', role: 'Fashion Blogger', avatar: 'A', rating: 5, text: 'StyleHub has completely transformed how I shop for fashion. The curation is impeccable — I always find something that feels truly special and unique. The quality across all vendors is consistently outstanding.' },
  { id: 't2', name: 'Meera Sharma', role: 'Entrepreneur', avatar: 'M', rating: 5, text: 'As someone who appreciates artisanal fashion, StyleHub is a revelation. I\'ve discovered incredible Indian designers I never would have found otherwise. Every purchase feels like supporting real artistry.' },
  { id: 't3', name: 'Zara Singh', role: 'Content Creator', avatar: 'Z', rating: 5, text: 'The vendor experience is phenomenal. My customers love the product quality and the packaging is so premium — it makes every unboxing feel like a gift. Highly recommend to any fashion-forward shopper.' },
  { id: 't4', name: 'Priya Patel', role: 'Interior Designer', avatar: 'P', rating: 5, text: 'I\'ve been a StyleHub customer for 18 months now. The attention to detail — from curation to delivery — is remarkable. It\'s the only platform where I genuinely trust the quality before I even receive my order.' },
];

// ─── Deals ────────────────────────────────────────────────────────────────────
export const DEALS = [
  { id: 'd1', title: 'Festival Edit', subtitle: 'Up to 40% off ethnic wear', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=400&fit=crop', badge: '40% OFF', cta: 'Shop Now', href: '/products?category=ethnic' },
  { id: 'd2', title: 'New Season Arrivals', subtitle: 'Fresh drops from top vendors', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=400&fit=crop', badge: 'NEW IN', cta: 'Explore', href: '/products?sort=newest' },
  { id: 'd3', title: 'Artisan Footwear', subtitle: 'Handcrafted luxury for less', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=400&fit=crop', badge: '30% OFF', cta: 'Shop Heels', href: '/products?category=footwear' },
];

// ─── Helper functions ─────────────────────────────────────────────────────────
export const getProductBySlug = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const getVendorBySlug = (slug: string) =>
  VENDORS.find((v) => v.slug === slug);

export const getProductsByVendor = (vendorId: string) =>
  PRODUCTS.filter((p) => p.vendor.id === vendorId);

export const getFeaturedProducts = () =>
  PRODUCTS.filter((p) => p.isFeatured);

export const getTrendingProducts = () =>
  [...PRODUCTS].sort((a, b) => b.soldCount - a.soldCount).slice(0, 6);

export const getRelatedProducts = (product: Product, limit = 4) =>
  PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, limit);

// Alias used by WishlistClient and other components
export const mockProducts = PRODUCTS;
