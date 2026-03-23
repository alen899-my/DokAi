import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { sendUnauthorized } from '../lib/response';

// Protects private routes — verifies JWT and attaches req.user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Authorization token required');
    }

    // Extract token — remove "Bearer " prefix
    const token = authHeader.slice(7);

    if (!token) {
      return sendUnauthorized(res, 'Token is empty');
    }

    // Verify token — throws if invalid or expired
    const payload = verifyAccessToken(token);

    // Attach decoded user to request object
    req.user = payload;

    next();
  } catch (err) {
    next(err); // passes JWT errors to errorHandler
  }
}