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

export type ConsentDiscount = {
  percentOff: number;
  expiresAt: string;
};

export type SubscriptionTokenStatusResult = {
  tokenBalance: number;
  subscriptionStatus: SubscriptionStatus;
  // null gdy trial jest wyłączony lub użytkownik miał już subskrypcję
  trialDays: number | null;
  // Rabat na pakiet tokenów za zgodę marketingową (null = brak aktywnego rabatu)
  consentDiscount: ConsentDiscount | null;
};

// Trwający okres próbny – dane ze Stripe, bo to on pobierze pierwszą płatność
export type TrialSummary = {
  trialEnd: string;
  // W groszach; null gdy Stripe nie zwrócił ceny
  nextPaymentAmount: number | null;
  currency: string | null;
  interval: string;
  intervalCount: number;
  // Anulowana w trialu – po jego końcu nic nie pobierzemy
  cancelAtPeriodEnd: boolean;
};

export type SubscriptionDetailsResult = {
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  trial: TrialSummary | null;
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

/**
 * A Stripe Checkout session as verified by the backend (GET /api/billing/checkout-session/{id}),
 * used to report a purchase or a trial start with real amounts. Only the session's owner gets it.
 */
export type CheckoutSessionSummary = {
  sessionId: string;
  status: 'complete' | 'open' | 'expired' | string;
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required' | string;
  mode: 'payment' | 'subscription' | string;
  isTrial: boolean;
  // After discounts, in PLN (not grosze); 0 for a trial
  amountTotal: number;
  currency: string;
  priceId: string;
  packageName: string;
};
