import { Router, Request, Response } from 'express';
import { adminSubmissionController } from '../controllers/adminSubmissionController';
import { getCurrentUser } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { resumeUpload } from '../middlewares/resumeUpload';

const router = Router();

// all admin routes require auth + admin role
router.use(getCurrentUser, requireAdmin);

// GET  /api/admin/submissions
router.get('/submissions', (req: Request, res: Response) =>
  adminSubmissionController.listSubmissions(req, res)
);

// GET  /api/admin/submissions/:submissionId
router.get('/submissions/:submissionId', (req: Request, res: Response) =>
  adminSubmissionController.getSubmission(req, res)
);

// PATCH /api/admin/submissions/:submissionId/status
router.patch('/submissions/:submissionId/status', (req: Request, res: Response) =>
  adminSubmissionController.updateStatus(req, res)
);

// POST  /api/admin/submissions/:submissionId/evaluate
router.post(
  '/submissions/:submissionId/evaluate',
  resumeUpload.single('updatedResume'),
  (req: Request, res: Response) => adminSubmissionController.evaluate(req, res)
);

export default router;
