import { useTransition } from 'react';
import { toast } from 'sonner';

import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';

import { giveMarketingConsentCommand, withdrawMarketingConsentCommand } from '../dal/commands';

export function useMarketingActions() {
  const [isPending, startTransition] = useTransition();
  const { unauthorizedToast } = useUnauthorizedToast();

  const handleMarketingToggle = (nextValue: boolean, setConsent: (consent: boolean) => void) => {
    startTransition(async () => {
      const [error] = nextValue
        ? await giveMarketingConsentCommand()
        : await withdrawMarketingConsentCommand();

      if (error) {
        switch (error.type) {
          case 'Unauthorized': {
            unauthorizedToast();
            break;
          }
          case 'AlreadyActive':
          case 'NoActiveConsent': {
            break;
          }
          default: {
            toast.error(
              nextValue
                ? 'Nie udało się udzielić zgody marketingowej.'
                : 'Nie udało się wycofać zgody marketingowej.'
            );
            break;
          }
        }
        setConsent(!nextValue);
        return;
      }

      toast.success(
        nextValue
          ? 'Zgody marketingowe włączone. Będziemy w kontakcie!'
          : 'Zgody marketingowe zostały wycofane.'
      );
      setConsent(nextValue);
    });
  };

  return {
    handleMarketingToggle,
    isPending,
  };
}
