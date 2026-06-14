import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import type { ParsedResume, ResumeScore } from '../models/ProfileSubmission';

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

interface PythonScoreComponent {
  score: number;
  max_score: number;
  feedback: string;
}

interface PythonScore {
  overall_score: number;
  detected_role: string;
  detected_domain: string;
  impact_score: PythonScoreComponent;
  brevity_score: PythonScoreComponent;
  style_score: PythonScoreComponent;
  skills_score: PythonScoreComponent;
  sections_score: PythonScoreComponent;
  top_issues: string[];
  strengths: string[];
}

interface PythonParseResumeResponse {
  work_experience: PythonWorkExperience[];
  projects: PythonProject[];
  score?: PythonScore;
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapScore(s: PythonScore): ResumeScore {
  const mapComponent = (c: PythonScoreComponent) => ({
    score: c.score,
    maxScore: c.max_score,
    feedback: c.feedback,
  });
  return {
    overallScore: s.overall_score,
    detectedRole: s.detected_role,
    detectedDomain: s.detected_domain,
    impactScore: mapComponent(s.impact_score),
    brevityScore: mapComponent(s.brevity_score),
    styleScore: mapComponent(s.style_score),
    skillsScore: mapComponent(s.skills_score),
    sectionsScore: mapComponent(s.sections_score),
    topIssues: s.top_issues ?? [],
    strengths: s.strengths ?? [],
  };
}

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
export interface ParseResumeResult {
  parsedResume: ParsedResume;
  resumeScore: ResumeScore | null;
  raw: PythonParseResumeResponse;
}

export async function parseResumeViaPython(
  buffer: Buffer,
  originalname: string
): Promise<ParseResumeResult | null> {
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

    return {
      parsedResume: mapToStructured(response.data),
      resumeScore: response.data.score ? mapScore(response.data.score) : null,
      raw: response.data,
    };
  } catch (err) {
    console.error('[resumeParser] Python parse call failed — saving null parsedResume', err);
    return null;
  }
}

/** Shape Python /api/v2/parse-resume actually returns */

