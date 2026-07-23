import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Order from '../models/Order';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';
import { UserRole } from '@stylehub/types';
import Vendor from '../models/Vendor';
import Product from '../models/Product';
import User from '../models/User';
import Enquiry from '../models/Enquiry';
import Review from '../models/Review';
import { sendOrderConfirmationEmail } from '../services/email.service';
import { validateCoupon } from '../services/coupon.service';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────
const addressSchema = z.object({
  fullName: z.string().min(2),
  phone:    z.string().regex(/^\d{10}$/),
  line1:    z.string().min(1),
  line2:    z.string().optional(),
  city:     z.string().min(1),
  state:    z.string().min(1),
  pincode:  z.string().regex(/^\d{6}$/),
});

const itemSchema = z.object({
  productId: z.string(),
  name:      z.string(),
  sku:       z.string(),
  price:     z.number().positive(),
  quantity:  z.number().int().positive(),
  size:      z.string(),
  color:     z.string(),
});

const fulfillmentSchema = z.object({
  vendorId:   z.string(),
  vendorName: z.string(),
  items:      z.array(itemSchema),
  subtotal:   z.number().min(0),
  delivery:   z.number().min(0),
});

const createOrderSchema = z.object({
  address:       addressSchema,
  paymentMethod: z.enum(['cod', 'card']),
  fulfillments:  z.array(fulfillmentSchema).min(1),
  coupon: z.object({
    code:        z.string(),
    type:        z.enum(['percent', 'fixed']),
    value:       z.number(),
    maxDiscount: z.number().optional(),
  }).optional().nullable(),
  totals: z.object({
    subtotal: z.number(),
    discount: z.number(),
    tax:      z.number(),
    delivery: z.number(),
    total:    z.number(),
  }),
  guestName:  z.string().optional(),
  guestEmail: z.string().email().optional(),
});

