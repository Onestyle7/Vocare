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
  url: string;
};

export type CustomerPortalResult = {
  url: string;
};

export type SubscriptionTokenStatusResult = {
  tokenBalance: number;
  subscriptionStatus: SubscriptionStatus;
};

export type CancelSubscriptionResult = {
  url: string;
  message: string;
};

export type PaymentHistoryItem = {
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string | null;
  tokenAmount: number | null;
};

export type PaymentHistoryResult = {
  payments: PaymentHistoryItem[];
  count: number;
};
