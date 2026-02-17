import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { sendError, sendSuccess } from '../utils/response';

export const paymentController = {
  async create(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const body = req.body as Parameters<typeof paymentService.create>[0];
      const result = await paymentService.create(body);
      sendSuccess(res, 201, result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { id } = req.params;
      const result = await paymentService.getById(id);
      if (!result) {
        sendError(res, 404, 'Transaction not found');
        return;
      }
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async getByMerchantTransactionId(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { merchantTransactionId } = req.params;
      const result = await paymentService.getByMerchantTransactionId(merchantTransactionId);
      if (!result) {
        sendError(res, 404, 'Transaction not found');
        return;
      }
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async getMyTransactions(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Not authenticated');
        return;
      }
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const result = await paymentService.getMyTransactions(req.user, limit);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as Record<string, unknown>;
      const result = await paymentService.updateTransaction(id, body);
      if (!result) {
        sendError(res, 404, 'Transaction not found');
        return;
      }
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
};
