import { Request, Response, NextFunction } from 'express';
import { leadService } from '../services/leadService';
import { sendSuccess, sendError } from '../utils/response';

export const leadController = {
  async capture(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = {
        ipAddress: (req.ip ?? req.socket.remoteAddress) ?? undefined,
        userAgent: req.headers['user-agent'] ?? undefined,
      };
      const { lead, isNew } = await leadService.captureLead(req.body, meta);
      sendSuccess(res, isNew ? 201 : 200, { success: true, lead });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await leadService.listLeads({
        stage:          req.query.stage as any,
        source:         req.query.source as string | undefined,
        sourceCategory: req.query.sourceCategory as any,
        assignedTo:     req.query.assignedTo as string | undefined,
        search:         req.query.search as string | undefined,
        page:           req.query.page  ? parseInt(req.query.page  as string, 10) : undefined,
        limit:          req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.getLead(req.params.leadId);
      sendSuccess(res, 200, { lead });
    } catch (err) {
      next(err);
    }
  },

  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id.toString();
      const lead = await leadService.updateStage(req.params.leadId, req.body, adminId);
      sendSuccess(res, 200, { lead });
    } catch (err) {
      next(err);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user!.id.toString();
      const { adminUserId } = req.body;
      if (!adminUserId?.trim()) {
        sendError(res, 400, 'adminUserId is required');
        return;
      }
      const lead = await leadService.assignLead(req.params.leadId, adminUserId, actingAdminId);
      sendSuccess(res, 200, { lead });
    } catch (err) {
      next(err);
    }
  },

  async logCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id.toString();
      const { note } = req.body;
      if (!note?.trim()) {
        sendError(res, 400, 'note is required');
        return;
      }
      const lead = await leadService.logCall(req.params.leadId, note, adminId);
      sendSuccess(res, 200, { lead });
    } catch (err) {
      next(err);
    }
  },

  async convert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id.toString();
      const { userId } = req.body;
      if (!userId?.trim()) {
        sendError(res, 400, 'userId is required');
        return;
      }
      const lead = await leadService.convertLead(req.params.leadId, userId, adminId);
      sendSuccess(res, 200, { lead });
    } catch (err) {
      next(err);
    }
  },
};
