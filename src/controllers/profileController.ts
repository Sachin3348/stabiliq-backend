import { Request, Response } from 'express';
import { profileService } from '../services';
import { sendError, sendSuccess } from '../utils/response';
import { storageProvider } from '../storage';
import { parseResumeViaPython, optimizeExperience } from '../services/resumeParserService';
import { profileSubmissionRepository } from '../repository/profileSubmissionRepository';

export const profileController = {
  async uploadResume(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 400, 'No file uploaded');
        return;
      }
      if (!req.user) {
        sendError(res, 401, 'Not authenticated');
        return;
      }

      const userId = req.user.id.toString();
      const key = `resumes/users/${userId}/${Date.now()}_${req.file.originalname}`;

      const { jobDescription, linkedinUrl } = req.body as {
        jobDescription?: string;
        linkedinUrl?: string;
      };

      // Upload PDF to R2
      const { url: resumeUrl } = await storageProvider.upload({
        buffer: req.file.buffer,
        key,
        contentType: req.file.mimetype,
      });

      // Call Python backend for parsing (non-blocking — null if Python is down)
      const parsedResume = await parseResumeViaPython(req.file.buffer, req.file.originalname);

      // Upsert resume fields into ProfileSubmission.
      // runValidators is skipped in the repository so jobDescription (required) won't block insert.
      const existing = await profileSubmissionRepository.findByUserId(userId);
      const resumeFields = {
        resumeUrl,
        resumeKey: key,
        ...(parsedResume && { parsedResume }),
        ...(jobDescription?.trim() && { jobDescription: jobDescription.trim() }),
        ...(linkedinUrl?.trim() && { linkedinUrl: linkedinUrl.trim() }),
      };
      if (existing) {
        await profileSubmissionRepository.updateById(existing._id.toString(), resumeFields as any);
      } else {
        await profileSubmissionRepository.createResumeOnly(userId, resumeFields);
      }

      sendSuccess(res, 200, {
        success: true,
        fileUrl: resumeUrl,
        filename: req.file.originalname,
        parsedResume,
      });
    } catch (err) {
      next(err);
    }
  },

  async getParsedData(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await profileSubmissionRepository.findById(id);
      if (!submission) {
        sendError(res, 404, 'Submission not found');
        return;
      }
      sendSuccess(res, 200, { success: true, parsedResume: submission.parsedResume });
    } catch (err) {
      next(err);
    }
  },

  async optimizeExperience(req: Request, res: Response, next: (err: unknown) => void): Promise<void> {
    try {
      const { role, company, bullets } = req.body as {
        role?: string;
        company?: string;
        bullets?: string[];
      };

      if (!role || !company || !Array.isArray(bullets) || bullets.length === 0) {
        sendError(res, 400, 'role, company, and a non-empty bullets array are required');
        return;
      }

      if (bullets.length > 20) {
        sendError(res, 400, 'Maximum 20 bullets allowed per request');
        return;
      }

      const result = await optimizeExperience({ role, company, bullets });
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
