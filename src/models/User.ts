import mongoose, { ObjectId } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function getReferralPrefix(name?: string): string {
  const firstName = name?.trim().split(/\s+/)[0] ?? '';
  const sanitized = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (sanitized || 'USER').slice(0, 4);
}

function generateReferralSuffix(length = 6): string {
  return crypto
    .randomBytes(length * 2)
    .toString('base64url')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, length);
}

function buildReferralCode(name?: string): string {
  return `${getReferralPrefix(name)}${generateReferralSuffix()}`;
}

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'pro']
    },
    enrollmentDate: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredByUserId: {
      type: String,
      default: null,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
    collection: 'users',
  }
);

userSchema.pre('validate', async function generateUniqueReferralCode() {
  if (this.referralCode) return;

  const UserModel = this.constructor as mongoose.Model<IUserDoc>;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = buildReferralCode(this.name);
    const existingUser = await UserModel.exists({ referralCode: candidate });
    if (!existingUser) {
      this.referralCode = candidate;
      return;
    }
  }

  throw new Error('Failed to generate unique referral code');
});

userSchema.set('toJSON', {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export interface IUserDoc extends mongoose.Document {
  id: ObjectId;
  email?: string;
  name: string;
  phone: string;
  plan?: string;
  enrollmentDate: Date | null;
  createdAt: Date;
  isActive: boolean;
  referralCode: string;
  referredByUserId: string | null;
  walletBalance: number;
}

export const User = mongoose.model<IUserDoc>('User', userSchema);
