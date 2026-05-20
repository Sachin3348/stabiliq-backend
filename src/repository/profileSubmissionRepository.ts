import mongoose from 'mongoose';
import { ProfileSubmission, IProfileSubmissionDoc } from '../models/ProfileSubmission';

export const profileSubmissionRepository = {
  async findByUserId(userId: string): Promise<IProfileSubmissionDoc | null> {
    return ProfileSubmission.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  },

  async findById(id: string): Promise<IProfileSubmissionDoc | null> {
    return ProfileSubmission.findById(id).exec();
  },

  async findByIdWithUser(id: string): Promise<IProfileSubmissionDoc | null> {
    return ProfileSubmission.findById(id)
      .populate('userId', 'name email plan')
      .exec();
  },

  async findAll(
    filter: Record<string, unknown>,
    page: number,
    limit: number
  ): Promise<{ submissions: IProfileSubmissionDoc[]; total: number }> {
    const [submissions, total] = await Promise.all([
      ProfileSubmission.find(filter)
        .populate('userId', 'name email plan')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ProfileSubmission.countDocuments(filter).exec(),
    ]);
    return { submissions, total };
  },

  async upsertByUserId(
    userId: string,
    data: Partial<IProfileSubmissionDoc>
  ): Promise<IProfileSubmissionDoc> {
    return ProfileSubmission.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: data },
      { new: true, upsert: true }
    ).exec() as Promise<IProfileSubmissionDoc>;
  },

  async updateById(
    id: string,
    data: Partial<IProfileSubmissionDoc>
  ): Promise<IProfileSubmissionDoc | null> {
    return ProfileSubmission.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  },
};
