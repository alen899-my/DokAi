import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { CONSTANTS } from '../config/constants';

export interface JWTPayload {
  userId: string;
  email:  string;
  plan:   'free' | 'pro';
}

// Sign access token — short lived (15 minutes)
export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
  });
}

// Sign refresh token — long lived (7 days)
export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.REFRESH_SECRET, {
    expiresIn: CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
  });
}

// Verify access token — throws if invalid or expired
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}

// Verify refresh token — throws if invalid or expired
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, env.REFRESH_SECRET) as JWTPayload;
}