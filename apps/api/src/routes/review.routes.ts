import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Review from '../models/Review';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@stylehub/types';

const router = Router();

const createSchema = z.object({
  productId: z.string().min(1),
  vendorId:  z.string().min(1),
  orderId:   z.string().min(1),
  rating:    z.number().int().min(1).max(5),
  title:     z.string().min(3).max(150),
  body:      z.string().min(10).max(2000),
  images:    z.array(z.string().url()).max(5).default([]),
});

// GET /api/reviews?productId=&page=&limit=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId, page = '1', limit = '10', sort = 'recent' } = req.query as Record<string,string>;
    if (!productId) { res.status(400).json({ success: false, message: 'productId required' }); return; }

    const sortOpt: Record<string, 1 | -1> = sort === 'helpful'
      ? { helpfulVotes: -1 }
      : sort === 'highest' ? { rating: -1 }
      : sort === 'lowest'  ? { rating: 1  }
      : { createdAt: -1 };

    const filter = { product: new mongoose.Types.ObjectId(productId), isApproved: true };
    const total  = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort(sortOpt)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('customer', 'name avatar')
      .lean();

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((b: { _id: number; count: number }) => { ratingMap[b._id] = b.count; });
    const avgRating = total > 0
      ? Object.entries(ratingMap).reduce((s, [r, c]) => s + Number(r) * c, 0) / total
      : 0;

    res.json({
      success: true, reviews, total, avgRating: Math.round(avgRating * 10) / 10,
      ratingBreakdown: ratingMap,
      pagination: { page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// POST /api/reviews
router.post('/', protect, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten() }); return; }
  const customerId = req.user!._id;
  try {
    const { productId, vendorId, orderId, ...rest } = parsed.data;
    const review = await Review.create({
      ...rest,
      product:    new mongoose.Types.ObjectId(productId),
      vendor:     new mongoose.Types.ObjectId(vendorId),
      order:      new mongoose.Types.ObjectId(orderId),
      customer:   new mongoose.Types.ObjectId(customerId),
      isVerified: true,  // assume order lookup done — in production verify order ownership
      isApproved: false, // pending admin approval
    });
    res.status(201).json({ success: true, reviewId: review._id, message: 'Review submitted for approval.' });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to submit review.' });
    }
  }
});

// PATCH /api/reviews/:id/helpful
router.patch('/:id/helpful', protect, async (req: Request, res: Response) => {
  const customerId = req.user!._id;
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ success: false, message: 'Review not found.' }); return; }
    const uid = new mongoose.Types.ObjectId(customerId);
    const alreadyVoted = review.helpfulVotedBy.some((id) => id.equals(uid));
    if (alreadyVoted) {
      review.helpfulVotedBy = review.helpfulVotedBy.filter((id) => !id.equals(uid));
      review.helpfulVotes   = Math.max(0, review.helpfulVotes - 1);
    } else {
      review.helpfulVotedBy.push(uid);
      review.helpfulVotes += 1;
    }
    await review.save();
    res.json({ success: true, helpfulVotes: review.helpfulVotes, voted: !alreadyVoted });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update vote.' });
  }
});

// GET /api/reviews/admin — all (admin only)
router.get('/admin/all', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  try {
    const { approved, page = '1', limit = '20' } = req.query as Record<string,string>;
    const filter: Record<string,unknown> = {};
    if (approved !== undefined) filter.isApproved = approved === 'true';
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page)-1)*Number(limit))
      .limit(Number(limit))
      .populate('product','name slug')
      .populate('customer','name email')
      .lean();
    const total = await Review.countDocuments(filter);
    res.json({ success: true, reviews, total });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// PATCH /api/reviews/:id/approve
router.patch('/:id/approve', protect, authorize(UserRole.Admin), async (req: Request, res: Response) => {
  const { approved, adminNote } = req.body as { approved: boolean; adminNote?: string };
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: approved, ...(adminNote ? { adminNote } : {}) },
      { new: true },
    );
    if (!review) { res.status(404).json({ success: false, message: 'Review not found.' }); return; }
    res.json({ success: true, review });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
});

export default router;
