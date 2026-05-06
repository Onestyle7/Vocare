import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const billingApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/billing`,
});

export type BillingType = 'tokens' | 'subscription' | 'individual';
export type SubscriptionStatus = 'None' | 'Active' | 'Trialing' | 'Cancelled' | 'PastDue';

export type CreateSubscriptionCommand = {
  priceId: string;
};

export type CreateSubscriptionResult = {
  Url: string;
};

export type SubscriptionTokenStatusResult = {
  tokenBalance: number;
  subscriptionStatus: SubscriptionStatus;
};
