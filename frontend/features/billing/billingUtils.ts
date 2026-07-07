import { BadgeProps } from '@/components/ui/badge';

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
