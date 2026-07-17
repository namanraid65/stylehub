import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponseBuilder } from '../utils/ApiResponse';
import { refreshTokenCookieOptions } from '../utils/jwt';
import * as authService from '../services/auth.service';

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await authService.registerCustomer(req.body);

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
  res.status(201).json(
    ApiResponseBuilder.success('Account created successfully.', { accessToken }),
  );
});

// ─── POST /api/auth/vendor/register ──────────────────────────────────────────
export const registerVendor = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await authService.registerVendor(req.body);

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
  res.status(201).json(
    ApiResponseBuilder.success(
      'Vendor account created. Your store is pending admin approval.',
      { accessToken },
    ),
  );
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await authService.login(req.body);

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
  res.status(200).json(
    ApiResponseBuilder.success('Logged in successfully.', { accessToken }),
  );
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?._id) {
    await authService.logout(req.user._id);
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json(ApiResponseBuilder.success('Logged out successfully.'));
});

// ─── POST /api/auth/refresh-token ─────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // Accept refresh token from HttpOnly cookie OR body (mobile clients)
  const incomingToken: string =
    req.cookies?.refreshToken ?? req.body?.refreshToken ?? '';

  if (!incomingToken) {
    res.status(401).json(ApiResponseBuilder.error('No refresh token provided.'));
    return;
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(incomingToken);

  res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);
  res.status(200).json(
    ApiResponseBuilder.success('Token refreshed.', { accessToken }),
  );
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!._id);
  res.status(200).json(ApiResponseBuilder.success('Profile fetched.', user));
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json(ApiResponseBuilder.success(result.message ?? 'Reset email sent.', result));
});

// ─── POST /api/auth/reset-password/:token ────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.params['token']!, req.body);
  // Clear any existing sessions
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json(ApiResponseBuilder.success('Password reset successfully. Please log in.'));
});

// ─── PUT /api/auth/me ─────────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number').optional(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password is too weak').optional(),
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user!._id;
  
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, errors: parsed.error.flatten() });
    return;
  }

  const { name, email, phone, password } = parsed.data;
  
  const user = await User.findById(customerId);
  if (!user) {
    res.status(404).json(ApiResponseBuilder.error('User not found.'));
    return;
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      res.status(409).json(ApiResponseBuilder.error('Email is already taken.'));
      return;
    }
    user.email = email.toLowerCase();
  }

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (password) user.passwordHash = password; // Pre-save hook will hash

  await user.save();

  res.status(200).json(ApiResponseBuilder.success('Profile updated successfully.', user));
});
