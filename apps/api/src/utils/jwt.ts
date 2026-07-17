import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '@stylehub/types';

// ─── Payload shapes ───────────────────────────────────────────────────────────
export interface AccessTokenPayload {
  userId: string;
  email:  string;
  role:   UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
}

// ─── Generate tokens ──────────────────────────────────────────────────────────
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as any,
  });
};

// ─── Verify tokens ────────────────────────────────────────────────────────────
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

// ─── Extract Bearer token from Authorization header ───────────────────────────
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
};

// ─── Cookie options for refresh token ────────────────────────────────────────
export const refreshTokenCookieOptions = {
  httpOnly: true,                          // Not accessible via JS
  secure:   env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,      // 7 days in ms
  path:     '/api/auth',                  // Only sent to auth routes
};
