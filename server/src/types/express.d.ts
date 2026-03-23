import { JWTPayload } from '../lib/jwt';

// Extend Express Request globally so req.user is available
// in every route after auth middleware runs
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};