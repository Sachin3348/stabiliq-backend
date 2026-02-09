import { userRepository } from '../repository/userRepository';
import type { JwtPayload } from '../types/auth';
import { AppError } from '../middlewares/AppError';

export interface FinancialStatusResult {
  isUnlocked: boolean;
  daysRemaining: number;
  daysSinceEnrollment?: number;
  enrollmentDate?: string;
  message: string;
}

export interface FinancialRequestResult {
  success: true;
  message: string;
  requestId: string;
}

export interface DocumentRequired {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export interface DocumentsRequiredResult {
  documents: DocumentRequired[];
  submitEmail: string;
  additionalInfo: string;
}

function daysSinceEnrollment(enrollmentDate: Date | null): number {
  if (!enrollmentDate) return 0;
  const now = new Date();
  const enrollment = new Date(enrollmentDate);
  return Math.floor((now.getTime() - enrollment.getTime()) / (1000 * 60 * 60 * 24));
}

export const financialAssistanceService = {
  async getStatus(payload: JwtPayload): Promise<FinancialStatusResult> {
    const user = await userRepository.findByEmail(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const enrollmentDate = user.enrollmentDate;
    if (!enrollmentDate) {
      return {
        isUnlocked: false,
        daysRemaining: 45,
        message: 'Enrollment date not found',
      };
    }
    const days = daysSinceEnrollment(enrollmentDate);
    const daysRemaining = Math.max(0, 45 - days);
    const isUnlocked = days >= 45;
    return {
      isUnlocked,
      daysRemaining,
      daysSinceEnrollment: days,
      enrollmentDate: new Date(enrollmentDate).toISOString(),
      message: isUnlocked ? 'Financial assistance available' : `Available in ${daysRemaining} days`,
    };
  },

  async submitRequest(payload: JwtPayload): Promise<FinancialRequestResult> {
    const user = await userRepository.findByEmail(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const enrollmentDate = user.enrollmentDate;
    if (!enrollmentDate) {
      throw new AppError(
        'Financial assistance is not yet available. Please wait 45 more days.',
        403
      );
    }
    const days = daysSinceEnrollment(enrollmentDate);
    const daysRemaining = Math.max(0, 45 - days);
    if (days < 45) {
      throw new AppError(
        `Financial assistance is not yet available. Please wait ${daysRemaining} more days.`,
        403
      );
    }
    const now = new Date();
    const requestId = `FA-${payload.id.substring(0, 8)}-${now
      .toISOString()
      .replace(/[-:T.]/g, '')
      .substring(0, 14)}`;
    return {
      success: true,
      message:
        'Financial assistance request received. Our team will review and contact you soon.',
      requestId,
    };
  },

  getDocumentsRequired(): DocumentsRequiredResult {
    return {
      documents: [
        {
          id: 'doc-1',
          title: 'Document providing reason for job loss',
          description: 'Official termination letter or layoff notice',
          required: true,
        },
        {
          id: 'doc-2',
          title: 'Employment termination letter from employer',
          description: 'Letter on company letterhead stating termination',
          required: true,
        },
        {
          id: 'doc-3',
          title: 'Salary slips of last 3 months',
          description: 'Recent salary slips showing employment',
          required: true,
        },
        {
          id: 'doc-4',
          title: 'Form 16',
          description: 'Latest Form 16 or tax documents',
          required: true,
        },
        {
          id: 'doc-5',
          title: "Employer's contact details",
          description: 'Phone number and email of HR/Manager',
          required: true,
        },
        {
          id: 'doc-6',
          title: 'Government ID Proof',
          description: 'Aadhaar card, PAN card, or Passport',
          required: true,
        },
      ],
      submitEmail: 'support@stabiliq.in',
      additionalInfo:
        "Please compile all documents in a single PDF and email to support@stabiliq.in with subject: 'Financial Assistance Request - [Your Name]'",
    };
  },
};
