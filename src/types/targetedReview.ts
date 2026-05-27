export interface OptimizedBullet {
  original: string;
  optimized: string;
  reason: string;
}

export interface SectionDetail {
  score: number;
  max_score: number;
  issues: string[];
  strengths: string[];
  jd_alignment_feedback: string;
  recruiter_perception: string;
  optimized_example: string;
  improvement_suggestions: string[];
}

export interface GapAnalysis {
  matched_skills: string[];
  missing_skills: string[];
  weak_match_areas: string[];
  overrepresented_skills: string[];
  underrepresented_requirements: string[];
}

export interface KeywordAnalysis {
  keyword_match_percentage: number;
  missing_keywords: string[];
  high_priority_keywords: string[];
  ats_risk_factors: string[];
  keyword_integration_suggestions: string[];
}

export interface ExperienceAnalysis {
  experience_alignment_score: number;
  recruiter_confidence: string;
  missing_proof_points: string[];
  optimized_bullets: OptimizedBullet[];
}

export interface ProjectAnalysis {
  project_relevance_score: number;
  technical_depth_assessment: string;
  missing_project_signals: string[];
  suggested_projects_to_add: string[];
}

export interface SectionScores {
  headline: SectionDetail;
  summary: SectionDetail;
  experience: SectionDetail;
  projects: SectionDetail;
  skills: SectionDetail;
  ats_optimization: SectionDetail;
  keyword_optimization: SectionDetail;
  recruiter_readiness: SectionDetail;
}

export interface RecruiterPsychology {
  first_impression: string;
  ownership_signals: string;
  differentiation_assessment: string;
  red_flags: string[];
  hidden_strengths: string[];
  hiring_probability_narrative: string;
}

export interface RewriteSuggestions {
  headline: string;
  summary: string;
  skills_positioning: string;
  experience_bullets: OptimizedBullet[];
}

export interface StrategicInsights {
  biggest_problem: string;
  highest_roi_fix: string;
  top_3_improvements: [string, string, string];
  fastest_score_boosters: string[];
  recruiter_red_flags: string[];
  missing_proof_points: string[];
  hidden_strengths: string[];
}

export interface EducationalInsight {
  title: string;
  explanation: string;
  why_it_matters: string;
  actionable_tip: string;
}

export interface TargetedReviewData {
  overall_match_score: number;
  ats_match_score: number;
  recruiter_match_score: number;
  technical_alignment_score: number;
  experience_relevance_score: number;
  competitiveness_score: number;
  hiring_probability_estimate: string;
  detected_domain: string;
  target_role_alignment: string;
  seniority_fit: string;
  market_competitiveness: string;
  current_market_signal: string;
  gap_analysis: GapAnalysis;
  keyword_analysis: KeywordAnalysis;
  experience_analysis: ExperienceAnalysis;
  project_analysis: ProjectAnalysis;
  section_scores: SectionScores;
  recruiter_psychology: RecruiterPsychology;
  rewrite_suggestions: RewriteSuggestions;
  strategic_insights: StrategicInsights;
  educational_insights: EducationalInsight[];
}

// TargetedReviewRequest removed — request is now multipart/form-data

export interface TargetedReviewResponse {
  success: boolean;
  data: TargetedReviewData;
}
