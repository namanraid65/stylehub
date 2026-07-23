import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscount extends Document {
  title: string;
  code?: string;
  scope: 'all' | 'category' | 'products';
  category?: string;
  products?: mongoose.Types.ObjectId[];
  vendor?: mongoose.Types.ObjectId; // If set, created by specific vendor for their store
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  badgeText: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, uppercase: true, trim: true },
    scope: { type: String, enum: ['all', 'category', 'products'], default: 'all' },
    category: { type: String, default: '' },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    badgeText: { type: String, default: 'SPECIAL SALE' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
DiscountSchema.index({ vendor: 1 });
DiscountSchema.index({ category: 1 });

export const Discount = mongoose.model<IDiscount>('Discount', DiscountSchema);
