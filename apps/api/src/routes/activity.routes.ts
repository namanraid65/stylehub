import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog';

const router = Router();

const seedIfEmpty = async () => {
  const count = await ActivityLog.countDocuments();
  if (count === 0) {
    const seedData = [
      { actor: new mongoose.Types.ObjectId(), actorName: 'Priya Sharma',   actorRole: 'customer', action: 'order.create',    entity: 'Order',   entityId: 'SH-2026-00047', summary: 'Priya Sharma placed order SH-2026-00047 for ₹3,499',  ip: '192.168.1.42', createdAt: new Date(Date.now() - 2*60000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Admin User',     actorRole: 'admin',    action: 'review.approve',  entity: 'Review',  entityId: 'rev-001', summary: 'Admin approved review by Ananya S. on Ivory Kurta',    ip: '10.0.0.1',    createdAt: new Date(Date.now() - 8*60000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'DesiCouture',    actorRole: 'vendor',   action: 'product.update',  entity: 'Product', entityId: 'prod-001', summary: 'DesiCouture updated Ivory Anarkali Kurta pricing',      ip: '172.16.0.5',  createdAt: new Date(Date.now() - 15*60000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Rahul Verma',    actorRole: 'customer', action: 'enquiry.create',  entity: 'Enquiry', entityId: 'enq-012', summary: 'Rahul Verma sent bulk order enquiry for 50 kurtas',      ip: '192.168.2.19', createdAt: new Date(Date.now() - 32*60000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Admin User',     actorRole: 'admin',    action: 'coupon.create',   entity: 'Coupon',  entityId: 'STYLE10', summary: 'Admin created coupon STYLE10 — 10% off, max ₹500',        ip: '10.0.0.1',    createdAt: new Date(Date.now() - 1*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'UrbanThreads',   actorRole: 'vendor',   action: 'order.status',    entity: 'Order',   entityId: 'SH-2026-00046', summary: 'UrbanThreads updated order SH-2026-00046 to shipped',    ip: '172.16.0.8',  createdAt: new Date(Date.now() - 2*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Ananya Singh',   actorRole: 'customer', action: 'review.submit',   entity: 'Review',  entityId: 'rev-002', summary: 'Ananya Singh submitted a 5-star review for Maxi Dress',  ip: '192.168.3.7', createdAt: new Date(Date.now() - 3*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'DesiCouture',    actorRole: 'vendor',   action: 'enquiry.reply',   entity: 'Enquiry', entityId: 'enq-011', summary: 'DesiCouture replied to custom embroidery enquiry',        ip: '172.16.0.5',  createdAt: new Date(Date.now() - 4*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Admin User',     actorRole: 'admin',    action: 'product.create',  entity: 'Product', entityId: 'prod-009', summary: 'Admin created product: Rose Gold Bangle Set',             ip: '10.0.0.1',    createdAt: new Date(Date.now() - 5*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Karan Mehra',    actorRole: 'customer', action: 'auth.login',      entity: 'User',    entityId: 'usr-karan', summary: 'Karan Mehra logged in from Chrome/Windows',              ip: '192.168.4.21', createdAt: new Date(Date.now() - 6*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'Admin User',     actorRole: 'admin',    action: 'review.reject',   entity: 'Review',  entityId: 'rev-003', summary: 'Admin rejected review — contains inappropriate content',   ip: '10.0.0.1',    createdAt: new Date(Date.now() - 8*3600000) },
      { actor: new mongoose.Types.ObjectId(), actorName: 'SoleMate',       actorRole: 'vendor',   action: 'enquiry.resolve', entity: 'Enquiry', entityId: 'enq-010', summary: 'SoleMate resolved enquiry about handcrafted sandals',     ip: '172.16.0.9',  createdAt: new Date(Date.now() - 24*3600000) },
    ];
    await ActivityLog.insertMany(seedData);
  }
};

// GET /api/activity — admin only
router.get('/', async (req: Request, res: Response) => {
  try {
    await seedIfEmpty();

    const {
      page = '1', limit = '50',
      action, entity, actorRole,
      startDate, endDate, search,
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (action)    filter.action    = action;
    if (entity)    filter.entity    = entity;
    if (actorRole) filter.actorRole = actorRole;
    if (search) {
      filter.$or = [
        { actorName: { $regex: search, $options: 'i' } },
        { summary:   { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate   ? { $lte: new Date(endDate)   } : {}),
      };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments(filter);
    const logs  = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true, logs, total,
      pagination: { page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch activity log.' });
  }
});

// GET /api/activity/summary — action counts for the last 7 days
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const summary = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);

    const byRole = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$actorRole', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, summary, byRole });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch summary.' });
  }
});

export default router;
