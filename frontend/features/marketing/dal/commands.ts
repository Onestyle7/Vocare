'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { giveMarketingConsentService, withdrawMarketingConsentService } from './services';

export async function giveMarketingConsentCommand() {
  const result = await giveMarketingConsentService();

  return result.match(
    async (response) => {
      await invalidateUserTag('marketingConsent');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function withdrawMarketingConsentCommand() {
  const result = await withdrawMarketingConsentService();

  return result.match(
    async (response) => {
      await invalidateUserTag('marketingConsent');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
