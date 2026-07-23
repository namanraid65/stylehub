import mongoose, { Schema, Document } from 'mongoose';
import { Gender, ProductStatus, SizeCategory } from '@stylehub/types';

// ─── Variant sub-document ─────────────────────────────────────────────────────
export interface IVariantDoc {
  _id: mongoose.Types.ObjectId;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  price?: number;           // Overrides basePrice if set
  compareAtPrice?: number;
  stock: number;
  minStockThreshold?: number;
  images: string[];
  weight?: number;          // grams
  barcode?: string;
  sizeCategory: SizeCategory;
  isActive: boolean;
}

const VariantSchema = new Schema<IVariantDoc>(
  {
    size:          { type: String, required: [true, 'Size is required'], trim: true },
    color:         { type: String, required: [true, 'Color is required'], trim: true },
    colorHex:      {
      type: String,
      required: [true, 'Color hex is required'],
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color hex must be a valid 6-digit hex code'],
    },
    sku:           { type: String, required: [true, 'Variant SKU is required'], trim: true },
    price:         { type: Number, min: 0 },
    compareAtPrice:{ type: Number, min: 0 },
    stock:         { type: Number, required: true, min: 0, default: 0 },
    minStockThreshold: { type: Number, default: 5, min: 0 },
    images:        { type: [String], default: [] },
    weight:        { type: Number, min: 0 },
    barcode:       { type: String, trim: true },
    sizeCategory:  {
      type: String,
      enum: Object.values(SizeCategory),
      default: SizeCategory.Clothing,
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

// ─── Product document interface ───────────────────────────────────────────────
export interface IProductDoc extends Document {
  vendor: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  tags: string[];
  images: string[];
  gender: Gender;
  material?: string;
  careInstructions?: string;
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  variants: IVariantDoc[];
  totalStock: number;
  minStockThreshold?: number;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  status: ProductStatus;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  // Virtual
  discountPercent: number;
  isInStock: boolean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const ProductSchema = new Schema<IProductDoc>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 10000,
    },
    brand:       { type: String, required: true, trim: true },
    sku:         { type: String, required: true, trim: true },
    tags:        { type: [String], default: [] },
    images:      { type: [String], default: [] },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: [true, 'Gender target is required'],
    },
    material:         { type: String, trim: true },
    careInstructions: { type: String, trim: true },
    basePrice: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: { type: Number, min: 0 },
    currency:       { type: String, default: 'INR' },

    // ── Variants array ───────────────────────────────────────────────────────
    variants: { type: [VariantSchema], default: [] },

    // ── Denormalised aggregates (updated by hooks) ───────────────────────────
    totalStock:        { type: Number, default: 0, min: 0 },
    minStockThreshold: { type: Number, default: 5, min: 0 },
    soldCount:         { type: Number, default: 0, min: 0 },
    avgRating:         { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:       { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.Draft,
    },
    isFeatured:     { type: Boolean, default: false },
    seoTitle:       { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 160 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
ProductSchema.virtual('discountPercent').get(function (this: IProductDoc) {
  if (!this.compareAtPrice || this.compareAtPrice <= this.basePrice) return 0;
  return Math.round(((this.compareAtPrice - this.basePrice) / this.compareAtPrice) * 100);
});

ProductSchema.virtual('isInStock').get(function (this: IProductDoc) {
  return this.totalStock > 0;
});

// ─── Pre-save: sync totalStock from variants ──────────────────────────────────
ProductSchema.pre('save', function (this: IProductDoc, next) {
  if (this.isModified('variants')) {
    this.totalStock = (this.variants || []).reduce(
      (sum: number, v: IVariantDoc) => sum + (v.isActive ? v.stock : 0),
      0,
    );
  }
  next();
});

// ─── Indexes (slug auto-indexed from field unique:true) ───────────────────────────────
ProductSchema.index({ vendor: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, isFeatured: 1 });
ProductSchema.index({ tags: 1, gender: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ avgRating: -1, reviewCount: -1 });
ProductSchema.index(
  { name: 'text', brand: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, brand: 6, tags: 4, description: 1 }, name: 'product_text_search' },
);

const Product = mongoose.model<IProductDoc>('Product', ProductSchema);
export default Product;
