import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Validates req.body against a Zod schema
// Usage: router.post('/register', validate(registerSchema), controller)
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and replace req.body with validated + typed data
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err); // passes ZodError to errorHandler middleware
    }
  };
}