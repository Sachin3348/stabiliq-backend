import { Request, Response } from 'express';
import { profileSubmissionRepository } from '../repository/profileSubmissionRepository';
import { storageProvider } from '../storage';

// ─── helpers ─────────────────────────────────────────────────────────────────

const LOCKED_STATUSES = ['evaluating', 'evaluated'] as const;

function buildResumeKey(userId: string, originalname: string): string {
  return `resumes/users/${userId}/${Date.now()}_${originalname}`;
}

async function deleteFromR2(key: string): Promise<void> {
  try {
    await storageProvider.delete(key);
  } catch (err) {
    console.error(`Failed to delete R2 key: ${key}`, err);
  }
}

// ─── controllers ─────────────────────────────────────────────────────────────

export const profileSubmissionController = {
  /** GET /api/profile/submission */
  async getSubmission(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id.toString();
      const submission = await profileSubmissionRepository.findByUserId(userId);
      if (!submission) {
        res.status(404).json({ message: 'No submission found' });
        return;
      }
      res.status(200).json(submission);
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },

  /** POST /api/profile/submit */
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id.toString();
      const { jobDescription, linkedinUrl } = req.body as {
        jobDescription?: string;
        linkedinUrl?: string;
      };

      if (!req.file) {
        res.status(400).json({ message: 'Resume file is required' });
        return;
      }
      if (!jobDescription?.trim()) {
        res.status(400).json({ message: 'jobDescription is required' });
        return;
      }

      const existing = await profileSubmissionRepository.findByUserId(userId);

      if (existing && LOCKED_STATUSES.includes(existing.status as any)) {
        res.status(400).json({
          message: 'Cannot re-submit while evaluation is in progress or completed',
        });
        return;
      }

      // delete old resume from R2 if re-submitting in pending state
      if (existing?.resumeKey) {
        await deleteFromR2(existing.resumeKey);
      }

      const key = buildResumeKey(userId, req.file.originalname);
      const { url } = await storageProvider.upload({
        buffer: req.file.buffer,
        key,
        contentType: req.file.mimetype,
      });

      const submission = await profileSubmissionRepository.upsertByUserId(userId, {
        userId: req.user!.id,
        resumeUrl: url,
        resumeKey: key,
        jobDescription: jobDescription.trim(),
        linkedinUrl: linkedinUrl?.trim() || null,
        status: 'pending',
        // clear any previous evaluation data on re-submit
        updatedResumeUrl: null,
        updatedResumeKey: null,
        suggestions: null,
        adminNote: null,
        evaluatedAt: null,
      } as any);

      res.status(201).json({ message: 'Submitted successfully', submission });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },

  /** PUT /api/profile/submission */
  async updateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id.toString();
      const submission = await profileSubmissionRepository.findByUserId(userId);

      if (!submission) {
        res.status(404).json({ message: 'No submission found' });
        return;
      }
      if (LOCKED_STATUSES.includes(submission.status as any)) {
        res.status(403).json({ message: 'Submission is locked and cannot be edited' });
        return;
      }

      const { jobDescription, linkedinUrl } = req.body as {
        jobDescription?: string;
        linkedinUrl?: string;
      };

      const updates: Record<string, unknown> = {};

      if (req.file) {
        if (submission.resumeKey) await deleteFromR2(submission.resumeKey);
        const key = buildResumeKey(userId, req.file.originalname);
        const { url } = await storageProvider.upload({
          buffer: req.file.buffer,
          key,
          contentType: req.file.mimetype,
        });
        updates.resumeUrl = url;
        updates.resumeKey = key;
      }
      if (jobDescription?.trim()) updates.jobDescription = jobDescription.trim();
      if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl?.trim() || null;

      const updated = await profileSubmissionRepository.updateById(
        submission._id.toString(),
        updates as any
      );

      res.status(200).json({ message: 'Updated successfully', submission: updated });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },
};
