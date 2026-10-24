export interface MatchDetails {
  semanticScore: number;
  skillScore: number;
  matchedSkills: string[];
  userMatchedSkills: string[];
  partialMatches: string[];
  missingSkills: string[];
  bonusFactors: string[];
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'very_low';

export type JobOfferSource = 'NofluffJobs' | 'SolidJobs';

export type SalaryPeriod = 'Hour' | 'Day' | 'Month' | 'Year';

export interface ScoredJobOffer {
  id: string;
  title: string;
  companyName: string;
  url: string;
  category: string;
  seniorityLevel: string;
  briefDescription: string;
  /** Początek pełnego opisu (HTML, ucięty na backendzie) - fallback, gdy brief jest pusty lub bezużyteczny. */
  descriptionPreview?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: SalaryPeriod | null;
  locations: string[];
  skills: string[];
  publishedAt: string;
  source?: JobOfferSource;
  matchScore: number;
  confidenceLevel: ConfidenceLevel;
  matchDetails: MatchDetails;
}

export interface CareerPathMatchResult {
  careerPathId: string;
  careerPathName: string;
  requiredSkills: string[];
  matchedOffers: ScoredJobOffer[];
  averageMatchScore: number;
  highQualityMatches: number;
  totalOffersInCategory: number;
  dataQualityWarning?: string | null;
}
