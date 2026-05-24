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
} as const;

export async function invalidateUserTag(tag: keyof typeof CACHE_TAGS) {
  const userId = getUserFromCookie(await cookies());
  if (userId) {
    revalidateTag(CACHE_TAGS[tag](userId), { expire: 0 });
  }
}
