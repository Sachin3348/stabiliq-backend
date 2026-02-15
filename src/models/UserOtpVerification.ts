import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userOtpVerificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // index defined below via schema.index() for TTL
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'user_otp_verifications',
  }
);

// TTL index: MongoDB automatically removes documents after expiresAt
userOtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

userOtpVerificationSchema.set('toJSON', {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export interface IUserOtpVerificationDoc extends mongoose.Document {
  id: string;
  email: string;
  otp: string;
  expiresAt: Date;
  consumed: boolean;
  consumedAt: Date | null;
  createdAt: Date;
}

export const UserOtpVerification = mongoose.model<IUserOtpVerificationDoc>(
  'UserOtpVerification',
  userOtpVerificationSchema
);
