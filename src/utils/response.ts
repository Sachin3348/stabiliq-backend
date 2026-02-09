import { Response } from 'express';

/** Send error response (preserves existing API shape: { detail } only) */
export function sendError(res: Response, statusCode: number, detail: string): Response {
  return res.status(statusCode).json({ detail });
}

/** Send success JSON (no wrapper; same as res.json() for consistency) */
export function sendSuccess<T>(res: Response, statusCode: number, data: T): Response {
  return res.status(statusCode).json(data);
}
