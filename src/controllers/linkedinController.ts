import { Request, Response, NextFunction } from 'express';
import { reviewLinkedInProfile, LinkedInServiceError } from '../services/linkedinService';
import logger from '../commonservice/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME_TYPES = ['application/pdf', 'application/octet-stream'];

export const linkedinController = {
  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();

    try {
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

      const elapsed = Date.now() - start;
      logger.info('LinkedIn review', {
        method: req.method,
        path: req.path,
        fileSizeKB: (size / 1024).toFixed(1),
        status: 200,
        responseTimeMs: elapsed,
      });

      res.status(200).json(result);
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
