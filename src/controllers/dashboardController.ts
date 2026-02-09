import { Request, Response } from 'express';
import { dashboardService } from '../services';

export const dashboardController = {
  async getStats(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ detail: 'Not authenticated' });
        return;
      }
      const result = await dashboardService.getStats(req.user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
