'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { generateMarketAnalysisService } from './services';

export async function generateMarketAnalysisCommand() {
  const result = await generateMarketAnalysisService();

  return result.match(
    async (response) => {
      await invalidateUserTag('marketAnalysis');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
