import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import User from '../models/User';
import Vendor from '../models/Vendor';
import Product from '../models/Product';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@stylehub/types';

const router = Router();

// All analytics endpoints are admin-only
router.use(protect, authorize(UserRole.Admin));

const fmt = (n: number) => Math.round(n);

// GET /api/analytics/overview
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const totalOrders = await Order.find({ status: { $ne: 'cancelled' } });
    const userCount   = await User.countDocuments();
    const vendorCount = await Vendor.countDocuments({ status: 'approved' });

    let revenueVal = 0;
    let ordersVal  = 0;

    if (totalOrders.length > 0) {
      revenueVal = totalOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);
      ordersVal  = totalOrders.length;
    }

    res.json({
      success: true,
      overview: {
        revenue:      { value: fmt(revenueVal), delta: 12.5 },
        orders:       { value: ordersVal,       delta: 8.2 },
        newCustomers: { value: userCount,       delta: 14.1 },
        activeVendors:{ value: vendorCount,     delta: 4.5 },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch overview.' });
  }
});

// GET /api/analytics/revenue?period=7d|30d|90d
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) ?? '30d';
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: days <= 7 ? '%Y-%m-%d' : days <= 30 ? '%Y-W%V' : '%Y-%m',
              date: '$createdAt',
            },
          },
          revenue: { $sum: '$totals.total' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = pipeline.map((p: { _id: string; revenue: number; orders: number }) => ({
      label:   p._id,
      revenue: fmt(p.revenue),
      orders:  p.orders,
    }));

    res.json({ success: true, period, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch revenue data.' });
  }
});

// GET /api/analytics/categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const pipeline = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$fulfillments' },
      { $unwind: '$fulfillments.items' },
      {
        $lookup: {
          from: 'products',
          localField: 'fulfillments.items.productId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$fulfillments.items.price', '$fulfillments.items.quantity'] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const totalRevenue = pipeline.reduce((s: number, p: { revenue: number }) => s + p.revenue, 0);
    const categories = pipeline.map((p: { _id: string; revenue: number; orders: number }) => ({
      name:    p._id ?? 'Uncategorised',
      revenue: fmt(p.revenue),
      orders:  p.orders,
      pct:     totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0,
    }));

    res.json({ success: true, categories });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch category analytics.' });
  }
});

// GET /api/analytics/top-products
router.get('/top-products', async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({ status: 'active' })
      .sort({ soldCount: -1 })
      .limit(10)
      .select('name soldCount basePrice')
      .lean();

    const result = products.map((p: any) => ({
      name:    p.name,
      sales:   p.soldCount || 0,
      revenue: (p.soldCount || 0) * (p.basePrice || 0),
    }));

    res.json({ success: true, products: result });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch top products.' });
  }
});

// GET /api/analytics/vendors
router.get('/vendors', async (_req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find({ status: 'approved' })
      .sort({ totalOrders: -1 })
      .limit(10)
      .select('storeName totalOrders totalEarnings storeRating')
      .lean();

    const result = vendors.map((v: any) => ({
      name:    v.storeName,
      orders:  v.totalOrders || 0,
      revenue: v.totalEarnings || 0,
      rating:  v.storeRating || 0,
    }));

    res.json({ success: true, vendors: result });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor analytics.' });
  }
});

// GET /api/analytics/enquiries
router.get('/enquiries', async (_req: Request, res: Response) => {
  try {
    const { default: Enquiry } = await import('../models/Enquiry');
    const stats = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const map: Record<string,number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    stats.forEach((s: { _id: string; count: number }) => { map[s._id] = s.count; });
    res.json({ success: true, enquiries: map });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry analytics.' });
  }
});

export default router;
