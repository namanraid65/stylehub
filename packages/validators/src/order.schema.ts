import { z } from 'zod';

// ─── Place Order ──────────────────────────────────────────────────────────────
export const placeOrderSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.enum(['card', 'upi', 'cod'], {
    required_error: 'Payment method is required',
  }),
  couponCode: z.string().trim().toUpperCase().optional(),
  notes: z.string().max(500).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

// ─── Update Order Status (vendor / admin) ─────────────────────────────────────
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned',
  ]),
  trackingNumber: z.string().optional(),
  note: z.string().max(300).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
