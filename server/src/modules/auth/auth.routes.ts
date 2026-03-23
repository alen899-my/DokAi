import { Router } from 'express';
import passport from 'passport';
import { register, login, refreshToken, getMe } from './auth.controller';
import { googleCallback } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validator';

const router = Router();

// ── Email / Password ──

// POST /api/v1/auth/register
router.post('/register', authRateLimit, validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', authRateLimit, validate(loginSchema), login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

// GET /api/v1/auth/me
router.get('/me', requireAuth, getMe);

// ── Google OAuth ──

// Step 1 — redirect user to Google consent screen
// GET /api/v1/auth/google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Step 2 — Google redirects back here after user approves
// GET /api/v1/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session:         false,
    failureRedirect: '/api/v1/auth/google/failure',
  }),
  googleCallback
);

// Google auth failure
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google authentication failed',
  });
});

export default router;