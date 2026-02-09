import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const statusCheckSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
    },
    client_name: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'status_checks',
  }
);

statusCheckSchema.set('toJSON', {
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export interface IStatusCheckDoc extends mongoose.Document {
  id: string;
  client_name: string;
  timestamp: Date;
}

export const StatusCheck = mongoose.model<IStatusCheckDoc>('StatusCheck', statusCheckSchema);
