import { Request, Response } from 'express';
import { profileService } from '../services';
import { sendError, sendSuccess } from '../utils/response';

export const profileController = {
  uploadResume(req: Request, res: Response, next: (err: unknown) => void): void {
    try {
      if (!req.file) {
        sendError(res, 400, 'No file uploaded');
        return;
      }
      if (!req.user) {
        sendError(res, 401, 'Not authenticated');
        return;
      }
      const result = profileService.getUploadResult(req.user.id, req.file.originalname);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  async analyze(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Not authenticated');
        return;
      }
      const { resumeUrl, linkedinUrl } = req.body as { resumeUrl?: string; linkedinUrl?: string };
      if (!resumeUrl && !linkedinUrl) {
        sendError(res, 400, 'At least one of resume or LinkedIn URL is required');
        return;
      }
      const result = profileService.analyze(req.user, resumeUrl, linkedinUrl);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
};
