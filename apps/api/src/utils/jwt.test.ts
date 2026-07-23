import { describe, it, expect } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, extractBearerToken } from './jwt';
import { UserRole } from '@stylehub/types';

describe('jwt utils', () => {
  const mockPayload = {
    userId: '60c72b2f9b1d8b2d1c999999',
    email: 'user@example.com',
    role: UserRole.Customer,
  };

  it('should generate valid access and refresh tokens', () => {
    const accessToken = generateAccessToken(mockPayload);
    const refreshToken = generateRefreshToken(mockPayload.userId);
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });

  it('should verify generated access token correctly', () => {
    const accessToken = generateAccessToken(mockPayload);
    const verified = verifyAccessToken(accessToken);
    expect(verified.userId).toBe(mockPayload.userId);
    expect(verified.email).toBe(mockPayload.email);
    expect(verified.role).toBe(mockPayload.role);
  });

  it('should verify generated refresh token correctly', () => {
    const refreshToken = generateRefreshToken(mockPayload.userId);
    const verified = verifyRefreshToken(refreshToken);
    expect(verified.userId).toBe(mockPayload.userId);
  });

  it('should extract bearer token from authorization header', () => {
    const header = 'Bearer test.jwt.token';
    const extracted = extractBearerToken(header);
    expect(extracted).toBe('test.jwt.token');
  });

  it('should return null for invalid or missing authorization headers', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Basic xyz')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
  });
});
