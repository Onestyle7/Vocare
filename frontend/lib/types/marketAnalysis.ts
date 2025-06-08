export interface CareerStatisticsDto {
  careerName: string;
  averageSalaryMin: number;
  averageSalaryMax: number;
  employmentRate: number;
  growthForecast: string;
  lastUpdated: string;
}

export interface IndustryStatisticsDto {
  industry: string;
  minSalary: number;
  maxSalary: number;
  employmentRate: number;
  growthForecast: string;
}

export interface MarketTrendsDto {
  trendName: string;
  description: string;
  impact: string;
}

export interface SkillDemandDto {
  skill: string;
  demandLevel: string;
  industry: string;
}

export interface MarketAnalysisDetailsDto {
  industryStatistics: IndustryStatisticsDto[];
  skillDemand: SkillDemandDto[];
  marketTrends: MarketTrendsDto[];
}

export interface MarketAnalysisResponseDto {
  marketAnalysis: MarketAnalysisDetailsDto;
}
