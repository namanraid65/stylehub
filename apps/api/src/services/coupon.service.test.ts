import { describe, it, expect } from 'vitest';
import { validateCoupon, getAvailableCoupons, COUPONS } from './coupon.service';

describe('coupon.service', () => {
  describe('validateCoupon', () => {
    it('should validate percentage discount coupon (STYLE10)', () => {
      const result = validateCoupon('STYLE10', 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100);
      expect(result.coupon?.code).toBe('STYLE10');
    });

    it('should cap discount at maxDiscount if defined', () => {
      // STYLE10 gives 10%, max 1000. 10% of 20000 = 2000, max capped at 1000
      const result = validateCoupon('STYLE10', 20000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(1000);
    });

    it('should validate fixed discount coupon (FLAT200)', () => {
      const result = validateCoupon('FLAT200', 1500);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(200);
    });

    it('should reject coupon if subtotal is below minOrderValue', () => {
      const result = validateCoupon('STYLE10', 400); // minOrderValue is 500
      expect(result.valid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.message).toContain('Minimum order value');
    });

    it('should reject invalid or non-existent coupon codes', () => {
      const result = validateCoupon('INVALID_CODE', 1000);
      expect(result.valid).toBe(false);
      expect(result.discount).toBe(0);
      expect(result.message).toBe('Invalid or expired coupon code.');
    });

    it('should handle case insensitivity and whitespace', () => {
      const result = validateCoupon('  welcome50  ', 500);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(250); // 50% of 500 = 250
    });
  });

  describe('getAvailableCoupons', () => {
    it('should return list of active coupons', () => {
      const coupons = getAvailableCoupons();
      expect(coupons.length).toBeGreaterThan(0);
      expect(coupons[0]).toHaveProperty('code');
      expect(coupons[0]).toHaveProperty('description');
      expect(coupons[0]).toHaveProperty('minOrderValue');
    });
  });
});
