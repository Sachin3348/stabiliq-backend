import { COURSE_MODULES } from './courseData';
import type { CourseModuleDto } from '../types/course';
import { AppError } from '../middlewares/AppError';

export interface ModulesListResult {
  modules: CourseModuleDto[];
}

export const coursesService = {
  getModules(): ModulesListResult {
    return { modules: COURSE_MODULES };
  },

  getModuleById(moduleId: string): CourseModuleDto {
    const mod = COURSE_MODULES.find((m) => m.id === moduleId);
    if (!mod) {
      throw new AppError('Module not found', 404);
    }
    return mod;
  },

  markLessonComplete(_moduleId: string, _lessonId: string): { success: true; message: string } {
    return { success: true, message: 'Lesson marked as complete' };
  },
};
