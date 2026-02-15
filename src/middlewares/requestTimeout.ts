import { Request, Response, NextFunction } from 'express';

const DEFAULT_MS = 25000; // 25 seconds

/**
 * Sends 504 if the request doesn't complete within ms. Use on routes that may hang (e.g. DB + email).
 */
export function requestTimeout(ms: number = DEFAULT_MS) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    let responded = false;
    const timer = setTimeout(() => {
      if (responded) return;
      responded = true;
      res.status(504).json({ detail: 'Request timeout' });
    }, ms);
    res.on('finish', () => {
      responded = true;
      clearTimeout(timer);
    });
    res.on('close', () => {
      responded = true;
      clearTimeout(timer);
    });
    next();
  };
}
