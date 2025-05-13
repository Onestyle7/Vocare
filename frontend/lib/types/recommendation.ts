export interface AiCareerResponse {
  recommendation: {
    primaryPath: string;
    justification: string;
    nextSteps: string[];
    longTermGoal: string;
  };
  careerPaths: CareerPath[];
}

export interface CareerPath {
  careerName: string;
  description: string;
  probability: number;
  requiredSkills: string[];
  recommendedCourses: string[];
  marketAnalysis: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}
