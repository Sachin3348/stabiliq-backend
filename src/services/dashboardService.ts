import { userRepository } from '../repository/userRepository';
import type { JwtPayload } from '../types/auth';
import { AppError } from '../middlewares/AppError';

export interface DashboardStatsResult {
  coursesCompleted: number;
  daysUntilFinancialAssistance: number;
  planType: string;
  enrollmentDate: string | null;
  daysSinceEnrollment: number;
}

export const dashboardService = {
  async getStats(payload: JwtPayload): Promise<DashboardStatsResult> {
    const user = await userRepository.findByEmail(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const enrollmentDate = user.enrollmentDate;
    let daysSinceEnrollment = 0;
    let daysUntilFinancial = 45;
    if (enrollmentDate) {
      const now = new Date();
      const enrollment = new Date(enrollmentDate);
      daysSinceEnrollment = Math.floor((now.getTime() - enrollment.getTime()) / (1000 * 60 * 60 * 24));
      daysUntilFinancial = Math.max(0, 45 - daysSinceEnrollment);
    }
    return {
      coursesCompleted: 0,
      daysUntilFinancialAssistance: daysUntilFinancial,
      planType: user.plan || '',
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate).toISOString() : null,
      daysSinceEnrollment,
    };
  },
};
