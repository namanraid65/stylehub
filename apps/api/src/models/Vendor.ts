import mongoose, { Schema, Document } from 'mongoose';
import { VendorStatus } from '@stylehub/types';

// ─── Bank details sub-document ────────────────────────────────────────────────
interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

// ─── Vendor document interface ────────────────────────────────────────────────
export interface IVendorDoc extends Document {
  user: mongoose.Types.ObjectId;
  // ── Store info (embedded — no separate Store collection needed) ───────────
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  storeTags: string[];
  storeLocation?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  // ── Business details ──────────────────────────────────────────────────────
  businessName: string;
  gstNumber?: string;
  panNumber?: string;
  businessAddress?: string;
  bankDetails?: IBankDetails;
  // ── Platform management ───────────────────────────────────────────────────
  status: VendorStatus;
  commissionRate: number;       // Percentage (e.g. 12 = 12%)
  stripeAccountId?: string;
  // ── Computed totals (updated via order hooks) ─────────────────────────────
  totalEarnings: number;
  totalPaid: number;
  totalOrders: number;
  storeRating: number;          // Denormalised avg from reviews
  totalReviews: number;
  // ── Documents for verification ────────────────────────────────────────────
  verificationDocs: string[];   // Cloudinary URLs
  rejectionReason?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const VendorSchema = new Schema<IVendorDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Store info
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      minlength: [3, 'Store name must be at least 3 characters'],
    },
    storeSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    storeDescription: { type: String, trim: true, maxlength: 1000 },
    storeLogo:        { type: String },
    storeBanner:      { type: String },
    storeTags:        { type: [String], default: [] },
    storeLocation:    { type: String, trim: true },
    socialLinks: {
      instagram: { type: String, trim: true },
      facebook:  { type: String, trim: true },
      website:   { type: String, trim: true },
    },

    // Business details
    businessName:    { type: String, trim: true },
    gstNumber:       { type: String, trim: true, uppercase: true },
    panNumber:       { type: String, trim: true, uppercase: true },
    businessAddress: { type: String, trim: true },
    bankDetails: {
      accountHolderName: { type: String, select: false },
      accountNumber:     { type: String, select: false },
      ifscCode:          { type: String, select: false },
      bankName:          { type: String, select: false },
    },

    // Platform management
    status: {
      type: String,
      enum: Object.values(VendorStatus),
      default: VendorStatus.Pending,
    },
    commissionRate:  { type: Number, default: 10, min: 0, max: 100 },
    stripeAccountId: { type: String, select: false },

    // Computed totals
    totalEarnings: { type: Number, default: 0, min: 0 },
    totalPaid:     { type: Number, default: 0, min: 0 },
    totalOrders:   { type: Number, default: 0, min: 0 },
    storeRating:   { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:  { type: Number, default: 0, min: 0 },

    // Verification
    verificationDocs: { type: [String], default: [] },
    rejectionReason:  { type: String },
    approvedAt:       { type: Date },
  },
  { timestamps: true },
);

// ─── Indexes (user & storeSlug indexed automatically via unique:true on fields) ──────────────
VendorSchema.index({ status: 1 });
VendorSchema.index({ storeRating: -1 });

const Vendor = mongoose.model<IVendorDoc>('Vendor', VendorSchema);
export default Vendor;