// ─── Generate sequential-ish order number ────────────────────────────────────
async function generateOrderNumber(): Promise<string> {
  const now   = new Date();
  const yymm  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await Order.countDocuments();
  return `SH-${yymm}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * GET /api/orders/my
 * Retrieve orders for the currently authenticated customer.
 */
router.get('/my', protect, async (req: Request, res: Response) => {
  try {
    const page  = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customer: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ customer: req.user!._id }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your orders.' });
  }
});

/**
 * POST /api/orders
 * Creates a new order (guest or authenticated).
 */
router.post('/',
  optionalAuth,
  logActivity('order.create', 'Order', (req: any, resBody: any) => {
    const orderNo = resBody?.orderNumber || 'New Order';
    const name = req.body?.address?.fullName || req.user?.name || req.body?.guestName || 'Customer';
    const total = req.body?.totals?.total || 0;
    return `${name} placed order ${orderNo} for ₹${total}`;
  }),
  async (req: Request, res: Response) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors:  parsed.error.flatten(),
      });
      return;
    }

    try {
      const data        = parsed.data;
      const orderNumber = await generateOrderNumber();

      // Determine customer identity strictly (never trust raw x-user-id header)
      let customerId: mongoose.Types.ObjectId | undefined = undefined;
      if (req.user?._id) {
        customerId = new mongoose.Types.ObjectId(req.user._id);
      } else if (data.guestEmail) {
        let user = await User.findOne({ email: data.guestEmail.toLowerCase() });
        if (!user) {
          user = await User.create({
            name: data.guestName || 'Guest Customer',
            email: data.guestEmail.toLowerCase(),
            passwordHash: 'guest-no-password',
            role: UserRole.Customer,
            isActive: true,
          });
        }
        customerId = user._id;
      }

      // Re-fetch product prices from DB and verify stock availability
      let recomputedSubtotal = 0;
      let recomputedDelivery = 0;
      const verifiedFulfillments = [];
      const stockUpdatesToApply: Array<{ product: any; variant: any; quantity: number }> = [];

      for (const group of data.fulfillments) {
        let fulfillmentSubtotal = 0;
        const verifiedItems = [];

        for (const item of group.items) {
          if (!mongoose.isValidObjectId(item.productId)) {
            res.status(400).json({ success: false, message: `Invalid product ID: ${item.productId}` });
            return;
          }
          const product = await Product.findById(item.productId);
          if (!product || product.status !== 'active') {
            res.status(400).json({ success: false, message: `Product '${item.name}' is no longer available.` });
            return;
          }

          // Find matching variant
          const variant = (product.variants || []).find(
            (v: any) => v.size === item.size && v.color === item.color
          );

          const availableStock = variant ? variant.stock : product.totalStock;
          if (availableStock < item.quantity) {
            res.status(400).json({
              success: false,
              message: `Insufficient stock for '${product.name}' (${item.size}/${item.color}). Requested: ${item.quantity}, Available: ${availableStock}`,
            });
            return;
          }

          // Use real unit price from database (variant price or product basePrice)
          const verifiedUnitPrice = (variant && typeof variant.price === 'number' && variant.price > 0)
            ? variant.price
            : product.basePrice;

          fulfillmentSubtotal += verifiedUnitPrice * item.quantity;
          verifiedItems.push({
            ...item,
            price: verifiedUnitPrice,
          });

          stockUpdatesToApply.push({
            product,
            variant,
            quantity: item.quantity,
          });
        }

        recomputedSubtotal += fulfillmentSubtotal;
        recomputedDelivery += group.delivery;

        verifiedFulfillments.push({
          ...group,
          items: verifiedItems,
          subtotal: fulfillmentSubtotal,
          status: 'placed' as const,
          createdAt: new Date(),
        });
      }

      // Validate coupon server-side against recomputed subtotal
      let recomputedDiscount = 0;
      let verifiedCoupon = undefined;

      if (data.coupon?.code) {
        const couponResult = validateCoupon(data.coupon.code, recomputedSubtotal);
        if (!couponResult.valid || !couponResult.coupon) {
          res.status(400).json({ success: false, message: couponResult.message });
          return;
        }
        recomputedDiscount = couponResult.discount;
        verifiedCoupon = {
          code: couponResult.coupon.code,
          type: couponResult.coupon.type,
          value: couponResult.coupon.value,
          maxDiscount: couponResult.coupon.maxDiscount,
        };
      }

      const recomputedTax = Math.round(Math.max(0, recomputedSubtotal - recomputedDiscount) * 0.18);
      const recomputedTotal = Math.max(0, recomputedSubtotal - recomputedDiscount + recomputedTax + recomputedDelivery);

      const verifiedTotals = {
        subtotal: recomputedSubtotal,
        discount: recomputedDiscount,
        tax:      recomputedTax,
        delivery: recomputedDelivery,
        total:    recomputedTotal,
      };

      const order = await Order.create({
        orderNumber,
        customer: customerId,
        guestInfo: {
          name:  data.guestName,
          email: data.guestEmail,
        },
        address:       data.address,
        fulfillments:  verifiedFulfillments,
        coupon:        verifiedCoupon,
        totals:        verifiedTotals,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'card' ? 'paid' : 'pending',
        status:        'placed',
      });

      // Update product stock and soldCount for verified items
      for (const update of stockUpdatesToApply) {
        const { product, variant, quantity } = update;
        product.soldCount = (product.soldCount || 0) + quantity;
        if (variant) {
          variant.stock = Math.max(0, variant.stock - quantity);
        }
        product.totalStock = (product.variants || []).reduce((sum: number, v: any) => sum + v.stock, 0);
        await product.save();
      }

      // Dispatch order confirmation email mock in the background
      sendOrderConfirmationEmail(order).catch((e) => console.error('[Order Email Dispatch Error]', e));

      res.status(201).json({
        success:     true,
        orderId:     order._id,
        orderNumber: order.orderNumber,
        status:      order.status,
        message:     'Order placed successfully!',
      });
    } catch (err: unknown) {
      console.error('[Order Create Error]', err);
      res.status(500).json({ success: false, message: 'Failed to create order.' });
    }
  });

/**
 * GET /api/orders/vendor/stats
 * Retrieve statistics for the logged-in vendor.
 */
router.get('/vendor/stats', protect, authorize(UserRole.Vendor, UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor profile not found.' });
      return;
    }

    const vendorIdStr = vendor._id.toString();
    const orders = await Order.find({ 'fulfillments.vendorId': vendorIdStr });

    let totalRevenue = 0;
    let totalOrders = orders.length;
    let pendingFulfillments = 0;

    for (const order of orders) {
      const vFulfillment = order.fulfillments.find((f) => f.vendorId === vendorIdStr);
      if (vFulfillment) {
        totalRevenue += vFulfillment.subtotal;
        if (vFulfillment.status === 'pending' || vFulfillment.status === 'placed') {
          pendingFulfillments++;
        }
      }
    }

    const productCount = await Product.countDocuments({ vendor: vendor._id, status: 'active' });

    // 1. Donut Chart (Status)
    const statusAgg = await Order.aggregate([
      { $match: { 'fulfillments.vendorId': vendorIdStr } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 2. Area Chart (Monthly Revenue)
    const monthlyAgg = await Order.aggregate([
      {
        $match: {
          'fulfillments.vendorId': vendorIdStr,
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$fulfillments' },
      { $match: { 'fulfillments.vendorId': vendorIdStr } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$fulfillments.subtotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const topProducts = await Product.find({ vendor: vendor._id, status: 'active' })
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name basePrice images soldCount avgRating')
      .lean();

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        pendingFulfillments,
        productCount,
        statusDistribution: statusAgg.map(s => ({ name: s._id, value: s.count })),
        monthlyRevenue: monthlyAgg.map(m => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m._id.month - 1] || 'Unknown',
          revenue: m.revenue,
          orders: m.orders
        })),
        topProducts: topProducts.map(p => ({
          name: p.name,
          orders: p.soldCount || 0,
          revenue: (p.soldCount || 0) * (p.basePrice || 0),
          rating: p.avgRating || 5.0
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor stats.' });
  }
});

/**
 * GET /api/orders/vendor/mine
 * Retrieve orders containing items sold by the logged-in vendor.
 */
router.get('/vendor/mine', protect, authorize(UserRole.Vendor, UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user!._id });
    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor profile not found.' });
      return;
    }

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = {
      'fulfillments.vendorId': vendor._id.toString(),
    };

    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    // Filter fulfillments so vendor only sees their own items & totals
    const filteredOrders = orders.map((order) => {
      const vendorFulfillment = order.fulfillments.filter(
        (f) => f.vendorId === vendor._id.toString()
      );
      const vendorSubtotal = vendorFulfillment.reduce((sum, f) => sum + f.subtotal, 0);
      const vendorDelivery = vendorFulfillment.reduce((sum, f) => sum + f.delivery, 0);

      return {
        ...order,
        fulfillments: vendorFulfillment,
        subtotal: vendorSubtotal,
        total: vendorSubtotal + vendorDelivery,
        status: vendorFulfillment[0]?.status || order.status,
      };
    });

    res.json({
      success: true,
      data: filteredOrders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor orders.' });
  }
});

/**
 * GET /api/orders/stats
 * Retrieve order statistics for admin.
 */
router.get('/stats', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const activeProducts = await Product.countDocuments({ status: 'active' });
    const activeVendors = await Vendor.countDocuments({ status: 'approved' });

    // 1. Donut Chart (Status)
    const statusAgg = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 2. Area Chart (Monthly Revenue)
    const monthlyAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totals.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 3. Top Vendors
    const topVendorsAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$fulfillments' },
      {
        $group: {
          _id: '$fulfillments.vendorId',
          storeName: { $first: '$fulfillments.vendorName' },
          orders: { $sum: 1 },
          revenue: { $sum: '$fulfillments.subtotal' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        activeProducts,
        activeVendors,
        statusDistribution: statusAgg.map(s => ({ name: s._id, value: s.count })),
        monthlyRevenue: monthlyAgg.map(m => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m._id.month - 1] || 'Unknown',
          revenue: m.revenue,
          orders: m.orders
        })),
        topVendors: topVendorsAgg.map(v => ({
          name: v.storeName || 'Vendor',
          orders: v.orders,
          revenue: v.revenue,
          rating: 4.8
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

/**
 * GET /api/orders/analytics
 * Retrieve rich aggregates for Analytics page.
 */
router.get('/analytics', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const activeProducts = await Product.countDocuments({ status: 'active' });
    const activeVendors = await Vendor.countDocuments({ status: 'approved' });
    const newCustomers = await User.countDocuments({ role: 'customer' });

    // 1. Monthly Trend
    const monthlyAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$totals.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // 2. Category Distribution
    const categoryAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$fulfillments' },
      { $unwind: '$fulfillments.items' },
      {
        $addFields: {
          prodIdObj: { $toObjectId: '$fulfillments.items.productId' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'prodIdObj',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.name',
          revenue: { $sum: { $multiply: ['$fulfillments.items.price', '$fulfillments.items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // 3. Top Products
    const topProductsAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$fulfillments' },
      { $unwind: '$fulfillments.items' },
      {
        $group: {
          _id: '$fulfillments.items.productId',
          name: { $first: '$fulfillments.items.name' },
          sales: { $sum: '$fulfillments.items.quantity' },
          revenue: { $sum: { $multiply: ['$fulfillments.items.price', '$fulfillments.items.quantity'] } }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    // 4. Vendor Performance
    const topVendorsAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$fulfillments' },
      {
        $group: {
          _id: '$fulfillments.vendorId',
          storeName: { $first: '$fulfillments.vendorName' },
          orders: { $sum: 1 },
          revenue: { $sum: '$fulfillments.subtotal' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 5. Enquiry Distribution
    let enquiryAgg = [];
    try {
      enquiryAgg = await Enquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    } catch (e) {
      // Ignore if Enquiry model not loaded/empty
    }

    // 6. Review Star Distribution
    let reviewAgg = [];
    try {
      reviewAgg = await Review.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]);
    } catch (e) {
      // Ignore if Review model not loaded/empty
    }

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        activeProducts,
        activeVendors,
        newCustomers,
        dailyTrend: monthlyAgg.map(m => ({
          label: `${m._id.day}/${m._id.month}`,
          revenue: m.revenue,
          orders: m.orders
        })),
        categoryDistribution: categoryAgg.map((c, i) => ({
          name: c._id || 'Uncategorized',
          revenue: c.revenue,
          pct: 0,
          color: ['#C084FC', '#F472B6', '#FB7185', '#FBB035', '#34D399', '#60A5FA'][i % 6]
        })),
        topProducts: topProductsAgg.map(p => ({
          name: p.name,
          sales: p.sales,
          revenue: p.revenue
        })),
        vendorPerformance: topVendorsAgg.map(v => ({
          name: v.storeName || 'Vendor',
          orders: v.orders,
          revenue: v.revenue,
          rating: 4.8
        })),
        enquiryDistribution: enquiryAgg.map(e => ({
          name: e._id,
          value: e.count,
          color: e._id === 'resolved' ? '#34D399' : e._id === 'pending' ? '#FB7185' : '#A855F7'
        })),
        reviewDistribution: reviewAgg.map(r => ({
          label: `${r._id}★`,
          count: r.count
        }))
      }
    });
  } catch (err) {
    console.error('[Analytics Fetch Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

/**
 * GET /api/orders
 * Retrieve all orders (admin only).
 */
router.get('/', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

/**
 * GET /api/orders/:id
 * Retrieve single order by ID or orderNumber.
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order  = mongoose.isValidObjectId(id)
      ? await Order.findById(id)
      : await Order.findOne({ orderNumber: id });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // If caller is a vendor, filter fulfillments and adjust totals accordingly
    if (req.user && req.user.role === UserRole.Vendor) {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (vendor) {
        const vendorIdStr = vendor._id.toString();
        const myFulfillments = order.fulfillments.filter(
          (f) => f.vendorId === vendorIdStr
        );
        const mySubtotal = myFulfillments.reduce((sum, f) => sum + f.subtotal, 0);
        const myDelivery = myFulfillments.reduce((sum, f) => sum + f.delivery, 0);

        const filteredOrder = {
          ...order.toObject(),
          fulfillments: myFulfillments,
          totals: {
            ...order.totals,
            subtotal: mySubtotal,
            total: mySubtotal + myDelivery,
            delivery: myDelivery,
          },
          status: myFulfillments[0]?.status || order.status,
        };

        res.json({ success: true, order: filteredOrder });
        return;
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update fulfillment status (vendor/admin only).
 */
router.patch('/:id/status',
  protect,
  authorize(UserRole.Vendor, UserRole.Admin),
  logActivity('order.status', 'Order', (req: any, resBody: any) => {
    const order = resBody?.order;
    const orderNo = order?.orderNumber || 'Order';
    const status = req.body?.status || '';
    const actorName = req.user?.name || 'User';
    return `${actorName} updated order ${orderNo} status to ${status}`;
  }),
  async (req: Request, res: Response) => {
    try {
      const { id }     = req.params;
      const { status, vendorId } = req.body as { status: string; vendorId?: string };

      const order = await Order.findById(id);
      if (!order) { res.status(404).json({ success: false, message: 'Order not found.' }); return; }

      if (req.user!.role === UserRole.Vendor) {
        const vendor = await Vendor.findOne({ user: req.user!._id });
        if (!vendor) {
          res.status(404).json({ success: false, message: 'Vendor profile not found.' });
          return;
        }
        const targetVendorId = vendor._id.toString();
        const f = order.fulfillments.find(
          (f) => f.vendorId === targetVendorId
        );
        if (!f) {
          res.status(403).json({ success: false, message: 'Fulfillment for this vendor not found in this order.' });
          return;
        }
        f.status = status;
      } else {
        // For Admin
        if (vendorId) {
          const f = order.fulfillments.find((f) => f.vendorId === vendorId);
          if (f) f.status = status;
        } else {
          order.set('status', status);
          // Sync all fulfillments to the new overall status set by admin
          order.fulfillments.forEach((f) => {
            f.status = status;
          });
        }
      }

      // Automatically recalculate the overall order status based on all fulfillments
      const statuses = order.fulfillments.map((f: any) => f.status);
      if (statuses.every((s: string) => s === 'delivered')) {
        order.status = 'delivered';
      } else if (statuses.every((s: string) => s === 'shipped' || s === 'delivered')) {
        order.status = 'shipped';
      } else if (statuses.every((s: string) => s === 'processing' || s === 'shipped' || s === 'delivered')) {
        order.status = 'processing';
      } else if (statuses.every((s: string) => s === 'confirmed' || s === 'processing' || s === 'shipped' || s === 'delivered')) {
        order.status = 'confirmed';
      } else if (statuses.every((s: string) => s === 'cancelled')) {
        order.status = 'cancelled';
      }

      await order.save();
      res.json({ success: true, order });
    } catch (err) {
      console.error('[Order Status Update Error]', err);
      res.status(500).json({ success: false, message: 'Failed to update status.' });
    }
  }
);

/**
 * PATCH /api/orders/:id/payment-status
 * Update payment status (vendor/admin only).
 */
router.patch('/:id/payment-status',
  protect,
  authorize(UserRole.Admin),
  logActivity('order.status', 'Order', (req: any, resBody: any) => {
    const order = resBody?.order;
    const orderNo = order?.orderNumber || 'Order';
    const paymentStatus = req.body?.paymentStatus || '';
    const actorName = req.user?.name || 'User';
    return `${actorName} updated order ${orderNo} payment status to ${paymentStatus}`;
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body as { paymentStatus: string };

      const order = await Order.findById(id);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      order.paymentStatus = paymentStatus;
      await order.save();
      res.json({ success: true, order });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to update payment status.' });
    }
  }
);

/**
 * POST /api/orders/:id/cancel
 * Customer order cancellation.
 */
router.post('/:id/cancel', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    const order = mongoose.isValidObjectId(id)
      ? await Order.findById(id)
      : await Order.findOne({ orderNumber: id });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.customer && (!req.user || req.user._id.toString() !== order.customer.toString())) {
      res.status(403).json({ success: false, message: 'You are not authorized to cancel this order.' });
      return;
    }

    const cancellableStatuses = ['placed', 'confirmed', 'pending'];
    if (!cancellableStatuses.includes(order.status)) {
      res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.status}` });
      return;
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelled by customer';
    order.fulfillments.forEach((f) => {
      f.status = 'cancelled';
    });

    // Revert stock
    const orderItems = order.fulfillments.flatMap((f: any) => f.items);
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(
          (v: any) => v.size === item.size && v.color === item.color
        );
        if (variant) {
          variant.stock += item.quantity;
        }
        product.totalStock = product.variants.reduce((sum: number, v: any) => sum + (v.isActive !== false ? v.stock : 0), 0);
        product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
        await product.save();
      }
    }

    await order.save();
    res.json({ success: true, message: 'Order cancelled successfully.', order });
  } catch (err) {
    console.error('[Order Customer Cancel Error]', err);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

/**
 * POST /api/orders/:id/return
 * Customer order return request.
 */
router.post('/:id/return', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    const order = mongoose.isValidObjectId(id)
      ? await Order.findById(id)
      : await Order.findOne({ orderNumber: id });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.customer && (!req.user || req.user._id.toString() !== order.customer.toString())) {
      res.status(403).json({ success: false, message: 'You are not authorized to return this order.' });
      return;
    }

    if (order.status !== 'delivered') {
      res.status(400).json({ success: false, message: 'Only delivered orders can be returned.' });
      return;
    }

    order.status = 'returned';
    order.returnReason = reason || 'Returned by customer';
    order.fulfillments.forEach((f) => {
      f.status = 'returned';
    });

    // Revert stock
    const orderItems = order.fulfillments.flatMap((f: any) => f.items);
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(
          (v: any) => v.size === item.size && v.color === item.color
        );
        if (variant) {
          variant.stock += item.quantity;
        }
        product.totalStock = product.variants.reduce((sum: number, v: any) => sum + (v.isActive !== false ? v.stock : 0), 0);
        product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
        await product.save();
      }
    }

    await order.save();
    res.json({ success: true, message: 'Order return processed successfully.', order });
  } catch (err) {
    console.error('[Order Customer Return Error]', err);
    res.status(500).json({ success: false, message: 'Failed to request return.' });
  }
});

export default router;
