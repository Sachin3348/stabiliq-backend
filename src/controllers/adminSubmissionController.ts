import { Request, Response } from 'express';
import { profileSubmissionRepository } from '../repository/profileSubmissionRepository';
import { storageProvider } from '../storage';

// ─── helpers ─────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['evaluating', 'evaluated'] as const;
type UpdatableStatus = (typeof VALID_STATUSES)[number];

function buildEvaluatedKey(submissionId: string, originalname: string): string {
  return `resumes/evaluated/${submissionId}/${Date.now()}_${originalname}`;
}

async function deleteFromR2(key: string): Promise<void> {
  try {
    await storageProvider.delete(key);
  } catch (err) {
    console.error(`Failed to delete R2 key: ${key}`, err);
  }
}

// ─── controllers ─────────────────────────────────────────────────────────────

export const adminSubmissionController = {
  /** GET /api/admin/submissions */
  async listSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

      const { submissions, total } = await profileSubmissionRepository.findAll(
        filter,
        pageNum,
        limitNum
      );

      res.status(200).json({ submissions, total, page: pageNum, limit: limitNum });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },

  /** GET /api/admin/submissions/:submissionId */
  async getSubmission(req: Request, res: Response): Promise<void> {
    try {
      const submission = await profileSubmissionRepository.findByIdWithUser(
        req.params.submissionId
      );
      if (!submission) {
        res.status(404).json({ message: 'Submission not found' });
        return;
      }
      const populatedUser = submission.userId as any;
      res.status(200).json({
        submission,
        user: {
          name: populatedUser?.name,
          email: populatedUser?.email,
          plan: populatedUser?.plan,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },

  /** PATCH /api/admin/submissions/:submissionId/status */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body as { status?: string };

      if (!status || !VALID_STATUSES.includes(status as UpdatableStatus)) {
        res
          .status(400)
          .json({ message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` });
        return;
      }

      const updates: Record<string, unknown> = { status };
      if (status === 'evaluated') updates.evaluatedAt = new Date();

      const submission = await profileSubmissionRepository.updateById(
        req.params.submissionId,
        updates as any
      );

      if (!submission) {
        res.status(404).json({ message: 'Submission not found' });
        return;
      }

      res.status(200).json({ message: 'Status updated', submission });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },

  /** POST /api/admin/submissions/:submissionId/evaluate */
  async evaluate(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { suggestions, adminNote } = req.body as {
        suggestions?: string;
        adminNote?: string;
      };

      if (!suggestions?.trim()) {
        res.status(400).json({ message: 'suggestions is required' });
        return;
      }

      const submission = await profileSubmissionRepository.findById(submissionId);
      if (!submission) {
        res.status(404).json({ message: 'Submission not found' });
        return;
      }

      const updates: Record<string, unknown> = {
        suggestions: suggestions.trim(),
        adminNote: adminNote?.trim() || null,
        status: 'evaluated',
        evaluatedAt: new Date(),
      };

      if (req.file) {
        // delete previous evaluated resume if exists
        if (submission.updatedResumeKey) {
          await deleteFromR2(submission.updatedResumeKey);
        }
        const key = buildEvaluatedKey(submissionId, req.file.originalname);
        const { url } = await storageProvider.upload({
          buffer: req.file.buffer,
          key,
          contentType: req.file.mimetype,
        });
        updates.updatedResumeUrl = url;
        updates.updatedResumeKey = key;
      }

      const updated = await profileSubmissionRepository.updateById(submissionId, updates as any);

      res.status(200).json({ message: 'Evaluation submitted', submission: updated });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err?.message });
    }
  },
};
