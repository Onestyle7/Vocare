import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const marketingApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/Marketing`,
});

export type MarketingConsentResponse = {
  hasConsent: boolean;
  consentDate: string | null;
  consentWithdrawnDate: string | null;
};
