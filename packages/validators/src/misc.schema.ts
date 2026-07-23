import { z } from 'zod';

// ─── Create Review ────────────────────────────────────────────────────────────
export const createReviewSchema = z.object({
  orderId: z.string().min(1, 'Order reference is required'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z
    .string({ required_error: 'Review title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(150),
  body: z
    .string({ required_error: 'Review body is required' })
    .min(10, 'Review must be at least 10 characters')
    .max(2000),
  images: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').default([]),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.omit({ orderId: true }).partial();
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// ─── Enquiry ──────────────────────────────────────────────────────────────────
export const createEnquirySchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200).trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000).trim(),
  productId: z.string().optional(),
  vendorId:  z.string().optional(),
  orderId:   z.string().optional(),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

export const replyEnquirySchema = z.object({
  message: z.string().min(5).max(2000).trim(),
});

export type ReplyEnquiryInput = z.infer<typeof replyEnquirySchema>;

// ─── Category ─────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name:           z.string().min(2).max(80).trim(),
  slug:           z.string().min(2).max(80).toLowerCase().trim().optional(),
  parent:         z.string().nullable().optional(),
  description:    z.string().max(500).optional(),
  image:          z.string().optional(),
  isActive:       z.boolean().default(true),
  sortOrder:      z.number().int().min(0).default(0),
  seoTitle:       z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── Vendor update (store settings) ──────────────────────────────────────────
export const updateStoreSchema = z.object({
  storeName:        z.string().min(3).max(80).trim().optional(),
  storeDescription: z.string().max(1000).trim().optional(),
  storeLogo:        z.string().url().optional(),
  storeBanner:      z.string().url().optional(),
  storeTags:        z.array(z.string()).max(10).optional(),
  storeLocation:    z.string().max(200).optional(),
  socialLinks: z
    .object({
      instagram: z.string().url().optional(),
      facebook:  z.string().url().optional(),
      website:   z.string().url().optional(),
    })
    .optional(),
});

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

// ─── Cart operations ──────────────────────────────────────────────────────────
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().min(1, 'Variant is required'),
  quantity:  z.number().int().min(1).max(50).default(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// ─── CMS Section ─────────────────────────────────────────────────────────────
export const upsertCMSSectionSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  type: z
    .enum(['hero', 'banner', 'carousel', 'grid', 'text', 'faq', 'testimonial', 'newsletter', 'custom'])
    .default('custom'),
  title:       z.string().min(1).max(200).trim(),
  subtitle:    z.string().max(300).trim().optional(),
  description: z.string().max(5000).trim().optional(),
  images:      z.array(z.string().url()).default([]),
  ctaButtons: z
    .array(
      z.object({
        label: z.string().min(1),
        url:   z.string().min(1),
        style: z.enum(['primary', 'secondary', 'outline']).default('primary'),
      }),
    )
    .max(5)
    .default([]),
  metadata:  z.record(z.unknown()).default({}),
  isActive:  z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export type UpsertCMSSectionInput = z.infer<typeof upsertCMSSectionSchema>;

// ─── Settings update ──────────────────────────────────────────────────────────
export const updateSettingSchema = z.object({
  value: z.unknown(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

// ─── Address ──────────────────────────────────────────────────────────────────
export const addressSchema = z.object({
  label:    z.string().max(40).default('Home'),
  fullName: z.string().min(2).max(80).trim(),
  phone:    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1:    z.string().min(5).max(200).trim(),
  line2:    z.string().max(200).trim().optional(),
  city:     z.string().min(2).max(80).trim(),
  state:    z.string().min(2).max(80).trim(),
  pincode:  z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  country:  z.string().default('IN'),
  isDefault:z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
