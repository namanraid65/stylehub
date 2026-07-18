/**
 * StyleHub Comprehensive Seed Script
 * Run: pnpm --filter @stylehub/api exec ts-node src/scripts/seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { randomUUID as uuid } from 'crypto';

dotenv.config();

import Category from '../models/Category';
import Vendor   from '../models/Vendor';
import Product  from '../models/Product';
import User     from '../models/User';
import CmsPage  from '../models/CmsPage';
import Banner   from '../models/Banner';
import Order    from '../models/Order';

const Cat = Category;
const Prod = Product;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const sku  = (prefix: string, i: number) => `${prefix}-${String(i).padStart(4, '0')}`;

// ─── Placeholders (Unsplash CDN — royalty-free) ───────────────────────────────
const FASHION_IMAGES = {
  anarkali:    ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800','https://images.unsplash.com/photo-1614251056798-0a63eda2bb25?w=800'],
  lehenga:     ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800','https://images.unsplash.com/photo-1591093803775-fc1b9c4fa61b?w=800'],
  saree:       ['https://images.unsplash.com/photo-1617627143233-f95b7fce1b3f?w=800','https://images.unsplash.com/photo-1583391733987-e2c4b7290c3a?w=800'],
  kurta:       ['https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=800','https://images.unsplash.com/photo-1614251056818-9d1e71a685bb?w=800'],
  dress:       ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800','https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'],
  coord:       ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
  kaftan:      ['https://images.unsplash.com/photo-1583391733987-e2c4b7290c3a?w=800','https://images.unsplash.com/photo-1617627143233-f95b7fce1b3f?w=800'],
  top:         ['https://images.unsplash.com/photo-1533659124865-d6072dc035e1?w=800','https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'],
  jeans:       ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800','https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
  heels:       ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800','https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800'],
  flats:       ['https://images.unsplash.com/photo-1508215885820-4585e56135c8?w=800','https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=800'],
  bag:         ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800','https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800'],
  jewellery:   ['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800','https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800'],
  scarf:       ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
  menKurta:    ['https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=800','https://images.unsplash.com/photo-1614251056818-9d1e71a685bb?w=800'],
  menShirt:    ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800','https://images.unsplash.com/photo-1621570730204-6b399c05e140?w=800'],
  menJeans:    ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800','https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
  menShoes:    ['https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800','https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
};

const SIZES_XS_XL  = ['XS','S','M','L','XL'];
const SIZES_NUM    = ['36','37','38','39','40','41'];
const COLORS_ETHNIC = [
  { color: 'Ivory',       hex: '#FFFFF0' },
  { color: 'Rose Gold',   hex: '#B76E79' },
  { color: 'Midnight',    hex: '#191970' },
  { color: 'Emerald',     hex: '#50C878' },
  { color: 'Rust',        hex: '#B7410E' },
  { color: 'Mustard',     hex: '#FFDB58' },
  { color: 'Teal',        hex: '#008080' },
  { color: 'Blush',       hex: '#DE5D83' },
];
const COLORS_CASUAL = [
  { color: 'Black',  hex: '#1A1A1A' },
  { color: 'White',  hex: '#FFFFFF' },
  { color: 'Camel',  hex: '#C19A6B' },
  { color: 'Olive',  hex: '#808000' },
  { color: 'Navy',   hex: '#000080' },
  { color: 'Blush',  hex: '#DE5D83' },
];

const makeVariants = (sizes: string[], colors: typeof COLORS_ETHNIC, base: number) =>
  sizes.flatMap((size) =>
    colors.slice(0, 3).map((c) => ({
      size, color: c.color, colorHex: c.hex,
      stock: Math.floor(Math.random() * 50) + 5,
      price: base + Math.round(Math.random() * 200 - 100),
      sku: `VAR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    }))
  );

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seed() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/stylehub';
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  // Clear existing
  await Promise.all([
    Cat.deleteMany({}), Vendor.deleteMany({}), Prod.deleteMany({}),
    User.deleteMany({}), CmsPage.deleteMany({}), Banner.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // ── Categories ────────────────────────────────────────────────────────────
  const categories = await Cat.insertMany([
    { name: 'Ethnic Wear',  slug: 'ethnic',      description: 'Kurtas, sarees, lehengas and anarkalis', image: FASHION_IMAGES.anarkali[0], order: 1 },
    { name: 'Dresses',      slug: 'dresses',     description: 'Maxis, minis and midi dresses',          image: FASHION_IMAGES.dress[0],    order: 2 },
    { name: 'Tops',         slug: 'tops',        description: 'Crop tops, blouses and casual tops',      image: FASHION_IMAGES.top[0],      order: 3 },
    { name: 'Denim',        slug: 'denim',       description: 'Jeans, shorts and denim jackets',         image: FASHION_IMAGES.jeans[0],    order: 4 },
    { name: 'Footwear',     slug: 'footwear',    description: 'Heels, flats, sandals and sneakers',      image: FASHION_IMAGES.heels[0],    order: 5 },
    { name: 'Accessories',  slug: 'accessories', description: 'Bags, jewellery, scarves and belts',      image: FASHION_IMAGES.jewellery[0],order: 6 },
    { name: 'Co-ord Sets',  slug: 'coord-sets',  description: 'Matching two and three piece sets',       image: FASHION_IMAGES.coord[0],    order: 7 },
    { name: 'Kaftans',      slug: 'kaftans',     description: 'Relaxed kaftans and lounge wear',         image: FASHION_IMAGES.kaftan[0],   order: 8 },
  ]);
  const [ethnic, dresses, tops, denim, footwear, accessories, coords, kaftans] = categories;
  console.log(`✅ Seeded ${categories.length} categories`);

  const vendorUserId = new mongoose.Types.ObjectId();

  // ── Vendors ───────────────────────────────────────────────────────────────
  const vendors = await Vendor.insertMany([
    { 
      user: vendorUserId, 
      storeName: 'DesiCouture', 
      storeSlug: 'desicouture', 
      storeLogo: FASHION_IMAGES.anarkali[0], 
      storeBanner: FASHION_IMAGES.lehenga[0], 
      storeDescription: 'Premium ethnic wear from Jaipur artisans. Specializing in hand-embroidered anarkalis and lehengas.', 
      storeLocation: 'Jaipur, Rajasthan',
      businessName: 'DesiCouture Apparel Private Limited',
      storeTags: ['ethnic', 'handcrafted', 'saree'],
      status: 'approved',
    },
    { 
      user: new mongoose.Types.ObjectId(), 
      storeName: 'UrbanThreads', 
      storeSlug: 'urbanthreads', 
      storeLogo: FASHION_IMAGES.dress[0], 
      storeBanner: FASHION_IMAGES.coord[0], 
      storeDescription: 'Contemporary fashion for the modern woman. Trending dresses and co-ord sets.', 
      storeLocation: 'Mumbai, Maharashtra',
      businessName: 'UrbanThreads Fashion',
      storeTags: ['casual', 'dresses', 'contemporary'],
      status: 'approved',
    },
    { 
      user: new mongoose.Types.ObjectId(), 
      storeName: 'SoleMate', 
      storeSlug: 'solemate', 
      storeLogo: FASHION_IMAGES.heels[0], 
      storeBanner: FASHION_IMAGES.flats[0], 
      storeDescription: 'Handcrafted footwear that blends comfort with style. Every pair tells a story.', 
      storeLocation: 'Agra, Uttar Pradesh',
      businessName: 'SoleMate Footwear Corp',
      storeTags: ['heels', 'flats', 'leather'],
      status: 'approved',
    },
    { 
      user: new mongoose.Types.ObjectId(), 
      storeName: 'GlimmerCo', 
      storeSlug: 'glimmerco', 
      storeLogo: FASHION_IMAGES.jewellery[0], 
      storeBanner: FASHION_IMAGES.bag[0], 
      storeDescription: 'Fine fashion jewellery and luxury accessories curated for the discerning shopper.', 
      storeLocation: 'Chennai, Tamil Nadu',
      businessName: 'GlimmerCo Accessories',
      storeTags: ['jewellery', 'bags', 'luxury'],
      status: 'approved',
    },
    { 
      user: new mongoose.Types.ObjectId(), 
      storeName: 'VelveteenRose', 
      storeSlug: 'velveteen-rose', 
      storeLogo: FASHION_IMAGES.top[0], 
      storeBanner: FASHION_IMAGES.kaftan[0], 
      storeDescription: 'Boho-chic kaftans, tops and loungewear inspired by the coastal lifestyle.', 
      storeLocation: 'Goa',
      businessName: 'VelveteenRose Boutique',
      storeTags: ['kaftans', 'boho', 'resort'],
      status: 'approved',
    },
  ]);
  const [dc, ut, sm, gc, vr] = vendors;

  console.log(`✅ Seeded ${vendors.length} vendors`);

  // ── Products (30+) ────────────────────────────────────────────────────────
  // ── Products (60) ─────────────────────────────────────────────────────────
  // ── Products (60) ─────────────────────────────────────────────────────────
  // ── Products (60) ─────────────────────────────────────────────────────────
  // ── Products (65) ─────────────────────────────────────────────────────────
  // ── Products (65) ─────────────────────────────────────────────────────────
  const rawProducts = [
    // ==========================================
    // ── MEN'S PRODUCTS (10 Non-Accessories) ──
    // ==========================================
    {
      name: "Traditional Indigo Block Print Kurta", slug: 'traditional-indigo-block-print-kurta',
      sku: sku('DC', 1), description: 'Handcrafted cotton kurta in deep indigo with traditional Rajasthani block print. Relaxed and lightweight.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.menKurta,
      basePrice: 1899, discountPct: 10, tags: ['ethnic','kurta','men','block-print'],
      material: '100% Khadi Cotton', careInstructions: 'Hand wash cold. Dry in shade.',
      rating: 4.7, reviewCount: 94, isFeatured: true, isNew: true, isTrending: false,
      gender: 'men',
      variants: makeVariants(['S','M','L','XL','XXL'], [COLORS_ETHNIC[6]!, COLORS_ETHNIC[2]!], 1899),
    },
    {
      name: 'Breezy Classic Linen Shirt', slug: 'breezy-classic-linen-shirt',
      sku: sku('UT', 1), description: 'Breezy and comfortable white linen shirt with a classic collar. Perfect for everyday casual wear.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.menShirt,
      basePrice: 2199, discountPct: 0, tags: ['shirt','linen','men','casual'],
      material: '100% Pure Linen', careInstructions: 'Machine wash cold. Warm iron.',
      rating: 4.8, reviewCount: 128, isFeatured: true, isNew: true, isTrending: true,
      gender: 'men',
      variants: makeVariants(['S','M','L','XL','XXL'], [COLORS_CASUAL[1]!, COLORS_CASUAL[3]!], 2199),
    },
    {
      name: 'Vintage Indigo Denim Trucker Jacket', slug: 'vintage-indigo-denim-trucker-jacket',
      sku: sku('UT', 2), description: 'Rugged yet styled denim jacket in authentic indigo wash. Heavyweight premium denim with metal buttons.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.menJeans,
      basePrice: 3499, discountPct: 15, tags: ['denim','jacket','men','outerwear'],
      material: '100% Cotton Denim', careInstructions: 'Machine wash cold inside out.',
      rating: 4.9, reviewCount: 212, isFeatured: false, isNew: true, isTrending: true,
      gender: 'men',
      variants: makeVariants(['S','M','L','XL','XXL'], [COLORS_CASUAL[4]!, COLORS_CASUAL[0]!], 3499),
    },
    {
      name: 'Handcrafted Tan Leather Loafers', slug: 'handcrafted-tan-leather-loafers',
      sku: sku('SM', 1), description: 'Handcrafted loafers in genuine tan leather with cushioned insoles and durable rubber outsoles.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.menShoes,
      basePrice: 3299, discountPct: 5, tags: ['shoes','loafers','men','leather'],
      material: 'Premium Full Grain Leather', careInstructions: 'Wipe clean. Apply shoe cream.',
      rating: 4.6, reviewCount: 78, isFeatured: true, isNew: true, isTrending: false,
      gender: 'men',
      variants: makeVariants(['40','41','42','43','44','45'], [{ color: 'Tan', hex: '#D2B48C' }, { color: 'Black', hex: '#1A1A1A' }], 3299),
    },
    {
      name: 'Dupion Silk Nehru Jacket', slug: 'dupion-silk-nehru-jacket',
      sku: sku('DC', 2), description: 'Elegant Nehru jacket in textured dupion silk. Features a mandarin collar and classic pocket square detailing.',
      category: ethnic._id, vendor: dc._id, images: [FASHION_IMAGES.menKurta[1]!, FASHION_IMAGES.menKurta[0]!],
      basePrice: 2999, discountPct: 10, tags: ['ethnic','nehru-jacket','men','festive'],
      material: 'Dupion Silk', careInstructions: 'Dry clean only.',
      rating: 4.7, reviewCount: 83, isFeatured: false, isNew: false, isTrending: true,
      gender: 'men',
      variants: makeVariants(['S','M','L','XL','XXL'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[3]!, COLORS_ETHNIC[2]!], 2999),
    },
    {
      name: 'Active Stretch Slim Fit Jeans', slug: 'active-stretch-slim-fit-jeans',
      sku: sku('UT', 3), description: 'Modern slim fit denim in dark charcoal wash. Built with active stretch comfort technology.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.menJeans,
      basePrice: 2499, discountPct: 12, tags: ['denim','jeans','men','casual'],
      material: '98% Cotton, 2% Elastane', careInstructions: 'Machine wash cold inside out.',
      rating: 4.5, reviewCount: 65, isFeatured: false, isNew: false, isTrending: false,
      gender: 'men',
      variants: makeVariants(['30','32','34','36'], [COLORS_CASUAL[0]!, COLORS_CASUAL[4]!], 2499),
    },
    {
      name: 'Organic Cotton Crewneck Tee', slug: 'organic-cotton-crewneck-tee',
      sku: sku('UT', 4), description: 'Ultra-soft organic cotton t-shirt. The perfect base layer for any casual outfit.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.menShirt,
      basePrice: 999, discountPct: 0, tags: ['top','tee','men','basics'],
      material: '100% Organic Cotton', careInstructions: 'Machine wash warm, tumble dry low.',
      rating: 4.7, reviewCount: 142, isFeatured: false, isNew: false, isTrending: true,
      gender: 'men',
      variants: makeVariants(['S','M','L','XL'], [COLORS_CASUAL[0]!, COLORS_CASUAL[1]!], 999),
    },
    {
      name: 'Italian Suede Chelsea Boots', slug: 'italian-suede-chelsea-boots',
      sku: sku('SM', 2), description: 'Heritage style chelsea boots in luxury Italian suede with elasticated side panels.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.menShoes,
      basePrice: 4999, discountPct: 10, tags: ['shoes','boots','men','suede'],
      material: 'Italian Suede Leather', careInstructions: 'Use suede protector spray before wearing.',
      rating: 4.8, reviewCount: 57, isFeatured: true, isNew: false, isTrending: true,
      gender: 'men',
      variants: makeVariants(['40','41','42','43','44'], [{ color: 'Brown', hex: '#8B4513' }], 4999),
    },
    {
      name: 'Urban Utility Cargo Joggers', slug: 'urban-utility-cargo-joggers',
      sku: sku('UT', 5), description: 'Relaxed cargo pants with elastic cuffs and multiple utility pockets. Styled for urban exploration.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.menJeans,
      basePrice: 2799, discountPct: 15, tags: ['denim','cargo','men','streetwear'],
      material: '100% Cotton Twill', careInstructions: 'Machine wash cold with similar colors.',
      rating: 4.4, reviewCount: 89, isFeatured: false, isNew: true, isTrending: false,
      gender: 'men',
      variants: makeVariants(['30','32','34','36'], [COLORS_CASUAL[3]!], 2799),
    },
    {
      name: 'Heavyweight Canvas Utility Overshirt', slug: 'heavyweight-canvas-utility-overshirt',
      sku: sku('UT', 6), description: 'Rugged shirt-jacket with double chest pockets and heavy-duty button closures. Versatile seasonal layering.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.menShirt,
      basePrice: 2399, discountPct: 10, tags: ['shirt','overshirt','men','layering'],
      material: '100% Heavy Cotton Canvas', careInstructions: 'Machine wash warm. Tumble dry medium.',
      rating: 4.6, reviewCount: 110, isFeatured: false, isNew: false, isTrending: true,
      gender: 'men',
      variants: makeVariants(['S','M','L','XL'], [COLORS_CASUAL[3]!, COLORS_CASUAL[1]!], 2399),
    },

    // ==========================================
    // ── WOMEN'S PRODUCTS (10 Non-Accessories) ──
    // ==========================================
    {
      name: 'Zari Embroidered Anarkali Kurta', slug: 'zari-embroidered-anarkali-kurta',
      sku: sku('DC', 3), description: 'A timeless ivory anarkali with delicate hand-embroidery in gold thread. Paired with a churidar and dupatta.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.anarkali,
      basePrice: 3499, discountPct: 15, tags: ['ethnic','anarkali','wedding'],
      material: '80% Pure Cotton, 20% Silk Blend', careInstructions: 'Dry clean only. Store in a muslin bag.',
      rating: 4.9, reviewCount: 482, isFeatured: true, isNew: false, isTrending: true,
      gender: 'women',
      variants: makeVariants(['S','M','L','XL'], [COLORS_ETHNIC[0]!], 3499),
    },
    {
      name: 'Crimson Banarasi Lehenga Choli', slug: 'crimson-banarasi-lehenga-choli',
      sku: sku('DC', 4), description: 'Bridal-grade crimson lehenga with zari embroidery and matching blouse. Perfect for weddings and receptions.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.lehenga,
      basePrice: 12999, discountPct: 20, tags: ['bridal','lehenga','wedding'],
      material: 'Banarasi Silk, Velvet Border', careInstructions: 'Dry clean only.',
      rating: 4.8, reviewCount: 134, isFeatured: true, isNew: true, isTrending: false,
      gender: 'women',
      variants: makeVariants(['S','M','L'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[0]!], 12999),
    },
    {
      name: 'Georgette Bandhani Saree', slug: 'georgette-bandhani-saree',
      sku: sku('DC', 5), description: 'Hand-tied bandhani saree in rich teal with golden zari border. Includes an unstitched blouse piece.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.saree,
      basePrice: 4999, discountPct: 10, tags: ['saree','bandhani','ethnic'],
      material: 'Pure Georgette', careInstructions: 'Hand wash only.',
      rating: 4.6, reviewCount: 87, isFeatured: true, isNew: true, isTrending: false,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Teal', colorHex: '#008080', stock: 20, price: 4999, sku: 'DC-GBS-001-FS' },
      ],
    },
    {
      name: 'Flutter Sleeve Floral Maxi Dress', slug: 'flutter-sleeve-floral-maxi-dress',
      sku: sku('UT', 7), description: 'Floor-length maxi in midnight navy with delicate floral print. Features a flutter sleeve and ruched waist.',
      category: dresses._id, vendor: ut._id, images: FASHION_IMAGES.dress,
      basePrice: 2899, discountPct: 10, tags: ['maxi','floral','dress'],
      material: 'Viscose Rayon', careInstructions: 'Machine wash gentle. Tumble dry low.',
      rating: 4.8, reviewCount: 234, isFeatured: true, isNew: false, isTrending: true,
      gender: 'women',
      variants: makeVariants(['XS','S','M','L','XL'], [COLORS_CASUAL[2]!, COLORS_CASUAL[0]!], 2899),
    },
    {
      name: 'Blush Cowl Neck Satin Slip Dress', slug: 'blush-cowl-neck-satin-slip-dress',
      sku: sku('UT', 8), description: 'Elegant satin slip dress in blush with adjustable spaghetti straps. Perfect for date nights.',
      category: dresses._id, vendor: ut._id, images: [FASHION_IMAGES.dress[1]!, FASHION_IMAGES.dress[0]!],
      basePrice: 1999, discountPct: 5, tags: ['dress','satin','evening'],
      material: '100% Satin', careInstructions: 'Hand wash cold.',
      rating: 4.6, reviewCount: 189, isFeatured: false, isNew: true, isTrending: false,
      gender: 'women',
      variants: makeVariants(['S','M','L'], [COLORS_CASUAL[1]!], 1999),
    },
    {
      name: 'Oversized Pure Linen Shirt', slug: 'oversized-pure-linen-shirt',
      sku: sku('VR', 1), description: 'Oversized linen shirt in sage green. Wear open as a jacket or buttoned up. Versatile wardrobe essential.',
      category: tops._id, vendor: vr._id, images: FASHION_IMAGES.top,
      basePrice: 1799, discountPct: 0, tags: ['top','linen','shirt','versatile'],
      material: '100% Linen', careInstructions: 'Machine wash cold.',
      rating: 4.7, reviewCount: 203, isFeatured: true, isNew: false, isTrending: true,
      gender: 'women',
      variants: makeVariants(['S','M','L','XL'], [COLORS_CASUAL[1]!, COLORS_CASUAL[3]!], 1799),
    },
    {
      name: 'Classic High-Rise Straight Jeans', slug: 'classic-high-rise-straight-jeans',
      sku: sku('UT', 9), description: 'Classic high-rise straight cut in authentic denim. Timeless, flattering silhouette.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.jeans,
      basePrice: 2299, discountPct: 10, tags: ['denim','jeans','classic'],
      material: '98% Cotton, 2% Elastane', careInstructions: 'Machine wash cold inside out.',
      rating: 4.8, reviewCount: 567, isFeatured: false, isNew: false, isTrending: true,
      gender: 'women',
      variants: makeVariants(['26','28','30','32'], [COLORS_CASUAL[0]!, COLORS_CASUAL[4]!], 2299),
    },
    {
      name: 'Coastal Block Print Cotton Kaftan', slug: 'coastal-block-print-cotton-kaftan',
      sku: sku('VR', 2), description: 'Vibrant block-print kaftan in lightweight cotton. Breezy beach cover-up or loungewear.',
      category: kaftans._id, vendor: vr._id, images: FASHION_IMAGES.kaftan,
      basePrice: 2099, discountPct: 12, tags: ['kaftan','resort','boho'],
      material: '100% Cotton', careInstructions: 'Machine wash cold.',
      rating: 4.5, reviewCount: 167, isFeatured: true, isNew: false, isTrending: false,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Orange', colorHex: '#FF7F50', stock: 40, price: 2099, sku: 'VR-BPK-001-FS' },
      ],
    },
    {
      name: 'Metallic Gold Strappy Heels', slug: 'metallic-gold-strappy-heels',
      sku: sku('SM', 3), description: 'Handcrafted gold strappy block heels with ankle tie. 3-inch heel height, padded insole for all-day comfort.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.heels,
      basePrice: 2799, discountPct: 10, tags: ['heels','gold','party'],
      material: 'Metallic Leather Upper, Memory Foam Insole', careInstructions: 'Wipe clean with damp cloth.',
      rating: 4.7, reviewCount: 198, isFeatured: true, isNew: false, isTrending: true,
      gender: 'women',
      variants: makeVariants(['36','37','38','39','40'], [{ color: 'Gold', hex: '#FFD700' }], 2799),
    },
    {
      name: 'Ribbed Knit Longline Co-ord Set', slug: 'ribbed-knit-longline-co-ord-set',
      sku: sku('UT', 10), description: 'Luxe ribbed knit co-ord in camel. Longline blazer + straight-leg trousers. The power suit reinvented.',
      category: coords._id, vendor: ut._id, images: FASHION_IMAGES.coord,
      basePrice: 3999, discountPct: 15, tags: ['coord','knit','power suit'],
      material: '65% Acrylic, 35% Wool Blend', careInstructions: 'Dry clean only.',
      rating: 4.9, reviewCount: 189, isFeatured: true, isNew: false, isTrending: true,
      gender: 'women',
      variants: makeVariants(['S','M','L'], [COLORS_CASUAL[3]!], 3999),
    },

    // ==========================================
    // ── BOYS' PRODUCTS (10 Non-Accessories) ──
    // ==========================================
    {
      name: 'Geometric Pattern Cotton Kurta', slug: 'geometric-pattern-cotton-kurta',
      sku: sku('DC', 6), description: 'Soft, breathable cotton kurta for boys with mini geometric print. Comfort fit for all festive wear.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.menKurta,
      basePrice: 899, discountPct: 5, tags: ['ethnic','kurta','boys','cotton'],
      material: '100% Pure Cotton', careInstructions: 'Machine wash cold. Dry in shade.',
      rating: 4.6, reviewCount: 42, isFeatured: true, isNew: true, isTrending: true,
      gender: 'boys',
      variants: makeVariants(['4-5Y','6-7Y','8-9Y'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[2]!], 899),
    },
    {
      name: 'Mandarin Collar Cotton Linen Shirt', slug: 'mandarin-collar-cotton-linen-shirt',
      sku: sku('UT', 11), description: 'Smart linen shirt for boys with high mandarin collar. Light, airy, and styled for warm afternoons.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.menShirt,
      basePrice: 1199, discountPct: 0, tags: ['shirt','linen','boys','smart-casual'],
      material: '60% Linen, 40% Cotton', careInstructions: 'Machine wash gentle. Warm iron.',
      rating: 4.7, reviewCount: 54, isFeatured: false, isNew: true, isTrending: false,
      gender: 'boys',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[1]!, COLORS_CASUAL[3]!], 1199),
    },
    {
      name: 'Ripped Wash Denim Jacket', slug: 'ripped-wash-denim-jacket',
      sku: sku('UT', 12), description: 'Cool and classic denim jacket with front button pockets. A must-have outer layer for dynamic boys.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.menJeans,
      basePrice: 1899, discountPct: 10, tags: ['denim','jacket','boys','outerwear'],
      material: '100% Cotton Indigo Denim', careInstructions: 'Wash cold inside out. Color may bleed.',
      rating: 4.8, reviewCount: 38, isFeatured: true, isNew: false, isTrending: true,
      gender: 'boys',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[4]!, COLORS_CASUAL[0]!], 1899),
    },
    {
      name: 'Artisan Leather Slip-On Shoes', slug: 'artisan-leather-slip-on-shoes',
      sku: sku('SM', 4), description: 'Premium leather shoes with elastic side gussets for easy wear. Padded ankle cuff for soft support.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.menShoes,
      basePrice: 1599, discountPct: 5, tags: ['shoes','slip-ons','boys','leather'],
      material: 'Genuine Leather, Rubber Sole', careInstructions: 'Wipe with leather cleaner.',
      rating: 4.5, reviewCount: 29, isFeatured: false, isNew: false, isTrending: false,
      gender: 'boys',
      variants: makeVariants(['28','30','32','34'], [{ color: 'Tan', hex: '#D2B48C' }], 1599),
    },
    {
      name: 'Three-Piece Silk Blend Ethnic Set', slug: 'three-piece-silk-blend-ethnic-set',
      sku: sku('DC', 7), description: 'Three-piece outfit: Kurta, Pyjama, and contrast Nehru Jacket. Perfect for Diwali and family weddings.',
      category: ethnic._id, vendor: dc._id, images: [FASHION_IMAGES.menKurta[1]!, FASHION_IMAGES.menKurta[0]!],
      basePrice: 2499, discountPct: 15, tags: ['ethnic','nehru-jacket','boys','festive'],
      material: 'Silk Blend', careInstructions: 'Dry clean only.',
      rating: 4.9, reviewCount: 68, isFeatured: true, isNew: true, isTrending: true,
      gender: 'boys',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[3]!], 2499),
    },
    {
      name: 'Casual Solid Crewneck Tee', slug: 'casual-solid-crewneck-tee',
      sku: sku('UT', 13), description: 'Everyday comfortable crewneck t-shirt in pure organic cotton. Soft and durable.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.menShirt,
      basePrice: 699, discountPct: 0, tags: ['top','tee','boys','casual'],
      material: '100% Organic Cotton', careInstructions: 'Machine wash cold.',
      rating: 4.7, reviewCount: 110, isFeatured: false, isNew: false, isTrending: true,
      gender: 'boys',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[0]!, COLORS_CASUAL[1]!], 699),
    },
    {
      name: 'Relaxed Fit Ripped Denim Jeans', slug: 'relaxed-fit-ripped-denim-jeans',
      sku: sku('UT', 14), description: 'Trendy ripped details in a relaxed straight-leg denim. Adjustable internal waist band.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.menJeans,
      basePrice: 1499, discountPct: 10, tags: ['denim','jeans','boys','trendy'],
      material: '98% Cotton, 2% Spandex', careInstructions: 'Machine wash warm inside out.',
      rating: 4.6, reviewCount: 45, isFeatured: false, isNew: true, isTrending: false,
      gender: 'boys',
      variants: makeVariants(['8-9Y','10-11Y','12-13Y'], [COLORS_CASUAL[0]!, COLORS_CASUAL[4]!], 1499),
    },
    {
      name: 'Vulcanized Canvas Sneakers', slug: 'vulcanized-canvas-sneakers',
      sku: sku('SM', 5), description: 'Lace-up sneakers in durable canvas with dual-density rubber toe cap for playgrounds.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.menShoes,
      basePrice: 1099, discountPct: 0, tags: ['shoes','sneakers','boys','canvas'],
      material: 'Canvas Upper, Vulcanized Sole', careInstructions: 'Hand wash. Air dry.',
      rating: 4.5, reviewCount: 63, isFeatured: false, isNew: false, isTrending: false,
      gender: 'boys',
      variants: makeVariants(['28','30','32','34'], [COLORS_CASUAL[0]!], 1099),
    },
    {
      name: 'Twill Utility Cargo Shorts', slug: 'twill-utility-cargo-shorts',
      sku: sku('UT', 15), description: 'Adventure-ready cargo shorts with utility flap pockets. Soft elastic waist loops.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.menJeans,
      basePrice: 999, discountPct: 5, tags: ['denim','shorts','boys','cargo'],
      material: '100% Cotton Cargo Twill', careInstructions: 'Machine wash cold.',
      rating: 4.4, reviewCount: 31, isFeatured: false, isNew: true, isTrending: false,
      gender: 'boys',
      variants: makeVariants(['4-5Y','6-7Y','8-9Y'], [COLORS_CASUAL[3]!], 999),
    },
    {
      name: 'Classic Striped Piqué Polo', slug: 'classic-striped-pique-polo',
      sku: sku('UT', 16), description: 'Classic cotton piqué polo with athletic stripes. Embroidered crest detail on chest.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.menShirt,
      basePrice: 899, discountPct: 10, tags: ['top','polo','boys','sporty'],
      material: '100% Cotton Piqué', careInstructions: 'Machine wash gentle. Flat dry.',
      rating: 4.6, reviewCount: 52, isFeatured: false, isNew: false, isTrending: true,
      gender: 'boys',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[0]!, COLORS_CASUAL[2]!], 899),
    },

    // ==========================================
    // ── GIRLS' PRODUCTS (10 Non-Accessories) ──
    // ==========================================
    {
      name: 'Floral Zari Net Lehenga Choli', slug: 'floral-zari-net-lehenga-choli',
      sku: sku('DC', 8), description: 'Charming girls lehenga set with floral thread work and net dupatta. Breathable lining inside.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.lehenga,
      basePrice: 1999, discountPct: 10, tags: ['ethnic','lehenga','girls','festive'],
      material: 'Georgette Silk, Cotton Lining', careInstructions: 'Dry clean recommended.',
      rating: 4.8, reviewCount: 53, isFeatured: true, isNew: true, isTrending: true,
      gender: 'girls',
      variants: makeVariants(['4-5Y','6-7Y','8-9Y'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[0]!], 1999),
    },
    {
      name: 'Tiered Garden Floral Cotton Frock', slug: 'tiered-garden-floral-cotton-frock',
      sku: sku('UT', 17), description: 'Frock dress with flared tiered hem and tie-up back sash. Covered in hand-printed garden florals.',
      category: dresses._id, vendor: ut._id, images: FASHION_IMAGES.dress,
      basePrice: 1299, discountPct: 5, tags: ['dress','floral','girls','party'],
      material: '100% Muslin Cotton', careInstructions: 'Hand wash cold. Dry in shade.',
      rating: 4.7, reviewCount: 74, isFeatured: true, isNew: true, isTrending: true,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[1]!, COLORS_CASUAL[2]!], 1299),
    },
    {
      name: 'Classic Overall Denim Pinafore', slug: 'classic-overall-denim-pinafore',
      sku: sku('UT', 18), description: 'Classic overall dress in soft pre-washed denim. Adjustable metal slides on straps.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.jeans,
      basePrice: 1499, discountPct: 10, tags: ['denim','dress','girls','casual'],
      material: '98% Cotton Denim, 2% Lycra', careInstructions: 'Machine wash cold.',
      rating: 4.6, reviewCount: 29, isFeatured: false, isNew: true, isTrending: false,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[0]!, COLORS_CASUAL[4]!], 1499),
    },
    {
      name: 'Vegan Leather Mary Jane Flats', slug: 'vegan-leather-mary-jane-flats',
      sku: sku('SM', 6), description: 'Charming flat shoes with secure hook-and-loop strap. Accent bow detailing on front toe.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.flats,
      basePrice: 1199, discountPct: 0, tags: ['shoes','flats','girls','casual'],
      material: 'Soft Vegan Leather, Flexible Sole', careInstructions: 'Wipe clean.',
      rating: 4.5, reviewCount: 46, isFeatured: true, isNew: false, isTrending: false,
      gender: 'girls',
      variants: makeVariants(['26','28','30','32'], [COLORS_CASUAL[1]!], 1199),
    },
    {
      name: 'Sharara Pants & Block Print Kurti Set', slug: 'sharara-pants-and-block-print-kurti-set',
      sku: sku('DC', 9), description: 'Traditional Jaipur block-print short kurti with flared sharara pants. Bright, light, and comfortable.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.menKurta,
      basePrice: 1599, discountPct: 10, tags: ['ethnic','kurta','girls','cotton'],
      material: '100% Jaipur Cotton', careInstructions: 'Wash separately in cold water.',
      rating: 4.7, reviewCount: 39, isFeatured: false, isNew: false, isTrending: true,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[2]!], 1599),
    },
    {
      name: 'Ruffled Cap Sleeve Linen Top', slug: 'ruffled-cap-sleeve-linen-top',
      sku: sku('VR', 3), description: 'Breezy linen-blend top featuring dual layered ruffles on cap sleeves. Styled for sunny days.',
      category: tops._id, vendor: vr._id, images: FASHION_IMAGES.top,
      basePrice: 799, discountPct: 0, tags: ['top','ruffles','girls','summer'],
      material: '70% Cotton, 30% Linen', careInstructions: 'Machine wash warm.',
      rating: 4.4, reviewCount: 31, isFeatured: false, isNew: false, isTrending: false,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y'], [COLORS_CASUAL[1]!], 799),
    },
    {
      name: 'Glitter Mesh Ballerina Flats', slug: 'glitter-mesh-ballerina-flats',
      sku: sku('SM', 7), description: 'Party-perfect ballerina flats covered in subtle glitter mesh. Non-slip outsole.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.heels,
      basePrice: 1399, discountPct: 10, tags: ['shoes','flats','girls','glitter'],
      material: 'Glitter Mesh Upper, Synthetic Sole', careInstructions: 'Gently wipe with dry brush.',
      rating: 4.6, reviewCount: 52, isFeatured: true, isNew: true, isTrending: true,
      gender: 'girls',
      variants: makeVariants(['28','30','32','34'], [{ color: 'Silver', hex: '#C0C0C0' }], 1399),
    },
    {
      name: 'Coral Strappy Tiered Sundress', slug: 'coral-strappy-tiered-sundress',
      sku: sku('UT', 19), description: 'Fluid tiered skirt dress in bright coral with easy spaghetti shoulder ties.',
      category: dresses._id, vendor: ut._id, images: FASHION_IMAGES.dress,
      basePrice: 1199, discountPct: 5, tags: ['dress','sundress','girls','vacation'],
      material: 'Rayon Challis', careInstructions: 'Machine wash gentle. Tumble dry low.',
      rating: 4.5, reviewCount: 41, isFeatured: false, isNew: true, isTrending: false,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[2]!], 1199),
    },
    {
      name: 'Embroidered Frayed Denim Shorts', slug: 'embroidered-frayed-denim-shorts',
      sku: sku('UT', 20), description: 'Soft denim shorts with frayed edges and cute embroidery motifs on front pockets.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.jeans,
      basePrice: 899, discountPct: 0, tags: ['denim','shorts','girls','embroidered'],
      material: '99% Cotton, 1% Spandex', careInstructions: 'Machine wash cold.',
      rating: 4.5, reviewCount: 22, isFeatured: false, isNew: false, isTrending: false,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y'], [COLORS_CASUAL[0]!], 899),
    },
    {
      name: 'Pointelle Knit Pastel Cardigan', slug: 'pointelle-knit-pastel-cardigan',
      sku: sku('UT', 21), description: 'Cozy pointelle knit cardigan in sweet pastel pink. Contrast wood-look buttons.',
      category: tops._id, vendor: ut._id, images: FASHION_IMAGES.top,
      basePrice: 1399, discountPct: 5, tags: ['top','cardigan','girls','knitwear'],
      material: '100% Fine Acrylic Yarn', careInstructions: 'Hand wash warm. Lay flat to dry.',
      rating: 4.8, reviewCount: 56, isFeatured: false, isNew: false, isTrending: true,
      gender: 'girls',
      variants: makeVariants(['6-7Y','8-9Y','10-11Y'], [COLORS_CASUAL[1]!], 1399),
    },

    // ==========================================
    // ── ACCESSORIES (20 Products) ──
    // ==========================================
    // MEN'S ACCESSORIES (5)
    {
      name: 'Full-Grain Leather Belt', slug: 'full-grain-leather-belt',
      sku: sku('GC', 1), description: 'Genuine full-grain leather belt with solid brass buckle. Brushed hardware finish.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.bag,
      basePrice: 1299, discountPct: 0, tags: ['accessories','belt','men','leather'],
      material: 'Full-Grain Leather', careInstructions: 'Clean with dry cloth. Apply leather lotion.',
      rating: 4.8, reviewCount: 97, isFeatured: true, isNew: false, isTrending: true,
      gender: 'men',
      variants: [
        { size: 'Free Size', color: 'Brown', colorHex: '#8B4513', stock: 45, price: 1299, sku: 'GC-BLT-001' },
        { size: 'Free Size', color: 'Black', colorHex: '#1A1A1A', stock: 40, price: 1299, sku: 'GC-BLT-002' },
      ],
    },
    {
      name: 'RFID Blocking Leather Cardholder', slug: 'rfid-blocking-leather-cardholder',
      sku: sku('GC', 2), description: 'Sleek wallet cardholder with 4 card slots and central cash sleeve. RFID blocking design.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.bag,
      basePrice: 899, discountPct: 10, tags: ['accessories','wallet','men','minimal'],
      material: 'Vegetable Tanned Leather', careInstructions: 'Wipe with soft damp cloth.',
      rating: 4.7, reviewCount: 112, isFeatured: false, isNew: true, isTrending: false,
      gender: 'men',
      variants: [
        { size: 'Free Size', color: 'Tan', colorHex: '#D2B48C', stock: 80, price: 899, sku: 'GC-WLT-001' },
      ],
    },
    {
      name: 'Stainless Steel Chronograph Watch', slug: 'stainless-steel-chronograph-watch',
      sku: sku('GC', 3), description: 'Premium quartz chronograph watch in polished stainless steel case and link bracelet.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'],
      basePrice: 5999, discountPct: 15, tags: ['accessories','watch','men','formal'],
      material: 'Stainless Steel Case, Hardened Mineral Glass', careInstructions: 'Water resistant to 50m. Wipe clean.',
      rating: 4.9, reviewCount: 54, isFeatured: true, isNew: true, isTrending: true,
      gender: 'men',
      variants: [
        { size: 'Free Size', color: 'Silver/Black', colorHex: '#C0C0C0', stock: 25, price: 5999, sku: 'GC-WCH-001' },
      ],
    },
    {
      name: 'Polarized Aviator Sunglasses', slug: 'polarized-aviator-sunglasses',
      sku: sku('GC', 4), description: 'Iconic aviator frame sunglasses with polarized lenses. 100% UVA/UVB protection.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'],
      basePrice: 1499, discountPct: 5, tags: ['accessories','eyewear','men','summer'],
      material: 'Metal Alloy Frame, Polycarbonate Lenses', careInstructions: 'Clean lenses with microfiber cloth.',
      rating: 4.6, reviewCount: 88, isFeatured: false, isNew: false, isTrending: true,
      gender: 'men',
      variants: [
        { size: 'Free Size', color: 'Gold/Green', colorHex: '#FFD700', stock: 65, price: 1499, sku: 'GC-SUN-001' },
      ],
    },
    {
      name: 'Woven Kashmiri Wool Scarf', slug: 'woven-kashmiri-wool-scarf',
      sku: sku('GC', 5), description: 'Warm and luxurious wool muffler, woven by artisans in Kashmir with fine fringed ends.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.scarf,
      basePrice: 1899, discountPct: 10, tags: ['accessories','scarf','men','winter'],
      material: '100% Kashmiri Wool', careInstructions: 'Dry clean recommended.',
      rating: 4.7, reviewCount: 39, isFeatured: false, isNew: false, isTrending: false,
      gender: 'men',
      variants: [
        { size: 'Free Size', color: 'Charcoal', colorHex: '#1A1A1A', stock: 30, price: 1899, sku: 'GC-MFL-001' },
      ],
    },

    // WOMEN'S ACCESSORIES (5)
    {
      name: 'Gold Filigree Statement Earrings', slug: 'gold-filigree-statement-earrings',
      sku: sku('GC', 6), description: 'Handcrafted gold filigree drop earrings inspired by Chettinad jewellery. Lightweight, hypoallergenic.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.jewellery,
      basePrice: 1999, discountPct: 10, tags: ['jewellery','earrings','ethnic'],
      material: '22K Gold Plated Brass, Hypoallergenic Posts', careInstructions: 'Store in the provided pouch. Avoid perfume.',
      rating: 4.9, reviewCount: 312, isFeatured: true, isNew: false, isTrending: true,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Gold', colorHex: '#FFD700', stock: 80, price: 1999, sku: 'GC-EAR-001' },
      ],
    },
    {
      name: 'Structured Full-Grain Leather Tote', slug: 'structured-full-grain-leather-tote',
      sku: sku('GC', 7), description: 'Full-grain leather structured tote in tan. Magnetic snap closure, internal zip pocket, laptop sleeve.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.bag,
      basePrice: 5499, discountPct: 12, tags: ['bag','tote','leather','office'],
      material: 'Full-Grain Leather, Suede Lining', careInstructions: 'Condition with leather cream. Avoid water.',
      rating: 4.8, reviewCount: 178, isFeatured: true, isNew: false, isTrending: false,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Tan', colorHex: '#D2B48C', stock: 30, price: 5499, sku: 'GC-BAG-001' },
      ],
    },
    {
      name: 'Hand-Painted Silk Paisley Stole', slug: 'hand-painted-silk-paisley-stole',
      sku: sku('GC', 8), description: 'Hand-painted silk stole in paisley motif. Wearable art — as a scarf, dupatta, or beach sarong.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.scarf,
      basePrice: 2499, discountPct: 15, tags: ['scarf','silk','accessories'],
      material: '100% Pure Silk', careInstructions: 'Dry clean only.',
      rating: 4.7, reviewCount: 89, isFeatured: false, isNew: true, isTrending: false,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Ivory/Gold', colorHex: '#FFFFF0', stock: 50, price: 2499, sku: 'GC-SCF-001' },
      ],
    },
    {
      name: 'Embellished Beaded Minaudière Clutch', slug: 'embellished-beaded-minaudiere-clutch',
      sku: sku('GC', 9), description: 'Embellished minaudière in antique gold with intricate bead work. Removable chain strap.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.bag,
      basePrice: 3299, discountPct: 10, tags: ['bag','clutch','party','evening'],
      material: 'Metal Frame, Beaded Exterior', careInstructions: 'Handle with care. Avoid moisture.',
      rating: 4.6, reviewCount: 67, isFeatured: false, isNew: true, isTrending: true,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Antique Gold', colorHex: '#B8860B', stock: 20, price: 3299, sku: 'GC-CLT-001' },
      ],
    },
    {
      name: 'Layered Pearl & Bead Choker', slug: 'layered-pearl-and-bead-choker',
      sku: sku('GC', 10), description: 'Set of 3 layered bead chokers — miyuki beads, seed pearls and brass chain. Mix and match.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.jewellery,
      basePrice: 1499, discountPct: 5, tags: ['jewellery','choker','set'],
      material: 'Miyuki Beads, Freshwater Pearls, Brass Chain', careInstructions: 'Avoid water, perfume, sweat.',
      rating: 4.5, reviewCount: 213, isFeatured: false, isNew: false, isTrending: true,
      gender: 'women',
      variants: [
        { size: 'Free Size', color: 'Blush/Pearl', colorHex: '#DE5D83', stock: 70, price: 1499, sku: 'GC-CHK-001' },
      ],
    },

    // BOYS' ACCESSORIES (5)
    {
      name: 'Adjustable Satin Bow Tie', slug: 'adjustable-satin-bow-tie',
      sku: sku('GC', 11), description: 'Charming pre-tied boys bow tie with adjustable neck strap. Perfect styling for family photography.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'],
      basePrice: 399, discountPct: 0, tags: ['accessories','bow-tie','boys','party'],
      material: 'Polyester Satin', careInstructions: 'Spot clean only.',
      rating: 4.6, reviewCount: 18, isFeatured: false, isNew: true, isTrending: false,
      gender: 'boys',
      variants: [
        { size: 'Free Size', color: 'Crimson Red', colorHex: '#B7410E', stock: 50, price: 399, sku: 'GC-BOW-001' },
      ],
    },
    {
      name: 'Flexible Rubber Frame Sunglasses', slug: 'flexible-rubber-frame-sunglasses',
      sku: sku('GC', 12), description: 'Flexible rubber frame sunglasses for active boys. Drop-resistant, polarized, UV protection.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'],
      basePrice: 599, discountPct: 10, tags: ['accessories','eyewear','boys','rubber'],
      material: 'TPEE Flexible Rubber Frame', careInstructions: 'Wash under running water. Wipe dry.',
      rating: 4.7, reviewCount: 33, isFeatured: true, isNew: false, isTrending: true,
      gender: 'boys',
      variants: [
        { size: 'Free Size', color: 'Blue/Orange', colorHex: '#008080', stock: 90, price: 599, sku: 'GC-SUN-002' },
      ],
    },
    {
      name: 'Rib-Knit Wool Beanie', slug: 'rib-knit-wool-beanie',
      sku: sku('GC', 13), description: 'Thick knit beanie hat in stretchy rib stitch. Provides optimal warmth for boys during cold days.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.scarf,
      basePrice: 499, discountPct: 5, tags: ['accessories','beanie','boys','winter'],
      material: 'Soft Acrylic Wool', careInstructions: 'Machine wash cold on gentle.',
      rating: 4.5, reviewCount: 22, isFeatured: false, isNew: false, isTrending: false,
      gender: 'boys',
      variants: [
        { size: 'Free Size', color: 'Mustard', colorHex: '#FFDB58', stock: 40, price: 499, sku: 'GC-BEN-001' },
      ],
    },
    {
      name: 'Durable Canvas School Backpack', slug: 'durable-canvas-school-backpack',
      sku: sku('GC', 14), description: 'Hardwearing canvas backpack with double zip compartments and side water bottle sleeves.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
      basePrice: 1299, discountPct: 0, tags: ['accessories','backpack','boys','school'],
      material: 'Waterproof Canvas, Nylon Lining', careInstructions: 'Wipe with wet cloth. Do not wash.',
      rating: 4.8, reviewCount: 47, isFeatured: true, isNew: true, isTrending: true,
      gender: 'boys',
      variants: [
        { size: 'Free Size', color: 'Forest Green', colorHex: '#808000', stock: 30, price: 1299, sku: 'GC-BPK-001' },
      ],
    },
    {
      name: 'Dino Pattern Knitted Socks Pack', slug: 'dino-pattern-knitted-socks-pack',
      sku: sku('GC', 15), description: 'Pack of 3 pairs of socks with cute knitted dinosaur patterns. Elastic ankle cuffs.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'],
      basePrice: 299, discountPct: 5, tags: ['accessories','socks','boys','basics'],
      material: '85% Cotton, 15% Nylon', careInstructions: 'Tumble dry low. Machine wash warm.',
      rating: 4.6, reviewCount: 65, isFeatured: false, isNew: false, isTrending: false,
      gender: 'boys',
      variants: [
        { size: 'Free Size', color: 'Multicolor Dino', colorHex: '#50C878', stock: 120, price: 299, sku: 'GC-SOK-001' },
      ],
    },

    // GIRLS' ACCESSORIES (5)
    {
      name: 'Chiffon Flower Headband Set', slug: 'chiffon-flower-headband-set',
      sku: sku('GC', 16), description: "Set of 3 charming headbands with silk chiffon flower appliques. Soft elastic band won't leave marks.",
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'],
      basePrice: 349, discountPct: 0, tags: ['accessories','headband','girls','hair'],
      material: 'Chiffon Flowers, Soft Nylon Band', careInstructions: 'Gentle hand wash if needed.',
      rating: 4.7, reviewCount: 41, isFeatured: true, isNew: true, isTrending: false,
      gender: 'girls',
      variants: [
        { size: 'Free Size', color: 'Blush Trio', colorHex: '#DE5D83', stock: 60, price: 349, sku: 'GC-HDB-001' },
      ],
    },
    {
      name: 'Stretchy Unicorn Charm Bracelet', slug: 'stretchy-unicorn-charm-bracelet',
      sku: sku('GC', 17), description: 'Colorful stretchy bracelet with acrylic candy beads and a metal unicorn charm. Lead free.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'],
      basePrice: 249, discountPct: 0, tags: ['accessories','jewellery','girls','bracelet'],
      material: 'Acrylic Beads, Silver Plated Zinc Charm', careInstructions: 'Keep away from water.',
      rating: 4.6, reviewCount: 23, isFeatured: false, isNew: true, isTrending: true,
      gender: 'girls',
      variants: [
        { size: 'Free Size', color: 'Pastel Rainbow', colorHex: '#FFFFF0', stock: 100, price: 249, sku: 'GC-BRC-001' },
      ],
    },
    {
      name: 'Glitter Frame Polarized Sunglasses', slug: 'glitter-frame-polarized-sunglasses',
      sku: sku('GC', 18), description: 'Cute cat-ear details on glitter frames. Safe polarized lenses protect kids eyes.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'],
      basePrice: 499, discountPct: 10, tags: ['accessories','eyewear','girls','glitter'],
      material: 'Polycarbonate Frame & Lenses', careInstructions: 'Wipe with microfiber cloth.',
      rating: 4.5, reviewCount: 19, isFeatured: false, isNew: false, isTrending: false,
      gender: 'girls',
      variants: [
        { size: 'Free Size', color: 'Glitter Pink', colorHex: '#DE5D83', stock: 75, price: 499, sku: 'GC-SUN-003' },
      ],
    },
    {
      name: 'Plush Unicorn Zipper Crossbody', slug: 'plush-unicorn-zipper-crossbody',
      sku: sku('GC', 19), description: 'Ultra-soft plush bag with embroidered eyes, metallic horn, and zipper closure. Holds small treasures.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
      basePrice: 799, discountPct: 12, tags: ['accessories','bag','girls','plush'],
      material: 'Soft Faux-Fur Polyester', careInstructions: 'Hand wash cold. Line dry.',
      rating: 4.8, reviewCount: 52, isFeatured: true, isNew: true, isTrending: true,
      gender: 'girls',
      variants: [
        { size: 'Free Size', color: 'White/Lavender', colorHex: '#FFFFF0', stock: 40, price: 799, sku: 'GC-BAG-003' },
      ],
    },
    {
      name: 'Ribbon Bow Alligator Hair Clips', slug: 'ribbon-bow-alligator-hair-clips',
      sku: sku('GC', 20), description: 'Pack of 5 large grosgrain ribbon bow clips on metal alligator clamps. Beautiful colors.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'],
      basePrice: 399, discountPct: 5, tags: ['accessories','hair-clips','girls','basics'],
      material: 'Grosgrain Polyester Ribbon, Iron Clamp', careInstructions: 'Avoid crushing. Store flat.',
      rating: 4.7, reviewCount: 41, isFeatured: false, isNew: false, isTrending: false,
      gender: 'girls',
      variants: [
        { size: 'Free Size', color: 'Bright Assortment', colorHex: '#DE5D83', stock: 85, price: 399, sku: 'GC-CLP-001' },
      ],
    },

    // ==========================================
    // ── UNISEX PRODUCTS (5 Products) ──
    // ==========================================
    {
      name: "Heavyweight Organic Cotton Hoodie", slug: 'heavyweight-organic-cotton-hoodie',
      sku: sku('UT', 22), description: 'Ultra-soft heavyweight hoodie crafted from organic cotton and recycled polyester loopback fleece. Unisex regular fit.',
      category: tops._id, vendor: ut._id, images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
      basePrice: 2999, discountPct: 10, tags: ['hoodie','unisex','casual','basics','organic'],
      material: '80% Organic Cotton, 20% Recycled Polyester', careInstructions: 'Machine wash warm. Tumble dry medium.',
      rating: 4.8, reviewCount: 112, isFeatured: true, isNew: true, isTrending: true,
      gender: 'unisex',
      variants: [
        { size: 'S', color: 'Heather Gray', colorHex: '#808080', stock: 25, price: 2999, sku: 'UT-UHD-001-S' },
        { size: 'M', color: 'Heather Gray', colorHex: '#808080', stock: 30, price: 2999, sku: 'UT-UHD-001-M' },
        { size: 'L', color: 'Heather Gray', colorHex: '#808080', stock: 25, price: 2999, sku: 'UT-UHD-001-L' },
        { size: 'XL', color: 'Heather Gray', colorHex: '#808080', stock: 15, price: 2999, sku: 'UT-UHD-001-XL' },
      ],
    },
    {
      name: 'Suede Retro Running Sneakers', slug: 'suede-retro-running-sneakers',
      sku: sku('SM', 8), description: 'Vintage-inspired running sneakers with breathable mesh panels, premium suede overlays, and lightweight EVA cushioning.',
      category: footwear._id, vendor: sm._id, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
      basePrice: 4599, discountPct: 15, tags: ['shoes','sneakers','unisex','retro','sporty'],
      material: 'Suede and Mesh Upper, Rubber Sole', careInstructions: 'Clean with suede brush or damp cloth.',
      rating: 4.7, reviewCount: 88, isFeatured: true, isNew: true, isTrending: false,
      gender: 'unisex',
      variants: [
        { size: '38', color: 'White/Navy', colorHex: '#000080', stock: 15, price: 4599, sku: 'SM-URS-001-38' },
        { size: '40', color: 'White/Navy', colorHex: '#000080', stock: 20, price: 4599, sku: 'SM-URS-001-40' },
        { size: '42', color: 'White/Navy', colorHex: '#000080', stock: 15, price: 4599, sku: 'SM-URS-001-42' },
      ],
    },
    {
      name: 'Oversized Denim Overshirt', slug: 'oversized-denim-overshirt',
      sku: sku('UT', 23), description: 'Relaxed-fit overshirt in medium wash durable cotton denim. Classic button-down style for layering.',
      category: denim._id, vendor: ut._id, images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'],
      basePrice: 2499, discountPct: 0, tags: ['denim','shirt','unisex','oversized','layering'],
      material: '100% Cotton Denim', careInstructions: 'Machine wash cold inside out.',
      rating: 4.6, reviewCount: 64, isFeatured: false, isNew: false, isTrending: true,
      gender: 'unisex',
      variants: [
        { size: 'S', color: 'Indigo Wash', colorHex: '#4B0082', stock: 20, price: 2499, sku: 'UT-UDS-001-S' },
        { size: 'M', color: 'Indigo Wash', colorHex: '#4B0082', stock: 25, price: 2499, sku: 'UT-UDS-001-M' },
        { size: 'L', color: 'Indigo Wash', colorHex: '#4B0082', stock: 20, price: 2499, sku: 'UT-UDS-001-L' },
      ],
    },
    {
      name: 'Canvas Street Cargo Pants', slug: 'canvas-street-cargo-pants',
      sku: sku('UT', 24), description: 'Modern cargo pants with elasticated waistband and drawstrings. Durable canvas fabric with multi-utility pockets.',
      category: denim._id, vendor: ut._id, images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'],
      basePrice: 2799, discountPct: 5, tags: ['pants','cargo','unisex','streetwear','casual'],
      material: '100% Cotton Canvas', careInstructions: 'Machine wash cold with similar colors.',
      rating: 4.5, reviewCount: 52, isFeatured: false, isNew: true, isTrending: false,
      gender: 'unisex',
      variants: [
        { size: 'M', color: 'Olive Green', colorHex: '#808000', stock: 20, price: 2799, sku: 'UT-UCJ-001-M' },
        { size: 'L', color: 'Olive Green', colorHex: '#808000', stock: 25, price: 2799, sku: 'UT-UCJ-001-L' },
      ],
    },
    {
      name: 'Waterproof TPU Travel Duffle', slug: 'waterproof-tpu-travel-duffle',
      sku: sku('GC', 21), description: 'Rugged and waterproof travel duffle bag with a spacious main compartment, shoe pocket, and adjustable shoulder strap.',
      category: accessories._id, vendor: gc._id, images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
      basePrice: 3499, discountPct: 10, tags: ['accessories','bag','unisex','travel','waterproof'],
      material: 'Waterproof TPU coated Polyester', careInstructions: 'Wipe with damp cloth. Air dry.',
      rating: 4.8, reviewCount: 47, isFeatured: true, isNew: true, isTrending: true,
      gender: 'unisex',
      variants: [
        { size: 'Free Size', color: 'Stealth Black', colorHex: '#1A1A1A', stock: 35, price: 3499, sku: 'GC-UTD-001' },
      ],
    },
  ];






  const processedProducts = rawProducts.map((p) => {
    let brand = 'StyleHub';
    if (p.vendor === dc._id) brand = 'DesiCouture';
    else if (p.vendor === ut._id) brand = 'UrbanThreads';
    else if (p.vendor === sm._id) brand = 'SoleMate';
    else if (p.vendor === gc._id) brand = 'GlimmerCo';
    else if (p.vendor === vr._id) brand = 'VelveteenRose';

    const totalStock = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);

    return {
      ...p,
      brand,
      gender: p.gender || 'women',
      status: 'active',
      images: [`/images/products/${p.slug}.png`],
      totalStock,
      soldCount: 0,
    };
  });

  const products = await Prod.insertMany(processedProducts);
  console.log(`✅ Seeded ${products.length} products`);

  // ── Admin user ────────────────────────────────────────────────────────────
  await User.create({
    name: 'Admin User', email: 'admin@stylehub.in',
    passwordHash: 'password123',
    role: 'admin',
  });
  await User.create({
    _id: vendorUserId,
    name: 'DesiCouture Vendor', email: 'vendor@desicouture.in',
    passwordHash: 'password123',
    role: 'vendor',
  });
  await User.create({
    name: 'Aarav Mehta', email: 'aarav@gmail.com',
    passwordHash: 'password123',
    role: 'customer',
  });
  await User.create({
    name: 'Priya Sharma', email: 'priya@gmail.com',
    passwordHash: 'password123',
    role: 'customer',
  });
  await User.create({
    name: 'Ananya Singh', email: 'ananya@gmail.com',
    passwordHash: 'password123',
    role: 'customer',
  });
  await User.create({
    name: 'Karan Mehra', email: 'karan@gmail.com',
    passwordHash: 'password123',
    role: 'customer',
  });
  console.log('✅ Seeded users (admin, vendor + 4 customers)');

  // ── CMS Homepage ──────────────────────────────────────────────────────────
  await CmsPage.create({
    slug: 'homepage', title: 'Homepage', description: 'StyleHub homepage sections',
    isPublished: true,
    blocks: [
      {
        id: uuid(), type: 'hero', order: 1, isActive: true,
        data: {
          headline: 'Discover Your Style',
          subheadline: "Handpicked fashion from India's finest artisan vendors",
          cta: { label: 'Shop Now', href: '/products' },
          ctaSecondary: { label: 'Explore Vendors', href: '/vendors' },
          imageUrl: FASHION_IMAGES.lehenga[0],
          overlayColor: 'rgba(0,0,0,0.35)',
        },
      },
      {
        id: uuid(), type: 'banner_strip', order: 2, isActive: true,
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
        id: uuid(), type: 'featured_products', order: 3, isActive: true,
        data: {
          title: 'New Arrivals',
          subtitle: 'Fresh styles, just dropped',
          filter: 'isNew',
          limit: 8,
        },
      },
      {
        id: uuid(), type: 'image_grid', order: 4, isActive: true,
        data: {
          title: 'Shop by Category',
          categories: ['Ethnic Wear', 'Dresses', 'Co-ord Sets', 'Footwear', 'Accessories', 'Kaftans'],
        },
      },
      {
        id: uuid(), type: 'cta', order: 5, isActive: true,
        data: {
          headline: 'Trending This Week',
          subheadline: "Don't miss out on what everyone's wearing",
          buttonLabel: 'Shop Trending',
          buttonHref: '/products?filter=isTrending',
          bgColor: '#2D1B69',
          textColor: '#FFFFFF',
        },
      },
      {
        id: uuid(), type: 'featured_products', order: 6, isActive: true,
        data: {
          title: 'Trending Now',
          subtitle: "What StyleHub shoppers can't stop buying",
          filter: 'isTrending',
          limit: 8,
        },
      },
      {
        id: uuid(), type: 'testimonials', order: 7, isActive: true,
        data: {
          title: 'What Our Customers Say',
          testimonials: [
            { name: 'Priya S.', location: 'Mumbai', rating: 5, text: 'The ivory anarkali is stunning! Quality is exceptional and shipping was super fast.' },
            { name: 'Ananya K.', location: 'Bengaluru', rating: 5, text: 'Finally a marketplace that curates only the best. StyleHub has become my go-to.' },
            { name: 'Meera P.', location: 'Delhi', rating: 5, text: 'The jewellery I ordered is even more beautiful in person. Packaging was lovely too.' },
          ],
        },
      },
    ],
  });

  // ── CMS Static Pages ──────────────────────────────────────────────────────
  await CmsPage.create({
    slug: 'about', title: 'About StyleHub', description: 'Our story and mission',
    isPublished: true,
    blocks: [
      {
        id: uuid(), type: 'hero', order: 1, isActive: true,
        data: { headline: 'Our Story', subheadline: 'Built to celebrate Indian fashion artisans', imageUrl: FASHION_IMAGES.anarkali[0] },
      },
      {
        id: uuid(), type: 'rich_text', order: 2, isActive: true,
        data: {
          html: `<h2>Who We Are</h2>
<p>StyleHub is India's premium multi-vendor fashion marketplace, founded in 2023 with a single mission: to connect discerning shoppers with the country's finest artisan brands and boutique fashion labels.</p>
<p>We hand-curate every vendor on our platform, ensuring authenticity, quality craftsmanship, and a seamless shopping experience from discovery to delivery.</p>
<h2>Our Mission</h2>
<p>We believe Indian fashion deserves a global stage. From Jaipur's master embroiderers to Chennai's filigree jewellers, every piece on StyleHub carries a story — and we're here to help you discover it.</p>
<h2>The StyleHub Promise</h2>
<ul>
  <li>🌟 Hand-curated vendors with verified authenticity</li>
  <li>🛡️ Buyer protection on every order</li>
  <li>🚚 Pan-India delivery with real-time tracking</li>
  <li>↩️ Hassle-free 15-day returns</li>
  <li>💬 Dedicated customer support 7 days a week</li>
</ul>`,
        },
      },
    ],
  });

  await CmsPage.create({
    slug: 'contact', title: 'Contact Us', description: 'Get in touch with StyleHub',
    isPublished: true,
    blocks: [
      {
        id: uuid(), type: 'rich_text', order: 1, isActive: true,
        data: {
          html: `<h1>Get in Touch</h1>
<p>We're here to help! Reach out to us through any of the channels below and our team will respond within 24 hours.</p>
<h3>Customer Support</h3>
<p>📧 hello@stylehub.in<br/>📞 +91 98765 43210<br/>🕐 Mon–Sat, 9 AM–7 PM IST</p>
<h3>Vendor Enquiries</h3>
<p>📧 vendors@stylehub.in</p>
<h3>Press & Media</h3>
<p>📧 press@stylehub.in</p>`,
        },
      },
      { id: uuid(), type: 'contact_form', order: 2, isActive: true, data: {} },
    ],
  });

  await CmsPage.create({
    slug: 'returns', title: 'Returns & Refunds', description: 'Our returns policy',
    isPublished: true,
    blocks: [{
      id: uuid(), type: 'rich_text', order: 1, isActive: true,
      data: { html: `<h1>Returns & Refunds Policy</h1>
<p>We want you to love every purchase. If you're not completely satisfied, here's how we can help.</p>
<h2>Return Window</h2>
<p>You can return most items within <strong>15 days</strong> of delivery. Items must be unused, unwashed, and in original packaging with all tags attached.</p>
<h2>Non-Returnable Items</h2>
<ul><li>Innerwear and swimwear</li><li>Customised or made-to-order products</li><li>Sale items marked as final sale</li><li>Accessories that have been used</li></ul>
<h2>How to Initiate a Return</h2>
<ol><li>Log in to your StyleHub account</li><li>Go to Orders → select the item</li><li>Click "Request Return" and choose your reason</li><li>We'll arrange a free pickup within 48 hours</li></ol>
<h2>Refund Timeline</h2>
<p>Refunds are processed within <strong>5–7 business days</strong> to your original payment method. UPI and wallet refunds are typically faster (1–3 days).</p>` },
    }],
  });

  await CmsPage.create({
    slug: 'privacy-policy', title: 'Privacy Policy', description: 'How we handle your data',
    isPublished: true,
    blocks: [{
      id: uuid(), type: 'rich_text', order: 1, isActive: true,
      data: { html: `<h1>Privacy Policy</h1>
<p><em>Last updated: July 2026</em></p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly (name, email, address, payment info) and information collected automatically (browsing behaviour, device data, cookies).</p>
<h2>How We Use Your Information</h2>
<ul><li>To process and fulfil your orders</li><li>To personalise your shopping experience</li><li>To send order updates and promotional emails (with consent)</li><li>To improve our platform through analytics</li></ul>
<h2>Data Sharing</h2>
<p>We share necessary information with vendors to fulfil your orders and with payment processors to handle transactions. We do not sell your personal data to third parties.</p>
<h2>Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data. Contact privacy@stylehub.in for any data requests.</p>` },
    }],
  });

  // ── Banners ───────────────────────────────────────────────────────────────
  await Banner.insertMany([
    {
      title: 'New Season Collection', subtitle: 'Up to 30% off on ethnic wear',
      imageUrl: FASHION_IMAGES.lehenga[0], mobileImageUrl: FASHION_IMAGES.anarkali[0],
      linkUrl: '/products?category=ethnic', linkLabel: 'Explore Now',
      placement: 'homepage_hero', order: 1, isActive: true, bgColor: '#2D1B69', textColor: '#FFFFFF',
    },
    {
      title: 'Sale: Up to 50% Off Footwear', subtitle: 'Handcrafted styles at unbeatable prices',
      imageUrl: FASHION_IMAGES.heels[0], mobileImageUrl: FASHION_IMAGES.flats[0],
      linkUrl: '/products?category=footwear', linkLabel: 'Shop Footwear',
      placement: 'homepage_hero', order: 2, isActive: true, bgColor: '#8B4513', textColor: '#FFFFFF',
    },
    {
      title: 'Free Shipping Week', subtitle: 'Free delivery on all orders — no minimum',
      imageUrl: FASHION_IMAGES.coord[0], mobileImageUrl: FASHION_IMAGES.dress[0],
      linkUrl: '/products', linkLabel: 'Shop Now',
      placement: 'homepage_mid', order: 1, isActive: true, bgColor: '#C84B31', textColor: '#FFFFFF',
    },
  ]);
  console.log('✅ Seeded banners and CMS pages');

  // ── Seed mock orders ───────────────────────────────────────────────────────
  const dcVendor = vendors.find((v) => v.storeName === 'DesiCouture');
  const utVendor = vendors.find((v) => v.storeName === 'UrbanThreads');

  const sareeProduct = products.find((p) => p.name === 'Teal Bandhani Saree');
  const dressProduct = products.find((p) => p.name === 'Midnight Floral Maxi Dress');
  const anarkaliProduct = products.find((p) => p.name === 'Ivory Embroidered Anarkali Kurta');
  const kurtaProduct = products.find((p) => p.name === 'Mustard Block Print Kurta Set');
  const shararaProduct = products.find((p) => p.name === 'Rose Gold Sharara Set');

  if (sareeProduct && dressProduct && anarkaliProduct && kurtaProduct && shararaProduct && dcVendor && utVendor) {
    const cust1 = await User.findOne({ email: 'aarav@gmail.com' });
    const cust2 = await User.findOne({ email: 'priya@gmail.com' });
    const cust3 = await User.findOne({ email: 'ananya@gmail.com' });
    const cust4 = await User.findOne({ email: 'karan@gmail.com' });

    const seededOrders = await Order.create([
      {
        orderNumber: 'SH-202607-0001',
        customer: cust1?._id,
        guestInfo: { name: 'Aarav Mehta', email: 'aarav@gmail.com' },
        address: {
          fullName: 'Aarav Mehta',
          phone: '9876543210',
          line1: 'Flat 405, Heights Residency, Link Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
        },
        fulfillments: [
          {
            vendorId: dcVendor._id.toString(),
            vendorName: 'DesiCouture',
            status: 'placed',
            createdAt: new Date(),
            items: [
              {
                productId: sareeProduct._id.toString(),
                name: sareeProduct.name,
                sku: sareeProduct.sku,
                price: sareeProduct.basePrice,
                quantity: 1,
                size: 'Free Size',
                color: 'Teal',
              }
            ],
            subtotal: sareeProduct.basePrice,
            delivery: 0,
          }
        ],
        totals: {
          subtotal: sareeProduct.basePrice,
          discount: 0,
          tax: Math.round(sareeProduct.basePrice * 0.18),
          delivery: 0,
          total: Math.round(sareeProduct.basePrice * 1.18),
        },
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'placed',
        createdAt: new Date(Date.now() - 4 * 3600000),
      },
      {
        orderNumber: 'SH-202607-0002',
        customer: cust2?._id,
        guestInfo: { name: 'Priya Sharma', email: 'priya@gmail.com' },
        address: {
          fullName: 'Priya Sharma',
          phone: '9822334455',
          line1: 'House No 12, Park Lane, Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
        },
        fulfillments: [
          {
            vendorId: utVendor._id.toString(),
            vendorName: 'UrbanThreads',
            status: 'confirmed',
            createdAt: new Date(),
            items: [
              {
                productId: dressProduct._id.toString(),
                name: dressProduct.name,
                sku: dressProduct.sku,
                price: dressProduct.basePrice,
                quantity: 2,
                size: 'M',
                color: 'Black',
              }
            ],
            subtotal: dressProduct.basePrice * 2,
            delivery: 0,
          }
        ],
        totals: {
          subtotal: dressProduct.basePrice * 2,
          discount: 200,
          tax: Math.round((dressProduct.basePrice * 2 - 200) * 0.18),
          delivery: 0,
          total: Math.round((dressProduct.basePrice * 2 - 200) * 1.18),
        },
        paymentMethod: 'card',
        paymentStatus: 'paid',
        status: 'confirmed',
      },
      {
        orderNumber: 'SH-202607-0003',
        customer: cust3?._id,
        guestInfo: { name: 'Ananya Singh', email: 'ananya@gmail.com' },
        address: {
          fullName: 'Ananya Singh',
          phone: '9811223344',
          line1: 'Apartment 7B, Skyview Towers, Sector 56',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122011',
        },
        fulfillments: [
          {
            vendorId: dcVendor._id.toString(),
            vendorName: 'DesiCouture',
            status: 'shipped',
            createdAt: new Date(),
            items: [
              {
                productId: anarkaliProduct._id.toString(),
                name: anarkaliProduct.name,
                sku: anarkaliProduct.sku,
                price: anarkaliProduct.basePrice,
                quantity: 1,
                size: 'M',
                color: 'Ivory',
              }
            ],
            subtotal: anarkaliProduct.basePrice,
            delivery: 0,
          }
        ],
        totals: {
          subtotal: anarkaliProduct.basePrice,
          discount: 0,
          tax: Math.round(anarkaliProduct.basePrice * 0.18),
          delivery: 0,
          total: Math.round(anarkaliProduct.basePrice * 1.18),
        },
        paymentMethod: 'card',
        paymentStatus: 'paid',
        status: 'shipped',
        createdAt: new Date(Date.now() - 12 * 3600000),
      },
      {
        orderNumber: 'SH-202607-0004',
        customer: cust4?._id,
        guestInfo: { name: 'Karan Mehra', email: 'karan@gmail.com' },
        address: {
          fullName: 'Karan Mehra',
          phone: '9833445566',
          line1: 'C-44, Defence Colony',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110024',
        },
        fulfillments: [
          {
            vendorId: dcVendor._id.toString(),
            vendorName: 'DesiCouture',
            status: 'placed',
            createdAt: new Date(),
            items: [
              {
                productId: kurtaProduct._id.toString(),
                name: kurtaProduct.name,
                sku: kurtaProduct.sku,
                price: kurtaProduct.basePrice,
                quantity: 1,
                size: 'L',
                color: 'Mustard',
              },
              {
                productId: shararaProduct._id.toString(),
                name: shararaProduct.name,
                sku: shararaProduct.sku,
                price: shararaProduct.basePrice,
                quantity: 1,
                size: 'M',
                color: 'Rose Gold',
              }
            ],
            subtotal: kurtaProduct.basePrice + shararaProduct.basePrice,
            delivery: 99,
          }
        ],
        totals: {
          subtotal: kurtaProduct.basePrice + shararaProduct.basePrice,
          discount: 500,
          tax: Math.round((kurtaProduct.basePrice + shararaProduct.basePrice - 500) * 0.18),
          delivery: 99,
          total: Math.round((kurtaProduct.basePrice + shararaProduct.basePrice - 500) * 1.18) + 99,
        },
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'placed',
        createdAt: new Date(Date.now() - 2 * 3600000),
      }
    ]);
    console.log('✅ Seeded mock customer orders');

    // Sync product soldCounts with seeded orders
    const productSoldCounts: Record<string, number> = {};
    for (const order of seededOrders) {
      for (const fulfillment of order.fulfillments) {
        for (const item of fulfillment.items) {
          const prodId = item.productId.toString();
          productSoldCounts[prodId] = (productSoldCounts[prodId] || 0) + item.quantity;
        }
      }
    }

    for (const [prodId, count] of Object.entries(productSoldCounts)) {
      await Prod.findByIdAndUpdate(prodId, { $set: { soldCount: count } });
    }
    console.log('✅ Synced product soldCounts with seeded orders');
  }

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete! Summary:');
  console.log(`   📦 ${categories.length} categories`);
  console.log(`   🏪 ${vendors.length} vendors`);
  console.log(`   👗 ${products.length} products (with variants)`);
  console.log(`   📄 5 CMS pages (homepage, about, contact, returns, privacy)`);
  console.log(`   🖼️  3 banners`);
  console.log(`   👤 2 users (admin@stylehub.in + vendor@desicouture.in)`);
  console.log(`   🔑 Default password: password123`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
