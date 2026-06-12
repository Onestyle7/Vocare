import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const dashboardApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/Dashboard`,
});

export type UserProfileSummaryResult = {
  recommendationsCount: number;
  analysisCount: number;
  roadmapsCount: number;
  cvsCount: number;
  profileCompletionPercentage: number;
  salaryProgressDto: SalaryProgressResult;
};

export type SalaryProgressResult = {
  currentSalary: number;
  expectedSalary: number;
  goalCompletionPercentage: number;
};

export type UserAttributesResult = {
  practicalExperience: number;
  hardCompetencies: number;
  creativity: number;
  teamwork: number;
  independence: number;
  softCompetencies: number;
  certification: number;
  technicalSkills: number;
};
