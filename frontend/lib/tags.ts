export const CACHE_TAGS = {
  subscriptionStatus: (id: string) => `billing-status-${id}`,
} as const;
