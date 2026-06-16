import { leadRepository } from '../repository/leadRepository';
import { AppError } from '../middlewares/AppError';
import { env } from '../config/env';
import logger from '../commonservice/logger';
import axios from 'axios';
import type {
  CaptureLeadDto,
  LeadPublicDto,
  LeadAdminDto,
  UpdateLeadStageDto,
  LeadListQuery,
} from '../types/lead';

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

function notifyLeadCreatedAsync(lead: LeadPublicDto): void {
  const phone = env.AISENSY_LEAD_NOTIFY_PHONE;
  if (!phone || !env.AISENSY_API_KEY || !env.AISENSY_CAMPAIGN_NAME) return;

  axios
    .post(
      AISENSY_API_URL,
      {
        apiKey: env.AISENSY_API_KEY,
        campaignName: env.AISENSY_CAMPAIGN_NAME,
        destination: phone,
        userName: env.AISENSY_USER_NAME,
        templateParams: [
          lead.name ?? 'Unknown',
          lead.phone ?? lead.email ?? '-',
          lead.source,
          lead.utm.campaign ?? '-',
        ],
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    )
    .then(() => logger.info('Lead notification sent', { leadId: lead.id }))
    .catch((err) =>
      logger.error('Lead notification failed', {
        leadId: lead.id,
        error: axios.isAxiosError(err) ? (err.response?.data ?? err.message) : String(err),
      })
    );
}

export const leadService = {
  async captureLead(
    dto: CaptureLeadDto,
    meta: { ipAddress?: string; userAgent?: string }
  ): Promise<{ lead: LeadPublicDto; isNew: boolean }> {
    if (!dto.phone?.trim() && !dto.email?.trim()) {
      throw new AppError('phone or email is required', 400);
    }

    const existing = await leadRepository.findActiveByContact(dto.phone, dto.email);
    if (existing) {
      const updated = await leadRepository.findOneAndUpdate(
        { id: existing.id },
        {
          $set: {
            ...(dto.utm && { utm: dto.utm }),
            ...(dto.referralCode && { referralCode: dto.referralCode }),
            updatedAt: new Date(),
          },
        }
      );
      return { lead: leadRepository.toPublicDto(updated!), isNew: false };
    }

    const lead = await leadRepository.create({ ...dto, ...meta });
    const publicDto = leadRepository.toPublicDto(lead);
    notifyLeadCreatedAsync(publicDto);

    return { lead: publicDto, isNew: true };
  },

  async listLeads(
    query: LeadListQuery
  ): Promise<{ leads: LeadAdminDto[]; total: number; page: number; limit: number }> {
    const { leads, total } = await leadRepository.findAll(query);
    return {
      leads: leads.map(leadRepository.toAdminDto),
      total,
      page:  query.page  ?? 1,
      limit: query.limit ?? 20,
    };
  },

  async getLead(leadId: string): Promise<LeadAdminDto> {
    const lead = await leadRepository.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);
    return leadRepository.toAdminDto(lead);
  },

  async updateStage(
    leadId: string,
    dto: UpdateLeadStageDto,
    adminUserId: string
  ): Promise<LeadAdminDto> {
    const lead = await leadRepository.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    if (lead.stage === 'converted' && dto.stage !== 'converted') {
      throw new AppError('Cannot change stage of a converted lead', 400);
    }

    const updated = await leadRepository.findOneAndUpdate(
      { id: leadId },
      { $set: { stage: dto.stage, updatedAt: new Date() } }
    );

    await leadRepository.appendActivity(leadId, {
      action:      `stage_changed_to_${dto.stage}`,
      note:        dto.note,
      performedBy: adminUserId,
    });

    return leadRepository.toAdminDto(updated!);
  },

  async assignLead(
    leadId: string,
    assignToAdminId: string,
    actingAdminId: string
  ): Promise<LeadAdminDto> {
    const lead = await leadRepository.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    const updated = await leadRepository.findOneAndUpdate(
      { id: leadId },
      { $set: { assignedTo: assignToAdminId, updatedAt: new Date() } }
    );

    await leadRepository.appendActivity(leadId, {
      action:      'assigned',
      note:        `Assigned to ${assignToAdminId}`,
      performedBy: actingAdminId,
    });

    return leadRepository.toAdminDto(updated!);
  },

  async logCall(
    leadId: string,
    note: string,
    adminUserId: string
  ): Promise<LeadAdminDto> {
    const lead = await leadRepository.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    if (lead.stage === 'new') {
      await leadRepository.findOneAndUpdate(
        { id: leadId },
        { $set: { stage: 'contacted', updatedAt: new Date() } }
      );
    }

    const updated = await leadRepository.appendActivity(leadId, {
      action:      'call_logged',
      note,
      performedBy: adminUserId,
    });

    return leadRepository.toAdminDto(updated!);
  },

  async convertLead(
    leadId: string,
    userId: string,
    adminUserId: string
  ): Promise<LeadAdminDto> {
    const lead = await leadRepository.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);
    if (lead.stage === 'converted') throw new AppError('Lead is already converted', 400);

    const updated = await leadRepository.findOneAndUpdate(
      { id: leadId },
      {
        $set: {
          stage:           'converted',
          convertedUserId: userId,
          convertedAt:     new Date(),
          updatedAt:       new Date(),
        },
      }
    );

    await leadRepository.appendActivity(leadId, {
      action:      'converted',
      note:        `Linked to user ${userId}`,
      performedBy: adminUserId,
    });

    return leadRepository.toAdminDto(updated!);
  },
};
