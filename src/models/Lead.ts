import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { LeadSourceCategory, LeadStage } from '../types/lead';

export interface ILeadDoc extends mongoose.Document {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  sourceCategory: LeadSourceCategory;
  source: string;
  referralCode: string | null;
  referrerUserId: string | null;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
  message: string | null;
  stage: LeadStage;
  convertedUserId: string | null;
  convertedAt: Date | null;
  assignedTo: string | null;
  activityLog: Array<{
    action: string;
    note: string | null;
    performedBy: string | null;
    timestamp: Date;
  }>;
  adminNotes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const utmSchema = new mongoose.Schema(
  {
    source:   { type: String, trim: true, default: null },
    medium:   { type: String, trim: true, default: null },
    campaign: { type: String, trim: true, default: null },
    term:     { type: String, trim: true, default: null },
    content:  { type: String, trim: true, default: null },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    action:      { type: String, required: true },
    note:        { type: String, default: null },
    performedBy: { type: String, default: null },
    timestamp:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
    },
    phone: { type: String, trim: true, default: null, index: true },
    email: { type: String, trim: true, lowercase: true, default: null, index: true },
    name:  { type: String, trim: true, default: null },
    sourceCategory: {
      type: String,
      enum: ['website', 'referral', 'ad_campaign', 'partner', 'organic', 'internal'],
      required: true,
    },
    source:         { type: String, trim: true, required: true, index: true },
    referralCode:   { type: String, trim: true, default: null, index: true },
    referrerUserId: { type: String, default: null },
    utm:            { type: utmSchema, default: () => ({}) },
    message:        { type: String, default: null },
    stage: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost', 'unqualified'],
      default: 'new',
      index: true,
    },
    convertedUserId: { type: String, default: null },
    convertedAt:     { type: Date, default: null },
    assignedTo:      { type: String, default: null },
    activityLog:     { type: [activityLogSchema], default: [] },
    adminNotes:      { type: String, default: null },
    ipAddress:       { type: String, default: null },
    userAgent:       { type: String, default: null },
    createdAt:       { type: Date, default: Date.now },
    updatedAt:       { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'leads',
  }
);

leadSchema.index({ phone: 1, stage: 1 });
leadSchema.index({ email: 1, stage: 1 });
leadSchema.index({ 'utm.campaign': 1 });
leadSchema.index({ createdAt: -1 });

leadSchema.set('toJSON', {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    delete ret.__v;
    delete ret.ipAddress;
    delete ret.userAgent;
    delete ret.adminNotes;
    return ret;
  },
});

export const Lead = mongoose.model<ILeadDoc>('Lead', leadSchema);
