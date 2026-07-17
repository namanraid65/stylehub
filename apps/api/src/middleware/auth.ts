import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { extractBearerToken, verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '@stylehub/types';

// ─── protect ──────────────────────────────────────────────────────────────────
// Verifies JWT access token, loads user from DB, attaches to req.user.
// Use on any route that requires authentication.

export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  // 1. Extract token
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw ApiError.unauthorized('No token provided. Please log in.');
  }

  // 2. Verify signature + expiry
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token. Please log in again.');
  }

  // 3. Load user from DB (verifies they still exist and are active)
  const user = await User.findById(payload.userId).select('-passwordHash -refreshToken');
  if (!user) {
    throw ApiError.unauthorized('The account associated with this token no longer exists.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  // 4. Attach to request
  req.user = {
    _id:        user._id.toString(),
    name:       user.name,
    email:      user.email,
    role:       user.role as UserRole,
    avatar:     user.avatar,
    phone:      user.phone,
    isVerified: user.isVerified,
    isActive:   user.isActive,
    createdAt:  user.createdAt.toISOString(),
    updatedAt:  user.updatedAt.toISOString(),
  };

  next();
});

// ─── authorize ────────────────────────────────────────────────────────────────
// Role-based access control. Must be used AFTER protect middleware.
// Usage: router.delete('/users/:id', protect, authorize('admin'), handler)
//        router.post('/products',    protect, authorize('vendor', 'admin'), handler)

export const authorize = (...roles: (UserRole | string)[]) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.');
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not allowed to perform this action. Required: ${roles.join(' or ')}.`,
      );
    }

    next();
  });

// ─── optionalAuth ─────────────────────────────────────────────────────────────
// Attaches user to req if valid token present, but does NOT throw if missing.
// Use for routes that behave differently for authenticated vs guest users.

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) return next();

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId).select('-passwordHash -refreshToken');
      if (user && user.isActive) {
        req.user = {
          _id:        user._id.toString(),
          name:       user.name,
          email:      user.email,
          role:       user.role as UserRole,
          avatar:     user.avatar,
          phone:      user.phone,
          isVerified: user.isVerified,
          isActive:   user.isActive,
          createdAt:  user.createdAt.toISOString(),
          updatedAt:  user.updatedAt.toISOString(),
        };
      }
    } catch {
      // Silently ignore invalid token for optional routes
    }

    next();
  },
);
