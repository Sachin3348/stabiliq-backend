import { Lead, ILeadDoc } from '../models/Lead';
import type {
  CaptureLeadDto,
  LeadPublicDto,
  LeadAdminDto,
  LeadListQuery,
  UtmParams,
} from '../types/lead';

function buildUtm(raw: ILeadDoc['utm']): UtmParams {
  return {
    source:   raw?.source   ?? null,
    medium:   raw?.medium   ?? null,
    campaign: raw?.campaign ?? null,
    term:     raw?.term     ?? null,
    content:  raw?.content  ?? null,
  };
}

function toPublicDto(doc: ILeadDoc): LeadPublicDto {
  return {
    id:             doc.id,
    phone:          doc.phone,
    email:          doc.email,
    name:           doc.name,
    sourceCategory: doc.sourceCategory,
    source:         doc.source,
    referralCode:   doc.referralCode,
    utm:            buildUtm(doc.utm),
    message:        doc.message,
    stage:          doc.stage,
    createdAt:      doc.createdAt.toISOString(),
  };
}

function toAdminDto(doc: ILeadDoc): LeadAdminDto {
  return {
    ...toPublicDto(doc),
    referrerUserId:  doc.referrerUserId,
    assignedTo:      doc.assignedTo,
    convertedUserId: doc.convertedUserId,
    convertedAt:     doc.convertedAt ? doc.convertedAt.toISOString() : null,
    activityLog:     doc.activityLog,
    adminNotes:      doc.adminNotes,
    updatedAt:       doc.updatedAt.toISOString(),
  };
}

export const leadRepository = {
  async create(
    data: CaptureLeadDto & { ipAddress?: string; userAgent?: string }
  ): Promise<ILeadDoc> {
    const lead = new Lead({
      ...data,
      utm: data.utm ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await lead.save();
    return lead;
  },

  async findOne(query: Record<string, unknown>): Promise<ILeadDoc | null> {
    return Lead.findOne(query).exec();
  },

  async findById(id: string): Promise<ILeadDoc | null> {
    return Lead.findOne({ id }).exec();
  },

  async findOneAndUpdate(
    query: Record<string, unknown>,
    update: Record<string, unknown>
  ): Promise<ILeadDoc | null> {
    return Lead.findOneAndUpdate(query, update, { new: true }).exec();
  },

  async findActiveByContact(
    phone?: string,
    email?: string
  ): Promise<ILeadDoc | null> {
    const conditions: Record<string, unknown>[] = [];
    if (phone) conditions.push({ phone, stage: { $ne: 'converted' } });
    if (email) conditions.push({ email, stage: { $ne: 'converted' } });
    if (!conditions.length) return null;
    return Lead.findOne({ $or: conditions }).sort({ createdAt: -1 }).exec();
  },

  async findAll(query: LeadListQuery): Promise<{ leads: ILeadDoc[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (query.stage)          filter.stage = query.stage;
    if (query.source)         filter.source = query.source;
    if (query.sourceCategory) filter.sourceCategory = query.sourceCategory;
    if (query.assignedTo)     filter.assignedTo = query.assignedTo;
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ phone: regex }, { email: regex }, { name: regex }];
    }

    const page  = Math.max(1, query.page  ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      Lead.countDocuments(filter).exec(),
    ]);
    return { leads, total };
  },

  async appendActivity(
    leadId: string,
    entry: { action: string; note?: string; performedBy?: string }
  ): Promise<ILeadDoc | null> {
    return Lead.findOneAndUpdate(
      { id: leadId },
      {
        $push: { activityLog: { action: entry.action, note: entry.note ?? null, performedBy: entry.performedBy ?? null, timestamp: new Date() } },
        $set:  { updatedAt: new Date() },
      },
      { new: true }
    ).exec();
  },

  toPublicDto,
  toAdminDto,
};
