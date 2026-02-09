import { statusCheckRepository } from '../repository/statusCheckRepository';
import type { StatusCheckDto } from '../types/statusCheck';

export interface CreateStatusResult extends StatusCheckDto {}

export const statusCheckService = {
  async create(client_name: string): Promise<CreateStatusResult> {
    const doc = await statusCheckRepository.create(client_name);
    return statusCheckRepository.toDto(doc);
  },

  async list(): Promise<StatusCheckDto[]> {
    return statusCheckRepository.list(1000);
  },
};
