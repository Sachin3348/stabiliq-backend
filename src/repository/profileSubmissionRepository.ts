import mongoose from 'mongoose';
import { ProfileSubmission, IProfileSubmissionDoc } from '../models/ProfileSubmission';

export const profileSubmissionRepository = {
  async findByUserId(userId: string): Promise<IProfileSubmissionDoc | null> {
    return ProfileSubmission.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  },

  /** Creates a minimal submission with only resume data — skips required field validation.
   *  jobDescription can be filled later via the /submit flow. */
  async createResumeOnly(
    userId: string,
    data: { resumeUrl: string; resumeKey?: string; parsedResume?: any }
  ): Promise<IProfileSubmissionDoc> {
    return ProfileSubmission.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { userId: new mongoose.Types.ObjectId(userId), ...data } },
      { new: true, upsert: true, runValidators: false }
    ).exec() as Promise<IProfileSubmissionDoc>;
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

  /** Upsert LinkedIn review result — creates a minimal doc if none exists yet */
  async saveLinkedInReview(
    userId: string,
    review: Record<string, unknown>
  ): Promise<IProfileSubmissionDoc> {
    return ProfileSubmission.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          linkedInReview: review,
          linkedInReviewedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: false }
    ).exec() as Promise<IProfileSubmissionDoc>;
  },

  /** Return only the cached LinkedIn review for a user (lightweight query) */
  async getLinkedInReview(
    userId: string
  ): Promise<{ linkedInReview: Record<string, unknown> | null; linkedInReviewedAt: Date | null } | null> {
    const doc = await ProfileSubmission.findOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { linkedInReview: 1, linkedInReviewedAt: 1, _id: 0 }
    ).exec();
    if (!doc) return null;
    return {
      linkedInReview: (doc.linkedInReview as Record<string, unknown>) ?? null,
      linkedInReviewedAt: doc.linkedInReviewedAt ?? null,
    };
  },
};
