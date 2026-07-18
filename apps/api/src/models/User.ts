import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@stylehub/types';
import { env } from '../config/env';

// ─── Address sub-document ─────────────────────────────────────────────────────
export interface IAddressDoc {
  _id: mongoose.Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<IAddressDoc>(
  {
    label:     { type: String, default: 'Home', trim: true },
    fullName:  { type: String, required: true, trim: true },
    phone:     { type: String, required: true, trim: true },
    line1:     { type: String, required: true, trim: true },
    line2:     { type: String, trim: true },
    city:      { type: String, required: true, trim: true },
    state:     { type: String, required: true, trim: true },
    pincode:   { type: String, required: true, trim: true },
    country:   { type: String, default: 'IN', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

// ─── User document interface ──────────────────────────────────────────────────
export interface IUserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  addresses: IAddressDoc[];
  followedVendors: mongoose.Types.ObjectId[];
  wishlist: mongoose.Types.ObjectId[];
  refreshToken?: string | undefined;
  emailVerificationToken?: string | undefined;
  emailVerificationExpires?: Date | undefined;
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidate: string): Promise<boolean>;
  setDefaultAddress(addressId: string): void;
}

// ─── User static methods interface ───────────────────────────────────────────
export interface IUserModel extends Model<IUserDoc> {
  findByEmail(email: string): Promise<IUserDoc | null>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUserDoc, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.Customer,
    },
    avatar:  { type: String, trim: true },
    phone:   { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    addresses:  { type: [AddressSchema], default: [] },
    followedVendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor', default: [] }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product', default: [] }],

    // Token fields — select: false so never leaked in normal queries
    refreshToken:              { type: String, select: false },
    emailVerificationToken:    { type: String, select: false },
    emailVerificationExpires:  { type: Date,   select: false },
    passwordResetToken:        { type: String, select: false },
    passwordResetExpires:      { type: Date,   select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const r = ret as any;
        delete r.passwordHash;
        delete r.refreshToken;
        delete r.emailVerificationToken;
        delete r.passwordResetToken;
        return r;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: email unique index is created automatically from field definition above.
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// ─── Pre-save hook: hash password when modified ───────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, env.BCRYPT_SALT_ROUNDS);
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.methods.setDefaultAddress = function (addressId: string): void {
  this.addresses.forEach((addr: IAddressDoc) => {
    addr.isDefault = addr._id.toString() === addressId;
  });
};

// ─── Static methods ───────────────────────────────────────────────────────────
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +refreshToken');
};

const User = mongoose.model<IUserDoc, IUserModel>('User', UserSchema);
export default User;
