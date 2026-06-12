import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

import { getUserFromCookie } from './utils/get-user-from-cookie';

export const CACHE_TAGS = {
  subscriptionStatus: (id: string) => `subscription-status-${id}`,
  userProfile: (id: string) => `user-profile-${id}`,
  marketingConsent: (id: string) => `marketing-consent-${id}`,
  lastRecommendation: (id: string) => `last-recommendation-${id}`,
  jobMatches: (id: string) => `job-matches-${id}`,
  marketAnalysis: (id: string) => `market-analysis-${id}`,
  userRoadmaps: (id: string) => `user-roadmaps-${id}`,
  roadmap: (id: string) => `roadmap-${id}`,
  userCvs: (id: string) => `user-cvs-${id}`,
  cvLimits: (id: string) => `cv-limits-${id}`,
  cvDetails: (id: string) => `cv-details-${id}`,
  profileStats: (id: string) => `profile-stats-${id}`,
  profileAttributes: (id: string) => `profile-attributes-${id}`,
} as const;

type CacheTag = keyof typeof CACHE_TAGS;

export async function invalidateUserTag(tag: CacheTag): Promise<void>;
export async function invalidateUserTag(tags: CacheTag[]): Promise<void>;
export async function invalidateUserTag(target: CacheTag | CacheTag[]) {
  const userId = getUserFromCookie(await cookies());
  if (!userId) return;

  const tags = [target].flat();

  tags.forEach((tag) => {
    revalidateTag(CACHE_TAGS[tag](userId), { expire: 0 });
  });
}
