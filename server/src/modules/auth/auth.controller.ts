import { Request, Response, NextFunction } from 'express';
import { registerService, loginService, refreshTokenService } from './auth.service';
import { sendSuccess, sendCreated } from '../../lib/response';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { env } from '../../config/env';
import { SafeUser } from '../../models/user/user.types';

// POST /api/v1/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerService(req.body);
    return sendCreated(res, result, 'Account created successfully');
  } catch (err) { next(err); }
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginService(req.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (err) { next(err); }
}

// POST /api/v1/auth/refresh
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await refreshTokenService(req.body);
    return sendSuccess(res, { tokens }, 'Tokens refreshed successfully');
  } catch (err) { next(err); }
}

// GET /api/v1/auth/me
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, { user: req.user }, 'User fetched successfully');
  } catch (err) { next(err); }
}

// GET /api/v1/auth/google/callback
// Called by passport after Google authentication succeeds
export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as SafeUser;

    // Sign our own JWT tokens
    const payload = { userId: user.id, email: user.email, plan: user.plan };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Redirect to frontend with tokens as query params
    // Frontend reads them from URL and stores in memory/localStorage
    const redirectUrl = `${env.FRONTEND_CALLBACK_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`;

    return res.redirect(redirectUrl);
  } catch (err) { next(err); }
}