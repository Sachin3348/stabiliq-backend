import mongoose from 'mongoose';

const parsedBulletSchema = new mongoose.Schema(
  { id: String, text: String },
  { _id: false }
);

const parsedExperienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    bullets: [parsedBulletSchema],
  },
  { _id: false }
);

const parsedProjectSchema = new mongoose.Schema(
  {
    name: String,
    bullets: [parsedBulletSchema],
  },
  { _id: false }
);

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
    /** Structured bullet points extracted from the uploaded PDF */
    parsedResume: {
      experience: [parsedExperienceSchema],
      projects: [parsedProjectSchema],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: 'profile-submissions',
  }
);

export interface ParsedBullet {
  id: string;
  text: string;
}

export interface ParsedExperience {
  company: string;
  role: string;
  bullets: ParsedBullet[];
}

export interface ParsedProject {
  name: string;
  bullets: ParsedBullet[];
}

export interface ParsedResume {
  experience: ParsedExperience[];
  projects: ParsedProject[];
}

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
  parsedResume?: ParsedResume;
  createdAt: Date;
  updatedAt: Date;
}

export const ProfileSubmission = mongoose.model<IProfileSubmissionDoc>(
  'ProfileSubmission',
  profileSubmissionSchema
);
