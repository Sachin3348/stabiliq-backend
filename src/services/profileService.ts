import type { JwtPayload } from '../types/auth';

export interface UploadResumeResult {
  success: true;
  fileUrl: string;
  filename: string;
}

export interface AnalyzeResult {
  success: true;
  analysis: {
    resumeScore: number;
    aiReadiness: number;
    skillGaps: string[];
    strengths: string[];
    careerSuggestions: string[];
    keywordOptimization: {
      missingKeywords: string[];
      presentKeywords: string[];
      recommendation: string;
    };
    linkedinOptimization: {
      profileCompleteness: number;
      recommendations: string[];
    };
    analyzedAt: string;
  };
}

export const profileService = {
  getUploadResult(userId: string, filename: string): UploadResumeResult {
    return {
      success: true,
      fileUrl: `/uploads/resumes/${userId}/${filename}`,
      filename,
    };
  },

  analyze(_payload: JwtPayload, _resumeUrl?: string, _linkedinUrl?: string): AnalyzeResult {
    const mockAnalysis = {
      resumeScore: Math.floor(Math.random() * (90 - 60 + 1)) + 60,
      aiReadiness: Math.floor(Math.random() * (85 - 55 + 1)) + 55,
      skillGaps: [
        'Python Programming',
        'Machine Learning Fundamentals',
        'Data Analysis & Visualization',
        'Cloud Computing (AWS/Azure)',
        'Project Management Tools',
      ],
      strengths: [
        'Strong communication skills evident in descriptions',
        'Consistent work history with progressive responsibilities',
        'Good mix of technical and soft skills',
        'Clear achievement statements with quantifiable results',
      ],
      careerSuggestions: [
        'Consider adding specific AI/ML projects to demonstrate hands-on experience',
        'Quantify more achievements with metrics (e.g., "30% increase in efficiency")',
        'Optimize LinkedIn headline to include target role keywords',
        'Add relevant certifications (e.g., AWS, Google Cloud, Coursera AI courses)',
        'Improve resume formatting for better ATS compatibility',
        'Network with professionals in your target industry',
        'Update skills section with current in-demand technologies',
      ],
      keywordOptimization: {
        missingKeywords: ['AI', 'Machine Learning', 'Data Science', 'Python', 'SQL'],
        presentKeywords: ['Project Management', 'Team Leadership', 'Communication'],
        recommendation: 'Add more technical keywords relevant to AI-driven roles',
      },
      linkedinOptimization: {
        profileCompleteness: Math.floor(Math.random() * (95 - 70 + 1)) + 70,
        recommendations: [
          'Add a professional profile photo if missing',
          'Write a compelling headline (beyond job title)',
          'Expand "About" section with career story',
          'Request recommendations from colleagues',
          'Share industry-relevant content regularly',
        ],
      },
      analyzedAt: new Date().toISOString(),
    };
    return { success: true, analysis: mockAnalysis };
  },
};
