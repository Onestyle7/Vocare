'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { generateRecommendationsService } from './services';

export async function generateRecommendationsCommand() {
  const result = await generateRecommendationsService();

  return result.match(
    async (response) => {
      await invalidateUserTag('lastRecommendation');
      await invalidateUserTag('jobMatches');
      await invalidateUserTag('subscriptionStatus');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
