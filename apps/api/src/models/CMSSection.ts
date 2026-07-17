import mongoose, { Schema, Document } from 'mongoose';

// ─── CMS Section types ────────────────────────────────────────────────────────
// Each section has a unique `key` that frontend uses to fetch the right block.
// Examples: 'homepage_hero', 'homepage_featured_banner', 'about_us', 'footer_links'

export type CMSSectionType =
  | 'hero'
  | 'banner'
  | 'carousel'
  | 'grid'
  | 'text'
  | 'faq'
  | 'testimonial'
  | 'newsletter'
  | 'custom';

export interface ICTAButton {
  label: string;
  url:   string;
  style: 'primary' | 'secondary' | 'outline';
}

export interface ICMSSectionDoc extends Document {
  key:          string;         // Unique identifier e.g. 'homepage_hero'
  type:         CMSSectionType;
  title:        string;
  subtitle?:    string;
  description?: string;
  images:       string[];
  ctaButtons:   ICTAButton[];
  // Flexible JSON for section-specific data (e.g., FAQ items, grid columns)
  metadata:     Record<string, unknown>;
  isActive:     boolean;
  sortOrder:    number;
  updatedBy?:   mongoose.Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

const CTAButtonSchema = new Schema<ICTAButton>(
  {
    label: { type: String, required: true },
    url:   { type: String, required: true },
    style: { type: String, enum: ['primary', 'secondary', 'outline'], default: 'primary' },
  },
  { _id: false },
);

const CMSSectionSchema = new Schema<ICMSSectionDoc>(
  {
    key: {
      type: String,
      required: [true, 'Section key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'],
    },
    type: {
      type: String,
      enum: ['hero', 'banner', 'carousel', 'grid', 'text', 'faq', 'testimonial', 'newsletter', 'custom'],
      default: 'custom',
    },
    title:       { type: String, required: true, trim: true },
    subtitle:    { type: String, trim: true },
    description: { type: String, trim: true },
    images:      { type: [String], default: [] },
    ctaButtons:  { type: [CTAButtonSchema], default: [] },
    metadata:    { type: Schema.Types.Mixed, default: {} },
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
    updatedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
CMSSectionSchema.index({ key: 1 }, { unique: true });
CMSSectionSchema.index({ isActive: 1, sortOrder: 1 });
CMSSectionSchema.index({ type: 1, isActive: 1 });

const CMSSection = mongoose.model<ICMSSectionDoc>('CMSSection', CMSSectionSchema);
export default CMSSection;
