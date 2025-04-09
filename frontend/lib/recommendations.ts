export interface CareerPath {
  careerName: string;
  description: string;
  probability: number;
  requiredSkills: string[];
  marketAnalysis: string[];
  recommendedCourses: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface Recommendation {
  primaryPath: string;
  justification: string;
  nextSteps: string[];
  longTermGoal: string;
}

export interface AiCareerResponse {
  careerPaths: CareerPath[];
  recommendation: Recommendation;
}
