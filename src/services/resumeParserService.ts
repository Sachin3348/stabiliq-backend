import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import type { ParsedResume } from '../models/ProfileSubmission';

const RESUME_PARSER_URL = process.env.RESUME_PARSER_URL || 'http://localhost:8080';

// ─── Python microservice response shape ───────────────────────────────────────

interface PythonWorkExperience {
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  bullets: string[];
}

interface PythonProject {
  name: string;
  description: string | null;
  technologies: string[];
  url: string | null;
  bullets: string[];
}

interface PythonParseResumeResponse {
  work_experience: PythonWorkExperience[];
  projects: PythonProject[];
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapToStructured(python: PythonParseResumeResponse): ParsedResume {
  const workExperience = python.work_experience ?? [];
  const projects = python.projects ?? [];

  return {
    experience: workExperience.map((exp) => ({
      company: exp.company ?? '',
      role: exp.role ?? '',
      bullets: (exp.bullets ?? []).map((text) => ({ id: randomUUID(), text })),
    })),
    projects: projects.map((proj) => ({
      name: proj.name ?? '',
      bullets: (proj.bullets ?? []).map((text) => ({ id: randomUUID(), text })),
    })),
  };
}

// ─── optimize-experience ─────────────────────────────────────────────────────

export interface OptimizeExperienceInput {
  role: string;
  company: string;
  bullets: string[];
}

export interface OptimizedBullet {
  original: string;
  suggestions: string[];
}

export interface OptimizeExperienceResult {
  optimized_bullets: OptimizedBullet[];
}

/**
 * Forwards bullet points to the Python AI microservice for optimization.
 * Each bullet gets 4 AI-generated rewrite suggestions.
 */
export async function optimizeExperience(
  input: OptimizeExperienceInput
): Promise<OptimizeExperienceResult> {
  const response = await axios.post<OptimizeExperienceResult>(
    `${RESUME_PARSER_URL}/optimize-experience`,
    input,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );
  return response.data;
}

/**
 * Sends PDF buffer to the Python resume parser microservice.
 * Returns null (without throwing) if the service is unreachable — upload still succeeds.
 */
export async function parseResumeViaPython(
  buffer: Buffer,
  originalname: string
): Promise<ParsedResume | null> {
  try {
    const form = new FormData();
    form.append('file', buffer, {
      filename: originalname,
      contentType: 'application/pdf',
    });

    const response = await axios.post<PythonParseResumeResponse>(
      `${RESUME_PARSER_URL}/parse-resume`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
      }
    );

    return mapToStructured(response.data);
  } catch (err) {
    console.error('[resumeParser] Python parse call failed — saving null parsedResume', err);
    return null;
  }
}

/** Shape Python /api/v2/parse-resume actually returns */

