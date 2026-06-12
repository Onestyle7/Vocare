import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const dashboardApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/Dashboard`,
});

export type UserProfileSummaryResult = {
  recommendationsCount: number;
  analysisCount: number;
  roadmapCount: number;
  cvsCount: number;
  profileCompletionPercentage: number;
  salaryProgress: SalaryProgressResult;
};

export type SalaryProgressResult = {
  currentSalary: number;
  expectedSalary: number;
  goalCompletionPercentage: number;
};
