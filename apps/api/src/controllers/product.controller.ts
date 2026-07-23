import { Request, Response } from 'express';
import mongoose from 'mongoose';
import slugify from 'slugify';
import Product, { IProductDoc } from '../models/Product';
import Vendor from '../models/Vendor';
import User from '../models/User';
import Notification from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponseBuilder } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '@stylehub/types';
import { checkAndTriggerLowStockAlert } from '../utils/lowStockAlert';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildProductFilter = (query: Record<string, string>) => {
  const filter: Record<string, unknown> = {};

  if (query['status'] && query['status'] !== 'all') {
    filter['status'] = query['status'];
  } else if (!query['status']) {
    filter['status'] = 'active';
  }

  if (query['ids']) {
    const idList = query['ids'].split(',').map(id => id.trim()).filter(id => mongoose.isValidObjectId(id));
    if (idList.length > 0) {
      filter['_id'] = { $in: idList };
    }
  }

  if (query['category'])  filter['category']  = query['category'];
  if (query['vendor'])    filter['vendor']     = query['vendor'];
  if (query['brand'])     filter['brand']      = new RegExp(query['brand']!, 'i');
  if (query['gender'])    filter['gender']     = query['gender'];
  if (query['featured'])  filter['isFeatured'] = true;

  if (query['minPrice'] || query['maxPrice']) {
    filter['basePrice'] = {
      ...(query['minPrice'] && { $gte: Number(query['minPrice']) }),
      ...(query['maxPrice'] && { $lte: Number(query['maxPrice']) }),
    };
  }

  if (query['inStock']) filter['totalStock'] = { $gt: 0 };

  if (query['q']) {
    filter['$text'] = { $search: query['q'] };
  }

  return filter;
};

const buildSort = (sort?: string): Record<string, 1 | -1> => {
  const sorts: Record<string, Record<string, 1 | -1>> = {
    newest:      { createdAt: -1 },
    oldest:      { createdAt:  1 },
    price_asc:   { basePrice:  1 },
    price_desc:  { basePrice: -1 },
    rating:      { avgRating: -1 },
    popular:     { soldCount: -1 },
  };
  return sorts[sort ?? 'newest'] ?? sorts['newest']!;
};

// ─── GET /api/products ────────────────────────────────────────────────────────
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, Number(req.query['page'] ?? 1));
  const limit = Math.min(200, Math.max(1, Number(req.query['limit'] ?? 20)));
  const skip  = (page - 1) * limit;

  const filter = buildProductFilter(req.query as Record<string, string>);

  // Only show products from approved vendors for public queries
  const approvedVendors = await Vendor.find({ status: 'approved' }).select('_id');
  const approvedVendorIds = approvedVendors.map(v => v._id);
  if (filter['vendor']) {
    filter['vendor'] = { $in: approvedVendorIds.filter(id => id.toString() === String(filter['vendor'])) };
  } else {
    filter['vendor'] = { $in: approvedVendorIds };
  }

  const sort   = buildSort(req.query['sort'] as string);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('name slug images basePrice compareAtPrice brand gender avgRating reviewCount totalStock isFeatured status variants vendor')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('vendor', 'storeName storeSlug storeRating totalReviews status')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json(ApiResponseBuilder.paginated('Products fetched.', products, page, limit, total));
});

// ─── GET /api/products/featured ───────────────────────────────────────────────
export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const approvedVendors = await Vendor.find({ status: 'approved' }).select('_id');
  const approvedVendorIds = approvedVendors.map(v => v._id);

  const products = await Product.find({
    status: 'active',
    isFeatured: true,
    totalStock: { $gt: 0 },
    vendor: { $in: approvedVendorIds }
  })
    .select('name slug images basePrice compareAtPrice brand avgRating reviewCount variants vendor')
    .limit(12)
    .sort({ soldCount: -1 })
    .populate('vendor', 'storeName storeSlug storeRating totalReviews status')
    .lean();

  res.json(ApiResponseBuilder.success('Featured products fetched.', products));
});

// ─── GET /api/products/:slug ──────────────────────────────────────────────────
export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const isId = mongoose.isValidObjectId(slug);

  const query: any = isId ? { _id: slug } : { slug };

  const isStaff = req.user && (req.user.role === UserRole.Admin || req.user.role === UserRole.Vendor);
  if (!isStaff) {
    query.status = 'active';
  }

  const product = await Product.findOne(query)
    .populate('category', 'name slug parent')
    .populate('vendor',   'storeName storeSlug storeRating totalReviews status')
    .lean();

  if (!product) throw ApiError.notFound('Product');

  if (!isStaff && (product.vendor as any)?.status !== 'approved') {
    throw ApiError.notFound('Product');
  }

  res.json(ApiResponseBuilder.success('Product fetched.', product));
});

