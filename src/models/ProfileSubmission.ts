import mongoose from 'mongoose';

const profileSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one active submission per user
    },
    status: {
      type: String,
      enum: ['pending', 'evaluating', 'evaluated'],
      default: 'pending',
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    resumeKey: {
      type: String,
    },
    linkedinUrl: {
      type: String,
      default: null,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    updatedResumeUrl: {
      type: String,
      default: null,
    },
    updatedResumeKey: {
      type: String,
      default: null,
    },
    suggestions: {
      type: String,
      default: null, // HTML rich text from admin's editor
    },
    adminNote: {
      type: String,
      default: null, // internal, not shown to user
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: 'profile-submissions',
  }
);

export interface IProfileSubmissionDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'evaluating' | 'evaluated';
  resumeUrl: string;
  resumeKey?: string;
  linkedinUrl?: string | null;
  jobDescription: string;
  updatedResumeUrl?: string | null;
  updatedResumeKey?: string | null;
  suggestions?: string | null;
  adminNote?: string | null;
  evaluatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ProfileSubmission = mongoose.model<IProfileSubmissionDoc>(
  'ProfileSubmission',
  profileSubmissionSchema
);
