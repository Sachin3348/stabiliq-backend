import { Request, Response, NextFunction } from 'express';
import logger from '../commonservice/logger';
import { AppError, MONGOOSE_DUPLICATE_KEY_CODE } from './AppError';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message);
  }

  // Mongoose duplicate key
  const mongoErr = err as Error & { code?: number };
  if (mongoErr.code === MONGOOSE_DUPLICATE_KEY_CODE) {
    return sendError(res, 400, 'User with this email already exists');
  }

  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;
  const message = err.message || 'Internal server error';
  return sendError(res, statusCode, message);
}
