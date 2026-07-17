import crypto from 'crypto';
import User, { IUserDoc } from '../models/User';
import Vendor from '../models/Vendor';
import { ApiError } from '../utils/ApiError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { UserRole } from '@stylehub/types';
import { logger } from '../utils/logger';
import type {
  RegisterInput,
  LoginInput,
  VendorRegisterInput,
  ResetPasswordInput,
} from '@stylehub/validators';

// ─── Helper: slugify store name ───────────────────────────────────────────────
const makeStoreSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

// ─── Issue token pair ─────────────────────────────────────────────────────────
const issueTokens = async (user: IUserDoc) => {
  const accessToken  = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
  const refreshToken = generateRefreshToken(user._id.toString());

  // Persist refresh token (hashed) for rotation validation
  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ─── Register customer ────────────────────────────────────────────────────────
export const registerCustomer = async (input: RegisterInput) => {
  const exists = await User.findOne({ email: input.email });
  if (exists) throw ApiError.conflict('An account with this email already exists.');

  const user = new User({
    name:         input.name,
    email:        input.email,
    passwordHash: input.password,  // Pre-save hook will hash this
    phone:        input.phone,
    role:         UserRole.Customer,
  });

  await user.save();
  logger.info(`New customer registered: ${user.email}`);
  return issueTokens(user);
};

// ─── Register vendor ──────────────────────────────────────────────────────────
export const registerVendor = async (input: VendorRegisterInput) => {
  const exists = await User.findOne({ email: input.email });
  if (exists) throw ApiError.conflict('An account with this email already exists.');

  // Check store slug uniqueness
  let storeSlug = makeStoreSlug(input.storeName);
  const slugExists = await Vendor.findOne({ storeSlug });
  if (slugExists) {
    storeSlug = `${storeSlug}-${Date.now().toString(36)}`;
  }

  // Create User
  const user = new User({
    name:         input.name,
    email:        input.email,
    passwordHash: input.password,
    role:         UserRole.Vendor,
  });
  await user.save();

  // Create Vendor profile (pending approval)
  await Vendor.create({
    user:             user._id,
    storeName:        input.storeName,
    storeSlug,
    storeDescription: input.storeDescription,
    status:           'pending',
  });

  logger.info(`New vendor registered: ${user.email} → store: ${storeSlug} (pending approval)`);
  return issueTokens(user);
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (input: LoginInput) => {
  // findByEmail is a static that selects +passwordHash +refreshToken
  const user = await User.findByEmail(input.email);

  if (!user) throw ApiError.unauthorized('Invalid email or password.');
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated.');

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password.');

  logger.info(`User logged in: ${user.email} [${user.role}]`);
  return issueTokens(user);
};

// ─── Refresh access token ─────────────────────────────────────────────────────
export const refreshAccessToken = async (incomingRefreshToken: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token. Please log in again.');
  }

  // Load user with refreshToken field
  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user) throw ApiError.unauthorized('User not found.');

  // Validate token rotation — compare hashes
  const hashedIncoming = crypto
    .createHash('sha256')
    .update(incomingRefreshToken)
    .digest('hex');

  if (user.refreshToken !== hashedIncoming) {
    // Possible token theft — invalidate all tokens
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
  }

  // Issue new token pair (rotation)
  return issueTokens(user);
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
};

// ─── Get current user ─────────────────────────────────────────────────────────
export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User');
  return user;
};

// ─── Forgot password ──────────────────────────────────────────────────────────
export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  // Always return success to prevent email enumeration attacks
  if (!user) return { message: 'If this email exists, a reset link has been sent.' };

  // Generate reset token (plain for email, hashed for DB)
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  // TODO: Send email via email service
  // await emailService.sendPasswordReset(user.email, resetToken);
  logger.info(`Password reset token generated for: ${user.email}`);

  return { resetToken }; // Return for dev — remove in prod, use email service
};

// ─── Reset password ───────────────────────────────────────────────────────────
export const resetPassword = async (rawToken: string, input: ResetPasswordInput) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordHash');

  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired.');

  user.passwordHash          = input.password; // Pre-save hook will hash
  user.passwordResetToken    = undefined;
  user.passwordResetExpires  = undefined;
  user.refreshToken          = undefined;       // Invalidate all active sessions
  await user.save();

  logger.info(`Password reset successful for: ${user.email}`);
};
