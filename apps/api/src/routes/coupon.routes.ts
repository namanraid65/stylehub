import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateCoupon, getAvailableCoupons } from '../services/coupon.service';

const router = Router();

const validateSchema = z.object({
  code:     z.string().min(1),
  subtotal: z.number().min(0),
});

/**
 * POST /api/coupons/validate
 * Body: { code: string, subtotal: number }
 */
router.post('/validate', (req: Request, res: Response) => {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid request body' });
    return;
  }

  const { code, subtotal } = parsed.data;
  const result = validateCoupon(code, subtotal);

  if (!result.valid || !result.coupon) {
    res.status(400).json({ success: false, message: result.message });
    return;
  }

  res.json({
    success:     true,
    code:        result.coupon.code,
    type:        result.coupon.type,
    value:       result.coupon.value,
    maxDiscount: result.coupon.maxDiscount,
    description: result.coupon.description,
    discount:    result.discount,
    message:     result.message,
  });
});

/**
 * GET /api/coupons — list available coupons (public)
 */
router.get('/', (_req: Request, res: Response) => {
  const list = getAvailableCoupons();
  res.json({ success: true, coupons: list });
});

export default router;
