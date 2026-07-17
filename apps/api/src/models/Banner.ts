import mongoose, { Schema, Document } from 'mongoose';

export type BannerPlacement = 'homepage_hero' | 'homepage_mid' | 'category_top' | 'product_top' | 'sidebar';

export interface IBannerDoc extends Document {
  title:       string;
  subtitle?:   string;
  imageUrl:    string;
  mobileImageUrl?: string;
  linkUrl?:    string;
  linkLabel?:  string;
  placement:   BannerPlacement;
  order:       number;
  isActive:    boolean;
  startsAt?:   Date;
  endsAt?:     Date;
  bgColor?:    string;
  textColor?:  string;
  createdAt:   Date;
  updatedAt:   Date;
}

const BannerSchema = new Schema<IBannerDoc>(
  {
    title:          { type: String, required: true, trim: true },
    subtitle:       { type: String, trim: true },
    imageUrl:       { type: String, required: true },
    mobileImageUrl: { type: String },
    linkUrl:        { type: String },
    linkLabel:      { type: String, default: 'Shop Now' },
    placement:      {
      type: String,
      enum: ['homepage_hero','homepage_mid','category_top','product_top','sidebar'],
      default: 'homepage_hero',
    },
    order:     { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
    startsAt:  { type: Date },
    endsAt:    { type: Date },
    bgColor:   { type: String },
    textColor: { type: String },
  },
  { timestamps: true },
);

BannerSchema.index({ placement: 1, isActive: 1, order: 1 });

const Banner = mongoose.model<IBannerDoc>('Banner', BannerSchema);
export default Banner;
