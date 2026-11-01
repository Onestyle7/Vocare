import type { BillingType } from './dal/api';

export type SubscriptionStatuses = 'None' | 'Active' | 'Trialing' | 'Cancelled' | 'PastDue';

export type ServiceCostActionResult = 'success' | 'insufficient-tokens' | 'handled-error' | 'error';

export type PricingFeature = {
  text: string;
  alternative?: boolean;
};

export type PricingPlan = {
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  featuresIntro?: string;
  features: readonly PricingFeature[];
  commitment?: string;
  ctaLabel: string;
  microcopy: string;
  microcopyEmphasis?: string;
  microcopyEmphasisPosition?: 'start' | 'end';
  popular: boolean;
  // Aktywny rabat (np. za zgodę marketingową) – karta wyróżnia go na fioletowo
  discount?: { percentOff: number; originalPrice: number };
} & (
  | { type: 'free'; priceId?: never }
  | { type: Extract<BillingType, 'tokens' | 'subscription'>; priceId: string }
);
