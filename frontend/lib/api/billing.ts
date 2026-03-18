import { api } from '@/lib/api';

type ReqOpts = { signal?: AbortSignal };

export interface SubscriptionStatusDto {
  subscriptionStatus: string;
  subscriptionLevel: string;
  subscriptionEndDate: string | null;
  subscriptionId: string | null;
}

export const getSubscriptionStatus = async (opts?: ReqOpts): Promise<SubscriptionStatusDto> => {
  const { data } = await api.get('/api/Billing/subscription-status', {
    signal: opts?.signal,
  });

  return data;
};
