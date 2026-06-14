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

const scoreComponentSchema = new mongoose.Schema(
  { score: Number, maxScore: Number, feedback: String },
  { _id: false }
);

const resumeScoreSchema = new mongoose.Schema(
  {
    overallScore: Number,
    detectedRole: String,
    detectedDomain: String,
    impactScore: scoreComponentSchema,
    brevityScore: scoreComponentSchema,
    styleScore: scoreComponentSchema,
    skillsScore: scoreComponentSchema,
    sectionsScore: scoreComponentSchema,
    topIssues: [String],
    strengths: [String],
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
    resumeScore: {
      type: resumeScoreSchema,
      default: null,
    },

    /** LinkedIn profile AI review result — cached per user */
    linkedInReview: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    linkedInReviewedAt: {
      type: Date,
      default: null,
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

export interface ScoreComponent {
  score: number;
  maxScore: number;
  feedback: string;
}

export interface ResumeScore {
  overallScore: number;
  detectedRole: string;
  detectedDomain: string;
  impactScore: ScoreComponent;
  brevityScore: ScoreComponent;
  styleScore: ScoreComponent;
  skillsScore: ScoreComponent;
  sectionsScore: ScoreComponent;
  topIssues: string[];
  strengths: string[];
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
  resumeScore?: ResumeScore | null;
  linkedInReview?: Record<string, unknown> | null;
  linkedInReviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ProfileSubmission = mongoose.model<IProfileSubmissionDoc>(
  'ProfileSubmission',
  profileSubmissionSchema
);
