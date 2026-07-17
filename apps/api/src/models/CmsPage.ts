import mongoose, { Schema, Document } from 'mongoose';

// ─── Block types that make up a CMS page ──────────────────────────────────────
export type BlockType =
  | 'hero'
  | 'rich_text'
  | 'image'
  | 'image_grid'
  | 'featured_products'
  | 'banner_strip'
  | 'testimonials'
  | 'faq'
  | 'contact_form'
  | 'spacer'
  | 'divider'
  | 'cta';

export interface CmsBlock {
  id:        string;
  type:      BlockType;
  order:     number;
  isActive:  boolean;
  data:      Record<string, unknown>; // flexible payload per block type
}

export type PageSlug =
  | 'homepage'
  | 'about'
  | 'contact'
  | 'returns'
  | 'privacy-policy'
  | 'terms-of-service'
  | 'shipping-policy'
  | string; // custom pages

export interface ICmsPageDoc extends Document {
  slug:        PageSlug;
  title:       string;
  description: string;
  seoTitle?:   string;
  seoDesc?:    string;
  blocks:      CmsBlock[];
  isPublished: boolean;
  updatedBy?:  mongoose.Types.ObjectId;
  createdAt:   Date;
  updatedAt:   Date;
}

const CmsBlockSchema = new Schema<CmsBlock>(
  {
    id:       { type: String, required: true },
    type:     { type: String, required: true },
    order:    { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    data:     { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const CmsPageSchema = new Schema<ICmsPageDoc>(
  {
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    seoTitle:    { type: String },
    seoDesc:     { type: String },
    blocks:      { type: [CmsBlockSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    updatedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

CmsPageSchema.index({ slug: 1 });

const CmsPage = mongoose.model<ICmsPageDoc>('CmsPage', CmsPageSchema);
export default CmsPage;
