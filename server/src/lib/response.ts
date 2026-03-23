import { Response } from 'express';

// Standard success response
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

// Standard error response
export function sendError(
  res: Response,
  message: string = 'Something went wrong',
  statusCode: number = 500,
  errors?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

// 201 Created shortcut
export function sendCreated<T>(res: Response, data: T, message: string = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

// 401 Unauthorized shortcut
export function sendUnauthorized(res: Response, message: string = 'Unauthorized') {
  return sendError(res, message, 401);
}

// 400 Bad Request shortcut
export function sendBadRequest(res: Response, message: string = 'Bad request', errors?: unknown) {
  return sendError(res, message, 400, errors);
}

// 404 Not Found shortcut
export function sendNotFound(res: Response, message: string = 'Not found') {
  return sendError(res, message, 404);
}

// 409 Conflict shortcut
export function sendConflict(res: Response, message: string = 'Conflict') {
  return sendError(res, message, 409);
}