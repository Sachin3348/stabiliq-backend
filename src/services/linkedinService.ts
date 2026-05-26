import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import type { LinkedInReviewResponse } from '../types/linkedin';

const RESUME_PARSER_URL = process.env.RESUME_PARSER_URL || 'http://localhost:9000';

export interface LinkedInServiceError {
  status: number;
  message: string;
}

export async function reviewLinkedInProfile(
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<LinkedInReviewResponse> {
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: originalname,
    contentType: mimetype,
    knownLength: fileBuffer.length,
  });

  try {
    const response = await axios.post<LinkedInReviewResponse>(
      `${RESUME_PARSER_URL}/linkedin/review`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 60000,
        maxBodyLength: 10 * 1024 * 1024 + 1024, // slightly over 10 MB to let Python reject it
      }
    );
    return response.data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;

    // Python returned a structured error response
    if (axiosErr.response) {
      const status = axiosErr.response.status;
      const detail = axiosErr.response.data?.detail ?? 'Unknown error from AI service';
      const error: LinkedInServiceError = { status, message: detail };
      throw error;
    }

    // Network / timeout
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
      const error: LinkedInServiceError = { status: 504, message: 'AI service timeout' };
      throw error;
    }

    // Unreachable service
    const error: LinkedInServiceError = { status: 500, message: 'Internal server error' };
    throw error;
  }
}
