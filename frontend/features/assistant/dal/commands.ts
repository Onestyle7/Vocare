'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { generateRecommendationsService } from './services';

export async function generateRecommendationsCommand() {
  const result = await generateRecommendationsService();

  return result.match(
    async (response) => {
      await invalidateUserTag([
        'lastRecommendation',
        'jobMatches',
        'subscriptionStatus',
        'profileStats',
      ]);
      return actionOk(response);
    },
    async (error) => {
      // Rekomendacja jest zapisywana przed końcowym rozliczeniem tokenów, więc również
      // odpowiedź błędna może oznaczać, że pojawił się nowy wynik lub zmieniło się saldo.
      await invalidateUserTag([
        'lastRecommendation',
        'jobMatches',
        'subscriptionStatus',
        'profileStats',
      ]);
      return actionErr(error);
    }
  );
}
