import { z } from 'zod';
import { Gender, ProductStatus, SizeCategory } from '@stylehub/types';

// ─── Variant ──────────────────────────────────────────────────────────────────
export const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color name is required'),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex must be a valid 6-digit hex code (e.g. #FF5733)'),
  sku: z.string().min(1, 'Variant SKU is required'),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  minStockThreshold: z.number().int().min(0).optional().default(5),
  images: z.array(z.string()).optional().default([]),
  weight: z.number().positive().optional(),
  barcode: z.string().optional(),
  sizeCategory: z.nativeEnum(SizeCategory),
});

export type VariantInput = z.infer<typeof variantSchema>;

// ─── Product ──────────────────────────────────────────────────────────────────
export const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required').max(80),
  sku: z.string().min(1, 'Base SKU is required'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags').default([]),
  images: z.array(z.string()).min(1, 'At least one product image is required'),
  gender: z.nativeEnum(Gender),
  material: z.string().max(200).optional(),
  careInstructions: z.string().max(500).optional(),
  basePrice: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().default('INR'),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  minStockThreshold: z.number().int().min(0).optional().default(5),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.Draft),
  isFeatured: z.boolean().default(false),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─── Stock Update ─────────────────────────────────────────────────────────────
export const updateStockSchema = z.object({
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
