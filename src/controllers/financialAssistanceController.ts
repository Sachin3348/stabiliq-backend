import { Request, Response } from 'express';
import { financialAssistanceService } from '../services';
import { sendSuccess } from '../utils/response';

export const financialAssistanceController = {
  async getStatus(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const result = await financialAssistanceService.getStatus(req.user!);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async submitRequest(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const result = await financialAssistanceService.submitRequest(req.user!);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  getDocumentsRequired(_req: Request, res: Response): Response {
    const result = financialAssistanceService.getDocumentsRequired();
    return sendSuccess(res, 200, result);
  },
};
