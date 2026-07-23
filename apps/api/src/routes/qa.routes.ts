import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import QA from '../models/QA';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  productId:    z.string().min(1),
  vendorId:     z.string().min(1),
  question:     z.string().min(5).max(500),
  askedByName:  z.string().min(2).max(100),
  askedByEmail: z.string().email(),
});

const answerSchema = z.object({
  answer: z.string().min(5).max(2000),
});

// GET /api/qa?productId=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId, page = '1', limit = '10', answered } = req.query as Record<string,string>;
    if (!productId) { res.status(400).json({ success: false, message: 'productId required' }); return; }

    const filter: Record<string,unknown> = {
      product:     new mongoose.Types.ObjectId(productId),
      isPublished: true,
    };
    if (answered === 'true')  filter.answer = { $exists: true, $ne: null };
    if (answered === 'false') filter.answer = { $exists: false };

    const total = await QA.countDocuments(filter);
    const items = await QA.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('answeredBy', 'name')
      .lean();

    res.json({ success: true, items, total,
      pagination: { page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch Q&A.' });
  }
});

// POST /api/qa
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten() }); return; }
  try {
    const { productId, vendorId, ...rest } = parsed.data;
    const qa = await QA.create({
      ...rest,
      product:  new mongoose.Types.ObjectId(productId),
      vendor:   new mongoose.Types.ObjectId(vendorId),
      askedBy:  req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
    });
    res.status(201).json({ success: true, qaId: qa._id, message: 'Question submitted successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to submit question.' });
  }
});

// POST /api/qa/:id/answer
router.post('/:id/answer', protect, async (req: Request, res: Response) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten() }); return; }
  const actorId = req.user!._id;
  try {
    const qa = await QA.findByIdAndUpdate(
      req.params.id,
      { answer: parsed.data.answer, answeredBy: new mongoose.Types.ObjectId(actorId), answeredAt: new Date() },
      { new: true },
    );
    if (!qa) { res.status(404).json({ success: false, message: 'Question not found.' }); return; }
    res.json({ success: true, qa });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to submit answer.' });
  }
});

// PATCH /api/qa/:id/helpful
router.patch('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const qa = await QA.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true },
    );
    if (!qa) { res.status(404).json({ success: false, message: 'Question not found.' }); return; }
    res.json({ success: true, helpfulCount: qa.helpfulCount });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to vote.' });
  }
});

export default router;
