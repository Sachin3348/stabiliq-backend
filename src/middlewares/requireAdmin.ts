import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.user as any;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: admin access required' });
    return;
  }
  next();
}
