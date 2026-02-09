import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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
      required: true,
      unique: true,
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
    },
    plan: {
      type: String,
      enum: ['basic', 'pro'],
      default: 'basic',
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
  },
  {
    timestamps: false,
    collection: 'users',
  }
);

userSchema.set('toJSON', {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export interface IUserDoc extends mongoose.Document {
  id: string;
  email: string;
  name: string;
  phone: string;
  plan: string;
  enrollmentDate: Date | null;
  createdAt: Date;
  isActive: boolean;
}

export const User = mongoose.model<IUserDoc>('User', userSchema);
