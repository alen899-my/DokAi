import rateLimit from 'express-rate-limit';
import { CONSTANTS } from '../config/constants';

// Rate limiter for auth routes — prevents brute force attacks
export const authRateLimit = rateLimit({
  windowMs: CONSTANTS.AUTH_RATE_LIMIT_WINDOW_MS, // 15 minutes
  max:      CONSTANTS.AUTH_RATE_LIMIT_MAX,        // 10 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
  },
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders:   false, // Disable X-RateLimit-* headers
});