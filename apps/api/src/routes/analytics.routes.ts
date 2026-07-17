import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';

const router = Router();

const fmt = (n: number) => Math.round(n);

// GET /api/analytics/overview
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);        // this month
    const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);   // last month
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonth, lastMonth] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null,
            revenue: { $sum: '$totals.total' },
            orders:  { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: prev, $lte: prevEnd }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null,
            revenue: { $sum: '$totals.total' },
            orders:  { $sum: 1 },
          },
        },
      ]),
    ]);

    const cur  = thisMonth[0] ?? { revenue: 0, orders: 0 };
    const prev_ = lastMonth[0] ?? { revenue: 0, orders: 0 };

    const revenueDelta = prev_.revenue > 0 ? fmt(((cur.revenue - prev_.revenue) / prev_.revenue) * 100) : 0;
    const ordersDelta  = prev_.orders  > 0 ? fmt(((cur.orders  - prev_.orders)  / prev_.orders)  * 100) : 0;

    res.json({
      success: true,
      overview: {
        revenue:      { value: fmt(cur.revenue),  delta: revenueDelta },
        orders:       { value: fmt(cur.orders),   delta: ordersDelta  },
        // Stubbed — replace with real Customer/Vendor count queries
        newCustomers: { value: 142, delta: 12  },
        activeVendors:{ value: 38,  delta: 5   },
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
    const days   = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since  = new Date();
    since.setDate(since.getDate() - days);

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: days <= 30 ? '%Y-%m-%d' : '%Y-%U',
              date:   '$createdAt',
            },
          },
          revenue: { $sum: '$totals.total' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    res.json({ success: true, period, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch revenue data.' });
  }
});

// GET /api/analytics/categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    // Mock data — replace with real Product + Order join
    res.json({
      success: true,
      categories: [
        { name: 'Ethnic Wear',  revenue: 284000, orders: 312, pct: 32 },
        { name: 'Dresses',      revenue: 198000, orders: 210, pct: 22 },
        { name: 'Tops',         revenue: 142000, orders: 189, pct: 16 },
        { name: 'Footwear',     revenue: 124000, orders: 145, pct: 14 },
        { name: 'Accessories',  revenue:  98000, orders: 198, pct: 11 },
        { name: 'Denim',        revenue:  44000, orders:  89, pct:  5 },
      ],
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

// GET /api/analytics/vendors
router.get('/vendors', async (_req: Request, res: Response) => {
  try {
    // Aggregate top vendors by fulfillment revenue
    const data = await Order.aggregate([
      { $unwind: '$fulfillments' },
      {
        $group: {
          _id:        '$fulfillments.vendorId',
          vendorName: { $first: '$fulfillments.vendorName' },
          revenue:    { $sum: '$fulfillments.subtotal' },
          orders:     { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, vendors: data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor analytics.' });
  }
});

// GET /api/analytics/enquiries
router.get('/enquiries', async (_req: Request, res: Response) => {
  try {
    // Import inline to avoid circular
    const { default: Enquiry } = await import('../models/Enquiry');
    const stats = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const map: Record<string,number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    stats.forEach((s: { _id: string; count: number }) => { map[s._id] = s.count; });
    res.json({ success: true, enquiries: map });
  } catch {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

export default router;
