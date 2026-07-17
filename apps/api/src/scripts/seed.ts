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
    },
  ]);
  const [dc, ut, sm, gc, vr] = vendors;

  console.log(`✅ Seeded ${vendors.length} vendors`);

  // ── Products (30+) ────────────────────────────────────────────────────────
  const rawProducts = [
    // ── ETHNIC WEAR (DesiCouture) ──────────────────────────────────────────
    {
      name: 'Ivory Embroidered Anarkali Kurta', slug: 'ivory-embroidered-anarkali-kurta',
      sku: sku('DC', 1), description: 'A timeless ivory anarkali with delicate hand-embroidery in gold thread. Paired with a churidar and dupatta.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.anarkali,
      basePrice: 3499, discountPct: 10, tags: ['ethnic','anarkali','wedding'],
      material: '80% Pure Cotton, 20% Silk Blend', careInstructions: 'Dry clean only. Store in a muslin bag.',
      rating: 4.9, reviewCount: 482, isFeatured: true, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, COLORS_ETHNIC, 3499),
    },
    {
      name: 'Crimson Lehenga Choli Set', slug: 'crimson-lehenga-choli-set',
      sku: sku('DC', 2), description: 'Bridal-grade crimson lehenga with zari embroidery and matching blouse. Perfect for weddings and receptions.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.lehenga,
      basePrice: 12999, discountPct: 5, tags: ['bridal','lehenga','wedding'],
      material: 'Banarasi Silk, Velvet Border', careInstructions: 'Dry clean only.',
      rating: 4.8, reviewCount: 134, isFeatured: true, isNew: true, isTrending: false,
      variants: makeVariants(['S','M','L'], COLORS_ETHNIC.slice(0,2), 12999),
    },
    {
      name: 'Mustard Block Print Kurta Set', slug: 'mustard-block-print-kurta-set',
      sku: sku('DC', 3), description: 'Jaipur-print mustard kurta with matching palazzo. Inspired by Rajasthani block print art.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.kurta,
      basePrice: 2199, discountPct: 15, tags: ['ethnic','block print','casual'],
      material: 'Pure Cotton', careInstructions: 'Machine wash cold. Dry in shade.',
      rating: 4.7, reviewCount: 298, isFeatured: false, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [COLORS_ETHNIC[5]!, COLORS_ETHNIC[4]!, COLORS_ETHNIC[6]!], 2199),
    },
    {
      name: 'Teal Bandhani Saree', slug: 'teal-bandhani-saree',
      sku: sku('DC', 4), description: 'Hand-tied bandhani saree in rich teal with golden zari border. Includes an unstitched blouse piece.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.saree,
      basePrice: 4999, discountPct: 0, tags: ['saree','bandhani','ethnic'],
      material: 'Pure Georgette', careInstructions: 'Hand wash only.',
      rating: 4.6, reviewCount: 87, isFeatured: true, isNew: true, isTrending: false,
      variants: [
        { size: 'Free Size', color: 'Teal', colorHex: '#008080', stock: 20, price: 4999, sku: 'DC-SAR-001' },
        { size: 'Free Size', color: 'Midnight', colorHex: '#191970', stock: 15, price: 4999, sku: 'DC-SAR-002' },
      ],
    },
    {
      name: 'Rose Gold Sharara Set', slug: 'rose-gold-sharara-set',
      sku: sku('DC', 5), description: 'Festive sharara set in rose gold with intricate sequin work. Ideal for Diwali and family events.',
      category: ethnic._id, vendor: dc._id, images: [FASHION_IMAGES.lehenga[1]!, FASHION_IMAGES.anarkali[0]!],
      basePrice: 5499, discountPct: 20, tags: ['ethnic','festive','sharara'],
      material: 'Net + Silk Lining', careInstructions: 'Dry clean only.',
      rating: 4.5, reviewCount: 63, isFeatured: false, isNew: true, isTrending: true,
      variants: makeVariants(['XS','S','M','L'], [COLORS_ETHNIC[1]!, COLORS_ETHNIC[3]!], 5499),
    },
    // ── DRESSES (UrbanThreads) ─────────────────────────────────────────────
    {
      name: 'Midnight Floral Maxi Dress', slug: 'midnight-floral-maxi-dress',
      sku: sku('UT', 1), description: 'Floor-length maxi in midnight navy with delicate floral print. Features a flutter sleeve and ruched waist.',
      category: dresses._id, vendor: ut._id, images: FASHION_IMAGES.dress,
      basePrice: 2899, discountPct: 12, tags: ['maxi','floral','dress'],
      material: 'Viscose Rayon', careInstructions: 'Machine wash gentle. Tumble dry low.',
      rating: 4.8, reviewCount: 234, isFeatured: true, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, COLORS_CASUAL.slice(0,3), 2899),
    },
    {
      name: 'Blush Satin Slip Dress', slug: 'blush-satin-slip-dress',
      sku: sku('UT', 2), description: 'Elegant satin slip dress in blush with adjustable spaghetti straps. Perfect for date nights.',
      category: dresses._id, vendor: ut._id, images: [FASHION_IMAGES.dress[1]!, FASHION_IMAGES.dress[0]!],
      basePrice: 1999, discountPct: 0, tags: ['dress','satin','evening'],
      material: '100% Satin', careInstructions: 'Hand wash cold.',
      rating: 4.6, reviewCount: 189, isFeatured: false, isNew: true, isTrending: false,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[5]!, COLORS_CASUAL[0]!], 1999),
    },
    {
      name: 'Olive Wrap Midi Dress', slug: 'olive-wrap-midi-dress',
      sku: sku('UT', 3), description: 'Classic wrap silhouette in olive green. Adjustable tie waist, midi length. Office-to-evening ready.',
      category: dresses._id, vendor: ut._id, images: FASHION_IMAGES.dress,
      basePrice: 2499, discountPct: 10, tags: ['dress','wrap','midi','office'],
      material: 'Crepe', careInstructions: 'Dry clean or hand wash.',
      rating: 4.7, reviewCount: 312, isFeatured: false, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[3]!, COLORS_CASUAL[0]!, COLORS_CASUAL[5]!], 2499),
    },
    {
      name: 'Ivory Broderie Anglaise Mini', slug: 'ivory-broderie-anglaise-mini',
      sku: sku('UT', 4), description: 'Summer-perfect mini in broderie anglaise cotton. Smocked bust, puff sleeves.',
      category: dresses._id, vendor: ut._id, images: [FASHION_IMAGES.dress[0]!, FASHION_IMAGES.top[0]!],
      basePrice: 1799, discountPct: 5, tags: ['dress','mini','summer'],
      material: '100% Cotton', careInstructions: 'Machine wash cold.',
      rating: 4.5, reviewCount: 156, isFeatured: true, isNew: true, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[1]!, COLORS_CASUAL[5]!], 1799),
    },
    // ── CO-ORD SETS (UrbanThreads) ─────────────────────────────────────────
    {
      name: 'Camel Ribbed Knit Co-ord Set', slug: 'camel-ribbed-knit-coord-set',
      sku: sku('UT', 5), description: 'Luxe ribbed knit co-ord in camel. Longline blazer + straight-leg trousers. The power suit reinvented.',
      category: coords._id, vendor: ut._id, images: FASHION_IMAGES.coord,
      basePrice: 3999, discountPct: 0, tags: ['coord','knit','power suit'],
      material: '65% Acrylic, 35% Wool Blend', careInstructions: 'Dry clean only.',
      rating: 4.9, reviewCount: 189, isFeatured: true, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[2]!, COLORS_CASUAL[0]!, COLORS_CASUAL[1]!], 3999),
    },
    {
      name: 'Navy Linen Co-ord Set', slug: 'navy-linen-coord-set',
      sku: sku('UT', 6), description: 'Breathable linen two-piece in navy. Relaxed shirt + wide-leg trousers. Vacation-ready.',
      category: coords._id, vendor: ut._id, images: [FASHION_IMAGES.coord[1]!, FASHION_IMAGES.coord[0]!],
      basePrice: 2799, discountPct: 10, tags: ['coord','linen','vacation'],
      material: '100% Linen', careInstructions: 'Machine wash cold, lay flat to dry.',
      rating: 4.6, reviewCount: 97, isFeatured: false, isNew: true, isTrending: false,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[4]!, COLORS_CASUAL[1]!], 2799),
    },
    // ── TOPS (VelveteenRose) ───────────────────────────────────────────────
    {
      name: 'Terracotta Crochet Crop Top', slug: 'terracotta-crochet-crop-top',
      sku: sku('VR', 1), description: 'Handmade crochet crop top in terracotta. Bohemian vibes, perfect for beach days.',
      category: tops._id, vendor: vr._id, images: FASHION_IMAGES.top,
      basePrice: 1299, discountPct: 0, tags: ['top','crochet','boho'],
      material: '100% Cotton Crochet', careInstructions: 'Hand wash cold only.',
      rating: 4.4, reviewCount: 78, isFeatured: false, isNew: true, isTrending: true,
      variants: makeVariants(['XS','S','M'], [COLORS_ETHNIC[4]!, COLORS_CASUAL[5]!], 1299),
    },
    {
      name: 'White Broderie Off-Shoulder Top', slug: 'white-broderie-off-shoulder-top',
      sku: sku('VR', 2), description: 'Off-shoulder top in white broderie with elasticated neckline. Light, breezy, effortless.',
      category: tops._id, vendor: vr._id, images: [FASHION_IMAGES.top[1]!, FASHION_IMAGES.top[0]!],
      basePrice: 1499, discountPct: 8, tags: ['top','off-shoulder','summer'],
      material: '100% Cotton', careInstructions: 'Machine wash gentle.',
      rating: 4.6, reviewCount: 124, isFeatured: false, isNew: false, isTrending: false,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[1]!, COLORS_CASUAL[5]!], 1499),
    },
    {
      name: 'Sage Green Linen Shirt', slug: 'sage-green-linen-shirt',
      sku: sku('VR', 3), description: 'Oversized linen shirt in sage green. Wear open as a jacket or buttoned up. Versatile wardrobe essential.',
      category: tops._id, vendor: vr._id, images: FASHION_IMAGES.top,
      basePrice: 1799, discountPct: 5, tags: ['top','linen','shirt','versatile'],
      material: '100% Linen', careInstructions: 'Machine wash cold.',
      rating: 4.7, reviewCount: 203, isFeatured: true, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[3]!, COLORS_CASUAL[1]!, COLORS_CASUAL[0]!], 1799),
    },
    // ── DENIM (UrbanThreads) ───────────────────────────────────────────────
    {
      name: 'High-Rise Straight Jeans', slug: 'high-rise-straight-jeans',
      sku: sku('UT', 7), description: 'Classic high-rise straight cut in authentic indigo denim. Timeless, flattering silhouette.',
      category: denim._id, vendor: ut._id, images: FASHION_IMAGES.jeans,
      basePrice: 2299, discountPct: 0, tags: ['denim','jeans','classic'],
      material: '98% Cotton, 2% Elastane', careInstructions: 'Machine wash cold inside out.',
      rating: 4.8, reviewCount: 567, isFeatured: false, isNew: false, isTrending: true,
      variants: makeVariants(['26','27','28','29','30','32'], [COLORS_CASUAL[0]!, COLORS_CASUAL[4]!], 2299),
    },
    {
      name: 'Wide Leg Cropped Denim', slug: 'wide-leg-cropped-denim',
      sku: sku('UT', 8), description: 'Trendy wide-leg crop in light wash denim. High-waisted, ankle-grazing length.',
      category: denim._id, vendor: ut._id, images: [FASHION_IMAGES.jeans[1]!, FASHION_IMAGES.jeans[0]!],
      basePrice: 2599, discountPct: 15, tags: ['denim','wide-leg','trend'],
      material: '100% Cotton Denim', careInstructions: 'Machine wash cold.',
      rating: 4.6, reviewCount: 234, isFeatured: false, isNew: true, isTrending: true,
      variants: makeVariants(['26','27','28','29','30'], [COLORS_CASUAL[1]!, COLORS_CASUAL[0]!], 2599),
    },
    // ── KAFTANS (VelveteenRose) ────────────────────────────────────────────
    {
      name: 'Block Print Resort Kaftan', slug: 'block-print-resort-kaftan',
      sku: sku('VR', 4), description: 'Vibrant block-print kaftan in lightweight cotton. Breezy beach cover-up or loungewear.',
      category: kaftans._id, vendor: vr._id, images: FASHION_IMAGES.kaftan,
      basePrice: 2099, discountPct: 10, tags: ['kaftan','resort','boho'],
      material: '100% Cotton', careInstructions: 'Machine wash cold.',
      rating: 4.5, reviewCount: 167, isFeatured: true, isNew: false, isTrending: false,
      variants: [
        { size: 'Free Size', color: 'Multicolor', colorHex: '#FF7F50', stock: 40, price: 2099, sku: 'VR-KAF-001' },
        { size: 'Free Size (XL)', color: 'Teal Multi', colorHex: '#008080', stock: 25, price: 2299, sku: 'VR-KAF-002' },
      ],
    },
    {
      name: 'Silk Modal Longline Kaftan', slug: 'silk-modal-longline-kaftan',
      sku: sku('VR', 5), description: 'Luxurious silk-modal blend kaftan in a fluid floor-length silhouette. Elevated loungewear.',
      category: kaftans._id, vendor: vr._id, images: [FASHION_IMAGES.kaftan[1]!, FASHION_IMAGES.saree[0]!],
      basePrice: 3299, discountPct: 0, tags: ['kaftan','silk','luxury'],
      material: '60% Silk, 40% Modal', careInstructions: 'Hand wash cold or dry clean.',
      rating: 4.7, reviewCount: 89, isFeatured: false, isNew: true, isTrending: false,
      variants: [
        { size: 'S/M', color: 'Blush', colorHex: '#DE5D83', stock: 20, price: 3299, sku: 'VR-KAF-003' },
        { size: 'L/XL', color: 'Ivory', colorHex: '#FFFFF0', stock: 15, price: 3499, sku: 'VR-KAF-004' },
      ],
    },
    // ── FOOTWEAR (SoleMate) ────────────────────────────────────────────────
    {
      name: 'Gold Strappy Block Heels', slug: 'gold-strappy-block-heels',
      sku: sku('SM', 1), description: 'Handcrafted gold strappy block heels with ankle tie. 3-inch heel height, padded insole for all-day comfort.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.heels,
      basePrice: 2799, discountPct: 8, tags: ['heels','gold','party'],
      material: 'Metallic Leather Upper, Memory Foam Insole', careInstructions: 'Wipe clean with damp cloth.',
      rating: 4.7, reviewCount: 198, isFeatured: true, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_NUM, [{ color: 'Gold', hex: '#FFD700' }, { color: 'Silver', hex: '#C0C0C0' }], 2799),
    },
    {
      name: 'Tan Kolhapuri Flats', slug: 'tan-kolhapuri-flats',
      sku: sku('SM', 2), description: 'Authentic Kolhapuri flats in tan leather with hand-tooled floral motif. Heritage craft, modern fit.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.flats,
      basePrice: 1899, discountPct: 0, tags: ['flats','kolhapuri','ethnic','handcrafted'],
      material: 'Genuine Leather, Rubber Sole', careInstructions: 'Condition with leather oil monthly.',
      rating: 4.8, reviewCount: 312, isFeatured: false, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_NUM, [{ color: 'Tan', hex: '#D2B48C' }, { color: 'Black', hex: '#1A1A1A' }], 1899),
    },
    {
      name: 'Ivory Wedge Espadrilles', slug: 'ivory-wedge-espadrilles',
      sku: sku('SM', 3), description: 'Summer-perfect ivory wedge espadrilles with braided jute sole. Lightweight and vacation-ready.',
      category: footwear._id, vendor: sm._id, images: [FASHION_IMAGES.flats[1]!, FASHION_IMAGES.heels[1]!],
      basePrice: 2299, discountPct: 12, tags: ['wedges','espadrilles','summer'],
      material: 'Canvas Upper, Natural Jute Sole', careInstructions: 'Spot clean. Air dry.',
      rating: 4.5, reviewCount: 134, isFeatured: false, isNew: true, isTrending: false,
      variants: makeVariants(SIZES_NUM, [{ color: 'Ivory', hex: '#FFFFF0' }, { color: 'Blush', hex: '#DE5D83' }], 2299),
    },
    {
      name: 'Black Kitten Heel Mules', slug: 'black-kitten-heel-mules',
      sku: sku('SM', 4), description: 'Sleek black kitten heel mules in vegan leather. 2-inch heel, pointed toe. Office to cocktails.',
      category: footwear._id, vendor: sm._id, images: FASHION_IMAGES.heels,
      basePrice: 2499, discountPct: 5, tags: ['mules','office','heels'],
      material: 'Vegan Leather, Synthetic Sole', careInstructions: 'Wipe clean, store in dust bag.',
      rating: 4.6, reviewCount: 267, isFeatured: true, isNew: false, isTrending: false,
      variants: makeVariants(SIZES_NUM, [{ color: 'Black', hex: '#1A1A1A' }, { color: 'Nude', hex: '#E8BEAC' }], 2499),
    },
    // ── ACCESSORIES (GlimmerCo) ────────────────────────────────────────────
    {
      name: 'Gold Filigree Statement Earrings', slug: 'gold-filigree-statement-earrings',
      sku: sku('GC', 1), description: 'Handcrafted gold filigree drop earrings inspired by Chettinad jewellery. Lightweight, hypoallergenic.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.jewellery,
      basePrice: 1999, discountPct: 0, tags: ['jewellery','earrings','ethnic'],
      material: '22K Gold Plated Brass, Hypoallergenic Posts', careInstructions: 'Store in the provided pouch. Avoid perfume.',
      rating: 4.9, reviewCount: 312, isFeatured: true, isNew: false, isTrending: true,
      variants: [
        { size: 'Free Size', color: 'Gold', colorHex: '#FFD700', stock: 80, price: 1999, sku: 'GC-EAR-001' },
        { size: 'Free Size', color: 'Rose Gold', colorHex: '#B76E79', stock: 60, price: 2199, sku: 'GC-EAR-002' },
      ],
    },
    {
      name: 'Tan Structured Tote Bag', slug: 'tan-structured-tote-bag',
      sku: sku('GC', 2), description: 'Full-grain leather structured tote in tan. Magnetic snap closure, internal zip pocket, laptop sleeve.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.bag,
      basePrice: 5499, discountPct: 10, tags: ['bag','tote','leather','office'],
      material: 'Full-Grain Leather, Suede Lining', careInstructions: 'Condition with leather cream. Avoid water.',
      rating: 4.8, reviewCount: 178, isFeatured: true, isNew: false, isTrending: false,
      variants: [
        { size: 'Free Size', color: 'Tan', colorHex: '#D2B48C', stock: 30, price: 5499, sku: 'GC-BAG-001' },
        { size: 'Free Size', color: 'Black', colorHex: '#1A1A1A', stock: 25, price: 5499, sku: 'GC-BAG-002' },
      ],
    },
    {
      name: 'Silk Paisley Stole', slug: 'silk-paisley-stole',
      sku: sku('GC', 3), description: 'Hand-painted silk stole in paisley motif. Wearable art — as a scarf, dupatta, or beach sarong.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.scarf,
      basePrice: 2499, discountPct: 0, tags: ['scarf','silk','accessories'],
      material: '100% Pure Silk', careInstructions: 'Dry clean only.',
      rating: 4.7, reviewCount: 89, isFeatured: false, isNew: true, isTrending: false,
      variants: [
        { size: 'Free Size', color: 'Ivory/Gold', colorHex: '#FFFFF0', stock: 50, price: 2499, sku: 'GC-SCF-001' },
        { size: 'Free Size', color: 'Rose/Teal', colorHex: '#DE5D83', stock: 40, price: 2499, sku: 'GC-SCF-002' },
      ],
    },
    {
      name: 'Minaudière Clutch', slug: 'minaudiere-clutch',
      sku: sku('GC', 4), description: 'Embellished minaudière in antique gold with intricate bead work. Removable chain strap.',
      category: accessories._id, vendor: gc._id, images: [FASHION_IMAGES.bag[1]!, FASHION_IMAGES.jewellery[0]!],
      basePrice: 3299, discountPct: 15, tags: ['bag','clutch','party','evening'],
      material: 'Metal Frame, Beaded Exterior', careInstructions: 'Handle with care. Avoid moisture.',
      rating: 4.6, reviewCount: 67, isFeatured: false, isNew: true, isTrending: true,
      variants: [
        { size: 'Free Size', color: 'Antique Gold', colorHex: '#B8860B', stock: 20, price: 3299, sku: 'GC-CLT-001' },
        { size: 'Free Size', color: 'Silver', colorHex: '#C0C0C0', stock: 15, price: 3299, sku: 'GC-CLT-002' },
      ],
    },
    {
      name: 'Layered Bead Choker Set', slug: 'layered-bead-choker-set',
      sku: sku('GC', 5), description: 'Set of 3 layered bead chokers — miyuki beads, seed pearls and brass chain. Mix and match.',
      category: accessories._id, vendor: gc._id, images: FASHION_IMAGES.jewellery,
      basePrice: 1499, discountPct: 10, tags: ['jewellery','choker','set'],
      material: 'Miyuki Beads, Freshwater Pearls, Brass Chain', careInstructions: 'Avoid water, perfume, sweat.',
      rating: 4.5, reviewCount: 213, isFeatured: false, isNew: false, isTrending: true,
      variants: [
        { size: 'Free Size', color: 'Blush/Pearl', colorHex: '#DE5D83', stock: 70, price: 1499, sku: 'GC-CHK-001' },
        { size: 'Free Size', color: 'Gold/Ivory', colorHex: '#FFD700', stock: 55, price: 1499, sku: 'GC-CHK-002' },
      ],
    },
    // ── Additional ethnic & dress products ───────────────────────────────
    {
      name: 'Emerald Green Patiala Salwar Set', slug: 'emerald-green-patiala-salwar-set',
      sku: sku('DC', 6), description: 'Vibrant emerald patiala salwar with embellished kurta and sheer dupatta. Classic Punjabi style.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.kurta,
      basePrice: 2799, discountPct: 5, tags: ['ethnic','patiala','salwar'],
      material: 'Georgette + Cotton', careInstructions: 'Hand wash cold.',
      rating: 4.5, reviewCount: 112, isFeatured: false, isNew: false, isTrending: false,
      variants: makeVariants(SIZES_XS_XL, [COLORS_ETHNIC[3]!, COLORS_ETHNIC[0]!], 2799),
    },
    {
      name: 'Rust Ikat Straight Kurta', slug: 'rust-ikat-straight-kurta',
      sku: sku('DC', 7), description: 'Handloom ikat weave in rust and ivory. Straight-cut kurta with side slits and patch pockets.',
      category: ethnic._id, vendor: dc._id, images: FASHION_IMAGES.kurta,
      basePrice: 1899, discountPct: 0, tags: ['ethnic','ikat','handloom'],
      material: 'Handloom Cotton Ikat', careInstructions: 'Machine wash gentle, inside out.',
      rating: 4.6, reviewCount: 145, isFeatured: false, isNew: true, isTrending: false,
      variants: makeVariants(SIZES_XS_XL, [COLORS_ETHNIC[4]!, COLORS_ETHNIC[0]!], 1899),
    },
    {
      name: 'Coral Wrap Sundress', slug: 'coral-wrap-sundress',
      sku: sku('UT', 9), description: 'Easy-breezy coral wrap sundress with tie waist and ruffle hem. Summer holiday essential.',
      category: dresses._id, vendor: ut._id, images: FASHION_IMAGES.dress,
      basePrice: 1699, discountPct: 20, tags: ['dress','wrap','summer','holiday'],
      material: 'Rayon', careInstructions: 'Machine wash cold.',
      rating: 4.4, reviewCount: 98, isFeatured: false, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [{ color: 'Coral', hex: '#FF7F50' }, COLORS_CASUAL[1]!], 1699),
    },
    {
      name: 'Black Blazer Dress', slug: 'black-blazer-dress',
      sku: sku('UT', 10), description: 'Power-meets-polish black blazer dress. Single-button closure, structured shoulders, mini length.',
      category: dresses._id, vendor: ut._id, images: [FASHION_IMAGES.dress[0]!, FASHION_IMAGES.coord[0]!],
      basePrice: 3299, discountPct: 0, tags: ['dress','blazer','office','formal'],
      material: 'Polyester Blend', careInstructions: 'Dry clean only.',
      rating: 4.8, reviewCount: 267, isFeatured: true, isNew: false, isTrending: true,
      variants: makeVariants(SIZES_XS_XL, [COLORS_CASUAL[0]!], 3299),
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
      gender: 'women',
      status: 'active',
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
