'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { generateMarketAnalysisService } from './services';

export async function generateMarketAnalysisCommand() {
  const result = await generateMarketAnalysisService();
  const invalidateGenerationState = () =>
    invalidateUserTag(['marketAnalysis', 'subscriptionStatus', 'profileStats']);

  return result.match(
    async (response) => {
      await invalidateGenerationState();
      return actionOk(response);
    },
    async (error) => {
      // Analiza jest zapisywana przed końcowym rozliczeniem tokenów. Odświeżamy
      // dane również po błędzie, bo zapis lub aktualizacja licznika mogły już zajść.
      await invalidateGenerationState();
      return actionErr(error);
    }
  );
}