// ─── POST /api/products — [vendor, admin] ─────────────────────────────────────
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, ...rest } = req.body as { name: string; slug?: string; [key: string]: unknown };

  // Resolve vendor id from the logged-in user
  let vendorId: string;
  if (req.user!.role === UserRole.Admin) {
    if (rest['vendorId'] && mongoose.isValidObjectId(rest['vendorId'] as string)) {
      vendorId = rest['vendorId'] as string;
    } else {
      let vendor = await Vendor.findOne({ user: req.user!._id });
      if (!vendor) {
        vendor = await Vendor.findOne({ status: 'approved' });
      }
      if (!vendor) {
        vendor = await Vendor.findOne();
      }
      if (!vendor) {
        vendor = await Vendor.create({
          user: req.user!._id,
          storeName: 'StyleHub Official',
          storeSlug: 'stylehub-official',
          storeDescription: 'Official StyleHub Store',
          status: 'approved',
        });
      }
      vendorId = vendor._id.toString();
    }
  } else {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor) throw ApiError.forbidden('You do not have a vendor profile.');
    if (vendor.status !== 'approved') {
      throw ApiError.forbidden('Your vendor account is pending approval.');
    }
    vendorId = vendor._id.toString();
  }

  const autoSlug = slug
    ? slugify(slug, { lower: true, strict: true })
    : slugify(name, { lower: true, strict: true });

  // Ensure slug uniqueness
  const base = autoSlug;
  let finalSlug = base;
  let attempt = 0;
  while (await Product.exists({ slug: finalSlug })) {
    attempt++;
    finalSlug = `${base}-${attempt}`;
  }

  const product = await Product.create({ name, slug: finalSlug, vendor: vendorId, ...rest });

  // Notification for followers
  try {
    const vendor = await Vendor.findById(vendorId);
    if (vendor) {
      const followers = await User.find({ followedVendors: vendor._id });
      if (followers.length > 0) {
        await Notification.create(
          followers.map((f) => ({
            recipient: f._id,
            type: 'system',
            title: `New Arrival at ${vendor.storeName}!`,
            message: `${product.name} is now available. Click to explore.`,
            link: `/products/${product.slug}`,
          }))
        );
      }
    }
  } catch (err) {
    console.error('Failed to send new product notifications:', err);
  }

  res.status(201).json(ApiResponseBuilder.success('Product created.', product));
});

// ─── PUT /api/products/:id — [vendor (own), admin] ────────────────────────────
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params['id']);
  if (!product) throw ApiError.notFound('Product');

  // Vendors can only edit their own products
  if (req.user!.role === UserRole.Vendor) {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      throw ApiError.forbidden('You can only edit your own products.');
    }
  }

  const oldPrice = product.basePrice;
  const oldComparePrice = product.compareAtPrice;

  Object.assign(product, req.body);
  await product.save();
  await checkAndTriggerLowStockAlert(product);

  // Notification for sale/price drop
  try {
    const isNewSale = product.compareAtPrice && product.compareAtPrice > product.basePrice && (!oldComparePrice || oldComparePrice <= oldPrice || product.basePrice < oldPrice);
    if (isNewSale) {
      const vendor = await Vendor.findById(product.vendor);
      if (vendor) {
        const followers = await User.find({ followedVendors: vendor._id });
        if (followers.length > 0) {
          await Notification.create(
            followers.map((f) => ({
              recipient: f._id,
              type: 'system',
              title: `Special Sale at ${vendor.storeName}!`,
              message: `${product.name} is now on sale for ₹${product.basePrice}! Save big now.`,
              link: `/products/${product.slug}`,
            }))
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to send sale notifications:', err);
  }

  res.json(ApiResponseBuilder.success('Product updated.', product));
});

// ─── PATCH /api/products/:id/variants/:variantId/stock — [vendor, admin] ─────
export const updateVariantStock = asyncHandler(async (req: Request, res: Response) => {
  const { id, variantId } = req.params as { id: string; variantId: string };
  const { stock } = req.body as { stock: number };

  if (typeof stock !== 'number' || stock < 0) {
    throw ApiError.badRequest('stock must be a non-negative number.');
  }

  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product');

  // Ownership check for vendors
  if (req.user!.role === UserRole.Vendor) {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      throw ApiError.forbidden('You can only edit your own product variants.');
    }
  }

  const variant = (product.variants as mongoose.Types.DocumentArray<any>).id(new mongoose.Types.ObjectId(variantId));
  if (!variant) throw ApiError.notFound('Variant');

  variant.stock = stock;
  // Pre-save hook will sync totalStock
  await product.save();
  await checkAndTriggerLowStockAlert(product);

  res.json(ApiResponseBuilder.success('Variant stock updated.', { variantId, stock, totalStock: product.totalStock }));
});

// ─── DELETE /api/products/:id — [vendor (own), admin] ────────────────────────
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params['id']);
  if (!product) throw ApiError.notFound('Product');

  if (req.user!.role === UserRole.Vendor) {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      throw ApiError.forbidden('You can only archive your own products.');
    }
  }

  // Soft-delete (archive) to preserve order references
  product.status = 'archived' as IProductDoc['status'];
  await product.save();
  res.json(ApiResponseBuilder.success('Product archived.'));
});

// ─── GET /api/vendor/products — [vendor] — their own product list ─────────────
export const getVendorProducts = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await Vendor.findOne({ user: req.user!._id });
  if (!vendor) throw ApiError.notFound('Vendor profile');

  const page  = Math.max(1, Number(req.query['page'] ?? 1));
  const limit = Math.min(50, Number(req.query['limit'] ?? 20));
  const skip  = (page - 1) * limit;
  const statusFilter = req.query['status'] ? { status: req.query['status'] } : {};

  const [products, total] = await Promise.all([
    Product.find({ vendor: vendor._id, ...statusFilter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments({ vendor: vendor._id, ...statusFilter }),
  ]);

  res.json(ApiResponseBuilder.paginated('Vendor products fetched.', products, page, limit, total));
});
