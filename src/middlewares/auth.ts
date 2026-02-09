import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';
import type { JwtPayload } from '../types/auth';

export function createAccessToken(data: JwtPayload): string {
  const options: jwt.SignOptions = { expiresIn: `${env.JWT_EXPIRE_DAYS}d` };
  return jwt.sign({ sub: data.sub, id: data.id }, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.id !== 'string') {
      throw new AppError('Invalid token', 401);
    }
    return { sub: payload.sub, id: payload.id };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
}

export function getCurrentUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'Not authenticated' });
      return;
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 401;
    const message = error instanceof Error ? error.message : 'Not authenticated';
    res.status(statusCode).json({ detail: message });
  }
}
