import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

import { getUserFromCookie } from './utils/get-user-from-cookie';

export const CACHE_TAGS = {
  subscriptionStatus: (id: string) => `billing-status-${id}`,
  userProfile: (id: string) => `user-profile-${id}`,
} as const;

export async function invalidateUserTag(tag: keyof typeof CACHE_TAGS) {
  const userId = getUserFromCookie(await cookies());
  if (userId) {
    revalidateTag(CACHE_TAGS[tag](userId), { expire: 0 });
  }
}
