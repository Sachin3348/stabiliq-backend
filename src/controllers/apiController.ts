import { Request, Response } from 'express';
import { statusCheckService } from '../services';
import { sendError, sendSuccess } from '../utils/response';

export const apiController = {
  root(_req: Request, res: Response): Response {
    return sendSuccess(res, 200, { message: 'STABILIQ API - Member Dashboard' });
  },

  async createStatus(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { client_name } = req.body as { client_name?: string };
      if (!client_name) {
        sendError(res, 400, 'client_name is required');
        return;
      }
      const result = await statusCheckService.create(client_name);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async listStatus(_req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const list = await statusCheckService.list();
      sendSuccess(res, 200, list);
    } catch (err) {
      next(err);
    }
  },
};
