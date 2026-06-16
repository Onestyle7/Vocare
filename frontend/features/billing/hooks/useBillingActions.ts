import { useTransition } from 'react';
import { toast } from 'sonner';

import { useAuthContext } from '@/features/auth/components/AuthProvider';
import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';

import { useTokenBalanceContext } from '../components/SubscriptionTokenProvider';
import { BillingType } from '../dal/api';
import { cancelSubscriptionCommand, createCheckout, getCustomerPortalUrl } from '../dal/commands';

export function useBillingActions() {
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription } = useTokenBalanceContext();
  const { unauthorizedToast } = useUnauthorizedToast();

  const alreadySubscribedToast = () => {
    toast.error('Subskrybcja aktywna', {
      description: 'Masz już aktywną subskrypcję. Użyj "Zarządzaj subskrypcją", aby zmienić plan.',
      action: {
        label: 'Zarządzaj subskrybcją',
        onClick: async () => handleCustomerPortal(),
      },
    });
  };

  const handleCustomerPortal = () => {
    if (!isAuthenticated) {
      unauthorizedToast();
      return;
    }

    startTransition(async () => {
      const [error] = await getCustomerPortalUrl();

      if (error) {
        switch (error.type) {
          case 'Unauthorized': {
            unauthorizedToast();
            return;
          }
          case 'PaymentNotFound': {
            toast.error('Nie udało się pobrać historii płatności');
            return;
          }
          case 'GenericApiError': {
            toast.error('Błąd podczas inicjowania płatności');
            return;
          }
          default: {
            throw new Error(`Error: ${error.type satisfies never}. ${error.message}`);
          }
        }
      }
    });
  };

  const handleCheckout = (priceId: string, billingType: BillingType) => {
    if (billingType === 'subscription' && hasActiveSubscription) {
      alreadySubscribedToast();
      return;
    }
    if (!isAuthenticated) {
      unauthorizedToast();
      return;
    }

    startTransition(async () => {
      const [error] = await createCheckout(billingType, { priceId });

      if (error) {
        switch (error.type) {
          case 'Unauthorized': {
            unauthorizedToast();
            return;
          }
          case 'AlreadySubscribedError': {
            alreadySubscribedToast();
            return;
          }
          case 'GenericApiError':
          case 'PaymentInitError':
          case 'PaymentNotFound': {
            toast.error('Błąd podczas inicjowania płatności');
            return;
          }
          default: {
            throw new Error(`Error: ${error.type satisfies never}. ${error.message}`);
          }
        }
      }
    });

    return;
  };

  const handleCancelSubscription = () => {
    if (!isAuthenticated) {
      unauthorizedToast();
      return;
    }

    startTransition(async () => {
      const [error, response] = await cancelSubscriptionCommand();

      if (error) {
        switch (error.type) {
          case 'Unauthorized': {
            unauthorizedToast();
            return;
          }
          case 'NoActiveSubscription': {
            toast.error('Brak aktywnej subskrypcji do anulowania');
            return;
          }
          case 'AlreadyCanceled': {
            toast.error('Subskrypcja jest już anulowana');
            return;
          }
          case 'PaymentNotFound':
          case 'GenericApiError': {
            toast.error('Nie udało się anulować subskrypcji');
            return;
          }
          default: {
            throw new Error(`Error: ${error.type satisfies never}. ${error.message}`);
          }
        }
      }

      if (response && response.url) {
        window.open(response.url, '_blank');
      } else {
        toast.success('Subskrypcja została anulowana pomyślnie');
      }
    });
  };

  return {
    handleCustomerPortal,
    handleCheckout,
    handleCancelSubscription,
    isPending,
  };
}
