// ─── LinkedIn Review response types ──────────────────────────────────────────

export interface HeadlineScore {
  score: number;
  issues: string[];
  optimized_example: string;
}

export interface SummaryScore {
  score: number;
  issues: string[];
  optimized_example: string;
}

export interface ExperienceScore {
  score: number;
  issues: string[];
  optimized_example: string;
}

export interface KeywordsScore {
  score: number;
  missing_keywords: string[];
  recommendations: string[];
}

export interface PositioningScore {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface CompletenessScore {
  score: number;
  missing_sections: string[];
  recommendations: string[];
}

export interface SearchabilityScore {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface SectionScores {
  headline: HeadlineScore;
  summary: SummaryScore;
  experience: ExperienceScore;
  keywords: KeywordsScore;
  positioning: PositioningScore;
  completeness: CompletenessScore;
  searchability: SearchabilityScore;
}

export interface LinkedInEvaluation {
  detected_domain: string;
  seniority_level: string;
  primary_specialization: string;
  overall_score: number;
  market_competitiveness: string;
  current_market_signal: string;
  biggest_problem: string;
  highest_roi_fix: string;
  section_scores: SectionScores;
  top_3_improvements: [string, string, string];
}

export interface LinkedInReviewResponse {
  success: boolean;
  data: LinkedInEvaluation;
}
