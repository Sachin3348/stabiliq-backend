import { Request, Response } from 'express';
import { coursesService } from '../services';
import { sendSuccess } from '../utils/response';

export const coursesController = {
  getModules(_req: Request, res: Response): Response {
    const result = coursesService.getModules();
    return sendSuccess(res, 200, result);
  },

  getModuleById(req: Request, res: Response, next: (err: unknown) => void): void {
    try {
      const { module_id } = req.params;
      const result = coursesService.getModuleById(module_id);
      sendSuccess(res, 200, result);
    } catch (err) {
      next(err);
    }
  },

  markLessonComplete(req: Request, res: Response): Response {
    const { module_id, lesson_id } = req.params;
    const result = coursesService.markLessonComplete(module_id, lesson_id);
    return sendSuccess(res, 200, result);
  },
};
