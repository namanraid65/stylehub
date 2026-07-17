import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// ─── Coupon definitions ───────────────────────────────────────────────────────
interface CouponDef {
  code:         string;
  type:         'percent' | 'fixed';
  value:        number;
  maxDiscount?: number;
  description:  string;
  minOrderValue:number;
  active:       boolean;
}

const COUPONS: Record<string, CouponDef> = {
  STYLE10:  { code: 'STYLE10',   type: 'percent', value: 10, maxDiscount: 1000, description: '10% off (max ₹1,000)', minOrderValue: 500,  active: true },
  FLAT200:  { code: 'FLAT200',   type: 'fixed',   value: 200,                   description: '₹200 flat off',        minOrderValue: 999,  active: true },
  WELCOME50:{ code: 'WELCOME50', type: 'percent', value: 50, maxDiscount: 500,  description: '50% off (max ₹500)',   minOrderValue: 300,  active: true },
  FREESHIP: { code: 'FREESHIP',  type: 'fixed',   value: 198,                   description: 'Free delivery',         minOrderValue: 0,    active: true },
};

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
  const coupon = COUPONS[code.toUpperCase().trim()];

  if (!coupon || !coupon.active) {
    res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    return;
  }

  if (subtotal < coupon.minOrderValue) {
    res.status(400).json({
      success: false,
      message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
    });
    return;
  }

  // Compute discount
  let discount = coupon.type === 'percent'
    ? Math.round((subtotal * coupon.value) / 100)
    : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

  res.json({
    success:     true,
    code:        coupon.code,
    type:        coupon.type,
    value:       coupon.value,
    maxDiscount: coupon.maxDiscount,
    description: coupon.description,
    discount,
    message:     `Coupon applied! You save ₹${discount}.`,
  });
});

/**
 * GET /api/coupons — list available coupons (public)
 */
router.get('/', (_req: Request, res: Response) => {
  const list = Object.values(COUPONS)
    .filter((c) => c.active)
    .map(({ code, description, minOrderValue }) => ({ code, description, minOrderValue }));
  res.json({ success: true, coupons: list });
});

export default router;
