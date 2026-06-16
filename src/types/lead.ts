export type LeadSourceCategory =
  | 'website'
  | 'referral'
  | 'ad_campaign'
  | 'partner'
  | 'organic'
  | 'internal';

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost'
  | 'unqualified';

export interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

export interface LeadActivityEntry {
  action: string;
  note: string | null;
  performedBy: string | null;
  timestamp: Date;
}

export interface LeadPublicDto {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  sourceCategory: LeadSourceCategory;
  source: string;
  referralCode: string | null;
  utm: UtmParams;
  message: string | null;
  stage: LeadStage;
  createdAt: string;
}

export interface LeadAdminDto extends LeadPublicDto {
  referrerUserId: string | null;
  assignedTo: string | null;
  convertedUserId: string | null;
  convertedAt: string | null;
  activityLog: LeadActivityEntry[];
  adminNotes: string | null;
  updatedAt: string;
}

export interface CaptureLeadDto {
  phone?: string;
  email?: string;
  name?: string;
  sourceCategory: LeadSourceCategory;
  source: string;
  referralCode?: string;
  referrerUserId?: string;
  utm?: Partial<UtmParams>;
  message?: string;
}

export interface UpdateLeadStageDto {
  stage: LeadStage;
  note?: string;
}

export interface LeadListQuery {
  stage?: LeadStage;
  source?: string;
  sourceCategory?: LeadSourceCategory;
  assignedTo?: string;
  page?: number;
  limit?: number;
  search?: string;
}
