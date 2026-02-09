import { v4 as uuidv4 } from 'uuid';
import { StatusCheck, IStatusCheckDoc } from '../models/StatusCheck';
import type { StatusCheckDto } from '../types/statusCheck';

function toDto(doc: IStatusCheckDoc): StatusCheckDto {
  return {
    id: doc.id,
    client_name: doc.client_name,
    timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : String(doc.timestamp),
  };
}

export const statusCheckRepository = {
  async create(client_name: string): Promise<IStatusCheckDoc> {
    const check = new StatusCheck({
      id: uuidv4(),
      client_name,
      timestamp: new Date(),
    });
    await check.save();
    return check;
  },

  async list(limit: number = 1000): Promise<StatusCheckDto[]> {
    const docs = await StatusCheck.find({}).limit(limit).lean().exec();
    return docs.map((d) => ({
      id: d.id,
      client_name: d.client_name,
      timestamp:
        d.timestamp instanceof Date ? d.timestamp.toISOString() : String(d.timestamp),
    }));
  },

  toDto,
};
