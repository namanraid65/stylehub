import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry';

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────
const createSchema = z.object({
  name:          z.string().min(2).max(100),
  email:         z.string().email(),
  phone:         z.string().regex(/^\+?[\d\s\-]{7,15}$/).optional(),
  subject:       z.string().min(3).max(200),
  message:       z.string().min(10).max(5000),
  enquiryType:   z.enum(['general', 'quote', 'bulk_order', 'custom']).default('general'),
  quantity:      z.number().int().positive().optional(),
  productId:     z.string().optional(),
  vendorId:      z.string().optional(),
  productName:   z.string().optional(),
});

const replySchema = z.object({
  message: z.string().min(1).max(2000),
  isAdmin: z.boolean().default(false),
});

const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

// ─── POST /api/enquiries ──────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, errors: parsed.error.flatten() });
    return;
  }
  try {
    const { productId, vendorId, enquiryType, quantity, productName, ...rest } = parsed.data;
    const enquiry = await Enquiry.create({
      ...rest,
      subject: enquiryType === 'quote'
        ? `Quote Request: ${productName ?? rest.subject}`
        : rest.subject,
      product: productId && mongoose.isValidObjectId(productId) ? new mongoose.Types.ObjectId(productId) : undefined,
      vendor:  vendorId  && mongoose.isValidObjectId(vendorId)  ? new mongoose.Types.ObjectId(vendorId)  : undefined,
      user:    req.headers['x-user-id']
        ? new mongoose.Types.ObjectId(req.headers['x-user-id'] as string)
        : undefined,
      // Store extra quote info in message
      message: quantity
        ? `${rest.message}\n\n[Quantity requested: ${quantity}]`
        : rest.message,
    });
    res.status(201).json({ success: true, enquiryId: enquiry._id, message: 'Enquiry submitted successfully.' });
  } catch (err) {
    console.error('[Enquiry Create]', err);
    res.status(500).json({ success: false, message: 'Failed to submit enquiry.' });
  }
});

// ─── GET /api/enquiries ────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status, page = '1', limit = '20', search, startDate, endDate,
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { email:   { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate   ? { $lte: new Date(endDate)   } : {}),
      };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Enquiry.countDocuments(filter);
    const enquiries = await Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('product', 'name slug')
      .populate('vendor',  'name slug')
      .lean();

    res.json({
      success: true,
      enquiries,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries.' });
  }
});

// ─── GET /api/enquiries/:id ────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('product', 'name slug images')
      .populate('vendor',  'name slug')
      .populate('user',    'name email');
    if (!enquiry) { res.status(404).json({ success: false, message: 'Enquiry not found.' }); return; }
    res.json({ success: true, enquiry });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry.' });
  }
});

// ─── POST /api/enquiries/:id/reply ────────────────────────────────────────────
router.post('/:id/reply', async (req: Request, res: Response) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, errors: parsed.error.flatten() });
    return;
  }
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) { res.status(404).json({ success: false, message: 'Enquiry not found.' }); return; }

    const actorId = req.headers['x-user-id'] as string;
    if (!actorId || !mongoose.isValidObjectId(actorId)) {
      res.status(401).json({ success: false, message: 'Authentication required to reply.' });
      return;
    }

    (enquiry.replies as Array<{ from: mongoose.Types.ObjectId; message: string; isAdmin: boolean; createdAt: Date }>).push({
      from:      new mongoose.Types.ObjectId(actorId),
      message:   parsed.data.message,
      isAdmin:   parsed.data.isAdmin,
      createdAt: new Date(),
    });

    if (enquiry.status === 'open') enquiry.status = 'in_progress';
    await enquiry.save();

    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add reply.' });
  }
});

// ─── PATCH /api/enquiries/:id/status ─────────────────────────────────────────
router.patch('/:id/status', async (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, errors: parsed.error.flatten() });
    return;
  }
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      {
        status: parsed.data.status,
        ...(parsed.data.status === 'resolved' ? { resolvedAt: new Date() } : {}),
      },
      { new: true },
    );
    if (!enquiry) { res.status(404).json({ success: false, message: 'Enquiry not found.' }); return; }
    res.json({ success: true, enquiry });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ─── GET /api/enquiries/stats ─────────────────────────────────────────────────
router.get('/meta/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const result: Record<string, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    stats.forEach((s: { _id: string; count: number }) => { result[s._id] = s.count; });
    res.json({ success: true, stats: result });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

export default router;
