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
  salaryProgression?: SalaryProgressionDto[];
  workAttributes?: WorkAttributesDto;
  entryDifficulty?: EntryDifficultyDto;
  aiNarrator?: AiNarratorDto;
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

export interface SalaryProgressionDto {
  careerLevel: string;
  yearsOfExperience?: string;
  minSalary?: number;
  maxSalary?: number;
  averageSalary?: number;
}

export interface WorkAttributesDto {
  stressLevel?: number;
  analyticalThinking?: number;
  creativity?: number;
  teamwork?: number;
  independence?: number;
  routineVsDynamic?: number;
  customerFacing?: number;
  technicalDepth?: number;
}

export interface EntryDifficultyDto {
  difficultyScore?: number;
  difficultyLevel?: string;
  missingSkillsCount?: number;
  missingSkills?: string[];
  matchingSkillsCount?: number;
  estimatedTimeToReady?: string;
  explanation?: string;
}

export interface AiNarratorDto {
  salaryInsight?: string;
  workStyleInsight?: string;
  entryAdvice?: string;
  motivationalMessage?: string;
  personalizedRecommendation?: string;
}

export interface MarketAnalysisDetailsDto {
  industryStatistics: IndustryStatisticsDto[];
  skillDemand: SkillDemandDto[];
  marketTrends: MarketTrendsDto[];
}

export interface MarketAnalysisResponseDto {
  marketAnalysis: MarketAnalysisDetailsDto;
}
