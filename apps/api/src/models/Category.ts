import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDoc extends Document {
  name: string;
  slug: string;
  parent?: mongoose.Types.ObjectId;
  description?: string;
  image?: string;
  level: number;           // 0 = root (Clothing), 1 = sub (Men's), 2 = leaf (T-Shirts)
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;    // Denormalised count for display
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDoc>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    description:    { type: String, trim: true, maxlength: 500 },
    image:          { type: String },
    level:          { type: Number, default: 0, min: 0, max: 3 },
    isActive:       { type: Boolean, default: true },
    sortOrder:      { type: Number, default: 0 },
    seoTitle:       { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 160 },
    productCount:   { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    // When queried with populate, include children by adding virtuals
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Virtual: children categories ────────────────────────────────────────────
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// ─── Pre-save: auto-compute level based on parent ────────────────────────────
CategorySchema.pre('save', async function (next) {
  if (this.isModified('parent') && this.parent) {
    const parentDoc = await mongoose.model('Category').findById(this.parent).lean();
    if (parentDoc) {
      this.level = (parentDoc as any).level + 1;
    }
  } else if (!this.parent) {
    this.level = 0;
  }
  next();
});

// ─── Indexes (slug unique index auto-created from field definition) ──────────────────────
CategorySchema.index({ parent: 1, isActive: 1, sortOrder: 1 });
CategorySchema.index({ level: 1, isActive: 1 });

const Category = mongoose.model<ICategoryDoc>('Category', CategorySchema);
export default Category;
