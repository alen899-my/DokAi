import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

// Custom error class for app-level errors
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public errors?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Global error handler — must be last middleware in src/index.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${req.method} ${req.path} —`, err.message);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors:  err.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle our custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Unknown error — hide details in production
  const message = env.NODE_ENV === 'development'
    ? err.message
    : 'Internal server error';

  return res.status(500).json({
    success: false,
    message,
  });
}