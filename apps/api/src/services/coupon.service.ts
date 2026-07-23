export interface CouponDef {
  code:          string;
  type:          'percent' | 'fixed';
  value:         number;
  maxDiscount?:  number;
  description:   string;
  minOrderValue: number;
  active:        boolean;
}

export const COUPONS: Record<string, CouponDef> = {
  STYLE10:   { code: 'STYLE10',   type: 'percent', value: 10, maxDiscount: 1000, description: '10% off (max ₹1,000)', minOrderValue: 500,  active: true },
  FLAT200:   { code: 'FLAT200',   type: 'fixed',   value: 200,                   description: '₹200 flat off',        minOrderValue: 999,  active: true },
  WELCOME50: { code: 'WELCOME50', type: 'percent', value: 50, maxDiscount: 500,  description: '50% off (max ₹500)',   minOrderValue: 300,  active: true },
  FREESHIP:  { code: 'FREESHIP',  type: 'fixed',   value: 198,                   description: 'Free delivery',         minOrderValue: 0,    active: true },
};

export interface CouponValidationResult {
  valid:        boolean;
  message:      string;
  coupon?:      CouponDef;
  discount:     number;
}

export function validateCoupon(code: string, subtotal: number): CouponValidationResult {
  const coupon = COUPONS[code.toUpperCase().trim()];

  if (!coupon || !coupon.active) {
    return {
      valid: false,
      message: 'Invalid or expired coupon code.',
      discount: 0,
    };
  }

  if (subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
      discount: 0,
    };
  }

  let discount = coupon.type === 'percent'
    ? Math.round((subtotal * coupon.value) / 100)
    : coupon.value;

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return {
    valid: true,
    message: `Coupon applied! You save ₹${discount}.`,
    coupon,
    discount,
  };
}

export function getAvailableCoupons() {
  return Object.values(COUPONS)
    .filter((c) => c.active)
    .map(({ code, description, minOrderValue }) => ({ code, description, minOrderValue }));
}
