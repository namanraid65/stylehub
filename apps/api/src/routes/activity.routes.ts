import { Router, Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';

const router = Router();

// GET /api/activity — admin only
router.get('/', async (req: Request, res: Response) => {
  try {
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
