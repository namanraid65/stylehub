import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewDoc extends Document {
  product:     mongoose.Types.ObjectId;
  customer:    mongoose.Types.ObjectId;
  vendor:      mongoose.Types.ObjectId;
  order:       mongoose.Types.ObjectId;  // For verified purchase check
  rating:      number;                   // 1–5
  title:       string;
  body:        string;
  images:      string[];
  // Moderation
  isVerified:  boolean;    // True if order ref is confirmed delivered
  isApproved:  boolean;    // Admin can approve/reject
  adminNote?:  string;
  // Helpfulness voting
  helpfulVotes:    number;
  notHelpfulVotes: number;
  helpfulVotedBy:  mongoose.Types.ObjectId[];
  createdAt:   Date;
  updatedAt:   Date;
}

const ReviewSchema = new Schema<IReviewDoc>(
  {
    product:  { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User',    required: true },
    vendor:   { type: Schema.Types.ObjectId, ref: 'Vendor',  required: true },
    order:    { type: Schema.Types.ObjectId, ref: 'Order',   required: true },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: 150,
    },
    body: {
      type: String,
      required: [true, 'Review body is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: 2000,
    },
    images: { type: [String], default: [] },

    isVerified:  { type: Boolean, default: false },
    isApproved:  { type: Boolean, default: false },
    adminNote:   { type: String },

    helpfulVotes:    { type: Number, default: 0, min: 0 },
    notHelpfulVotes: { type: Number, default: 0, min: 0 },
    helpfulVotedBy:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

// ─── Compound unique index: one review per customer per order item ────────────
ReviewSchema.index({ product: 1, customer: 1, order: 1 }, { unique: true });
ReviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ vendor: 1, rating: -1 });
ReviewSchema.index({ customer: 1 });

// ─── Post-save: update product's avgRating and reviewCount ───────────────────
ReviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count:     { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      avgRating:   Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

const Review = mongoose.model<IReviewDoc>('Review', ReviewSchema);
export default Review;
