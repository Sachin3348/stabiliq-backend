import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import type { TargetedReviewResponse } from '../types/targetedReview';

const PYTHON_BACKEND_URL = process.env.RESUME_PARSER_URL || 'http://localhost:9000';

export interface TargetedReviewServiceError {
  status: number;
  message: string;
}

export interface TargetedReviewFields {
  job_description: string;
  company_name?: string;
  target_role?: string;
  seniority_level?: string;
}

export async function runTargetedReview(
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string,
  fields: TargetedReviewFields
): Promise<TargetedReviewResponse> {
  const form = new FormData();

  form.append('file', fileBuffer, {
    filename: originalname,
    contentType: mimetype,
    knownLength: fileBuffer.length,
  });
  form.append('job_description', fields.job_description);
  if (fields.company_name)    form.append('company_name',    fields.company_name);
  if (fields.target_role)     form.append('target_role',     fields.target_role);
  if (fields.seniority_level) form.append('seniority_level', fields.seniority_level);

  try {
    const response = await axios.post<TargetedReviewResponse>(
      `${PYTHON_BACKEND_URL}/resume/targeted-review`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120_000,
        maxBodyLength: 10 * 1024 * 1024 + 1024,
      }
    );
    return response.data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;

    if (axiosErr.response) {
      const status = axiosErr.response.status;
      const detail = axiosErr.response.data?.detail ?? 'Unknown error from AI service';
      throw { status, message: detail } as TargetedReviewServiceError;
    }

    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
      throw {
        status: 504,
        message: 'AI service timeout. This analysis can take up to 2 minutes.',
      } as TargetedReviewServiceError;
    }

    throw { status: 500, message: 'Internal server error' } as TargetedReviewServiceError;
  }
}
