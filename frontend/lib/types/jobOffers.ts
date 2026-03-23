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

export interface ScoredJobOffer {
  id: string;
  title: string;
  companyName: string;
  url: string;
  category: string;
  seniorityLevel: string;
  briefDescription: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  locations: string[];
  skills: string[];
  publishedAt: string;
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
