import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const marketingApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/marketing`,
});

export type MarketingConsentResponse = {
  hasConsent: boolean;
  consentDate: Date | null;
  consentWithdrawnDate: Date | null;
};
