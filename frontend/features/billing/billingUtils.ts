import { BadgeProps } from '@/components/ui/badge';

import type { ConsentDiscount } from './dal/api';
import type { PricingPlan } from './types';

export type PricingOffers = {
  // null = brak triala (wyłączony albo konto miało już subskrypcję)
  trialDays: number | null;
  consentDiscount: ConsentDiscount | null;
};

/**
 * Dostosowuje kartę planu do ofert użytkownika: trial dla subskrypcji i rabat za zgodę
 * marketingową dla pakietu tokenów. Komunikat o trialu musi jasno mówić, ile i kiedy
 * zapłaci użytkownik (automatyczne odnowienie).
 */
export function applyPricingOffers(plan: PricingPlan, offers: PricingOffers): PricingPlan {
  if (plan.type === 'subscription' && offers.trialDays) {
    return {
      ...plan,
      ctaLabel: `Testuj ${offers.trialDays} dni za darmo`,
      microcopy: `0 zł przez ${offers.trialDays} dni, potem ${plan.price} zł${plan.priceLabel.replace('/ ', '/')}, odnawiane automatycznie.`,
      microcopyEmphasis: 'Anuluj przed końcem okresu próbnego – nie zapłacisz nic.',
      microcopyEmphasisPosition: 'end',
    };
  }

  if (plan.type === 'tokens' && offers.consentDiscount) {
    const { percentOff, expiresAt } = offers.consentDiscount;
    const discountedPrice = Math.round(plan.price * (100 - percentOff)) / 100;
    const validUntil = new Date(expiresAt).toLocaleDateString('pl-PL');

    return {
      ...plan,
      price: discountedPrice,
      priceLabel: `jednorazowo (zamiast ${plan.price} zł)`,
      description: `Rabat -${percentOff}% za zgodę marketingową, ważny do ${validUntil}.`,
    };
  }

  return plan;
}

export const PAYMENT_DATE_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Get bage variant based on payment status */
export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'paid': {
      return 'secondary';
    }
    case 'pending':
    case 'processing':
    case 'open': {
      return 'outline';
    }
    case 'failed':
    case 'canceled': {
      return 'destructive';
    }
    default: {
      return undefined;
    }
  }
}

export function formatPaymentAmount(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return '—';

  const normalizedCurrency = (currency ?? 'USD').toUpperCase();
  const value = amount / 100;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${normalizedCurrency}`;
  }
}

/** Get user-friendly label of payment */
export function getTypeLabel(type: string) {
  switch (type.toLowerCase()) {
    case 'subscription': {
      return 'Subskrypcja';
    }
    case 'token_purchase': {
      return 'Zakup tokenów';
    }
    default: {
      return 'Nieznany typ płatności';
    }
  }
}

/** Get translated status badge */
export function getStatusBadgeText(status: string) {
  switch (status) {
    case 'succeeded':
      return 'sukces';
    default:
      return 'niepowodzenie';
  }
}
