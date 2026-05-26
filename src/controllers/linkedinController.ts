import { Request, Response, NextFunction } from 'express';
import { reviewLinkedInProfile, LinkedInServiceError } from '../services/linkedinService';
import { profileSubmissionRepository } from '../repository/profileSubmissionRepository';
import logger from '../commonservice/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME_TYPES = ['application/pdf', 'application/octet-stream'];

export const linkedinController = {
  /**
   * GET /api/linkedin/review
   * Returns the cached LinkedIn review for the authenticated user.
   * If none exists yet, returns { cached: false, data: null }.
   */
  async getCachedReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const cached = await profileSubmissionRepository.getLinkedInReview(
        req.user.id.toString()
      );

      if (!cached || !cached.linkedInReview) {
        res.status(200).json({ cached: false, data: null });
        return;
      }

      res.status(200).json({
        cached: true,
        reviewedAt: cached.linkedInReviewedAt,
        success: true,
        data: cached.linkedInReview,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/linkedin/review
   * Accepts a PDF, calls Python AI service, persists result, returns it.
   */
  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();

    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // ── 1. Validate file presence ─────────────────────────────────────────
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Send a PDF under the "file" field.' });
        return;
      }

      const { buffer, originalname, mimetype, size } = req.file;

      // ── 2. Validate MIME type ─────────────────────────────────────────────
      if (!ACCEPTED_MIME_TYPES.includes(mimetype)) {
        res.status(400).json({ error: 'Only PDF files are accepted.' });
        return;
      }

      // ── 3. Validate empty file ────────────────────────────────────────────
      if (size === 0 || buffer.length === 0) {
        res.status(400).json({ error: 'Uploaded file is empty.' });
        return;
      }

      // ── 4. Validate file size ─────────────────────────────────────────────
      if (size > MAX_FILE_SIZE) {
        res.status(413).json({ error: 'File exceeds maximum size of 10MB.' });
        return;
      }

      // ── 5. Forward to Python service ──────────────────────────────────────
      const result = await reviewLinkedInProfile(buffer, originalname, mimetype);

      // ── 6. Persist result so user doesn't need to re-upload ───────────────
      await profileSubmissionRepository.saveLinkedInReview(
        req.user.id.toString(),
        result.data as unknown as Record<string, unknown>
      );

      const elapsed = Date.now() - start;
      logger.info('LinkedIn review', {
        method: req.method,
        path: req.path,
        fileSizeKB: (size / 1024).toFixed(1),
        status: 200,
        responseTimeMs: elapsed,
      });

      res.status(200).json({ ...result, cached: false });
    } catch (err) {
      const elapsed = Date.now() - start;
      const svcErr = err as LinkedInServiceError;

      // Known service errors (thrown by linkedinService)
      if (typeof svcErr.status === 'number' && typeof svcErr.message === 'string') {
        logger.warn('LinkedIn review error', {
          method: req.method,
          path: req.path,
          status: svcErr.status,
          responseTimeMs: elapsed,
          error: svcErr.message,
        });

        if (svcErr.status === 504) {
          res.status(504).json({ error: 'AI service timeout' });
          return;
        }
        res.status(svcErr.status).json({ error: svcErr.message });
        return;
      }

      // Unexpected errors → pass to global error handler
      next(err);
    }
  },
};
