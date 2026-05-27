import { Request, Response, NextFunction } from 'express';
import { runTargetedReview, TargetedReviewServiceError } from '../services/targetedReviewService';
import logger from '../commonservice/logger';

const VALID_SENIORITY = new Set([
  'junior', 'mid', 'senior', 'staff', 'principal', 'director', 'vp', 'c-level',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME  = ['application/pdf', 'application/octet-stream'];

export const targetedReviewController = {
  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();

    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // ── Validate file ─────────────────────────────────────────────────────
      if (!req.file) {
        res.status(400).json({ error: 'Resume PDF is required. Send it under the "file" field.' });
        return;
      }
      if (!ACCEPTED_MIME.includes(req.file.mimetype)) {
        res.status(400).json({ error: 'Only PDF files are accepted.' });
        return;
      }
      if (req.file.size === 0 || req.file.buffer.length === 0) {
        res.status(400).json({ error: 'Uploaded file is empty.' });
        return;
      }
      if (req.file.size > MAX_FILE_SIZE) {
        res.status(413).json({ error: 'File exceeds maximum size of 10MB.' });
        return;
      }

      // ── Validate text fields ──────────────────────────────────────────────
      const { job_description, company_name, target_role, seniority_level } =
        req.body as Record<string, string | undefined>;

      if (!job_description?.trim()) {
        res.status(422).json({ error: 'job_description is required and must be a non-empty string.' });
        return;
      }
      if (job_description.length > 20_000) {
        res.status(422).json({ error: 'job_description exceeds maximum length of 20,000 characters.' });
        return;
      }
      for (const [field, val] of [['company_name', company_name], ['target_role', target_role]] as [string, string | undefined][]) {
        if (val && val.length > 200) {
          res.status(422).json({ error: `${field} exceeds maximum length of 200 characters.` });
          return;
        }
      }
      if (seniority_level && !VALID_SENIORITY.has(seniority_level)) {
        res.status(422).json({
          error: `seniority_level must be one of: ${[...VALID_SENIORITY].join(', ')}.`,
        });
        return;
      }

      // ── Forward to Python ─────────────────────────────────────────────────
      const result = await runTargetedReview(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { job_description: job_description.trim(), company_name, target_role, seniority_level }
      );

      const elapsed = Date.now() - start;
      logger.info('Targeted resume review', {
        method: req.method,
        path: req.path,
        fileSizeKB: (req.file.size / 1024).toFixed(1),
        jdLength: job_description.length,
        targetRole: target_role ?? null,
        status: 200,
        responseTimeMs: elapsed,
      });

      res.status(200).json(result);
    } catch (err) {
      const elapsed = Date.now() - start;
      const svcErr = err as TargetedReviewServiceError;

      if (typeof svcErr.status === 'number' && typeof svcErr.message === 'string') {
        logger.warn('Targeted review error', {
          method: req.method,
          path: req.path,
          status: svcErr.status,
          responseTimeMs: elapsed,
          error: svcErr.message,
        });
        res.status(svcErr.status).json({ error: svcErr.message });
        return;
      }

      next(err);
    }
  },
};
