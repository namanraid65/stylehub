import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  vendorRegisterSchema,
} from '@stylehub/validators';
import { z } from 'zod';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

/** POST /api/auth/register — Customer registration */
router.post(
  '/register',
  validate(registerSchema),
  authController.register,
);

/** POST /api/auth/vendor/register — Vendor registration */
router.post(
  '/vendor/register',
  validate(vendorRegisterSchema),
  authController.registerVendor,
);

/** POST /api/auth/login */
router.post(
  '/login',
  validate(loginSchema),
  authController.login,
);

/** POST /api/auth/refresh-token */
router.post('/refresh-token', authController.refreshToken);

/** POST /api/auth/forgot-password */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

/** POST /api/auth/reset-password/:token */
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// ─── Protected routes ─────────────────────────────────────────────────────────

/** GET /api/auth/me — Requires valid JWT */
router.get('/me', protect, authController.getMe);

/** PUT /api/auth/me — Update profile details */
router.put('/me', protect, authController.updateProfile);

/** POST /api/auth/logout — Requires valid JWT */
router.post('/logout', protect, authController.logout);

/** GET /api/auth/wishlist — Get wishlist product IDs */
router.get('/wishlist', protect, authController.getWishlist);

/** POST /api/auth/wishlist — Toggle item in wishlist */
router.post('/wishlist', protect, authController.toggleWishlist);

/** POST /api/auth/wishlist/sync — Batch sync client wishlist */
router.post('/wishlist/sync', protect, authController.syncWishlist);

export default router;
