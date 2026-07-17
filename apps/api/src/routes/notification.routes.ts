import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { extractBearerToken, verifyAccessToken } from '../utils/jwt';

const router = Router();

// Helper to get authenticated user ID from either header or JWT token
const getUserId = (req: Request): string | null => {
  let userId = req.headers['x-user-id'] as string;
  if (!userId && req.headers.authorization) {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (token) {
        const payload = verifyAccessToken(token);
        userId = payload.userId;
      }
    } catch {
      // Ignore token error
    }
  }
  return userId && mongoose.isValidObjectId(userId) ? userId : null;
};

// GET /api/notifications — user's notifications
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query as Record<string,string>;
    const filter: Record<string,unknown> = { recipient: new mongoose.Types.ObjectId(userId) };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: new mongoose.Types.ObjectId(userId), isRead: false }),
    ]);

    res.json({ success: true, notifications, total, unreadCount,
      pagination: { page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, message: 'Auth required.' }); return; }
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: new mongoose.Types.ObjectId(userId) },
      { isRead: true },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to mark read.' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, message: 'Auth required.' }); return; }
  try {
    await Notification.updateMany(
      { recipient: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to mark all read.' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ success: false, message: 'Auth required.' }); return; }
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: new mongoose.Types.ObjectId(userId),
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
});

export default router;
