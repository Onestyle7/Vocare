'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function BillingErrorToast() {
  useEffect(() => {
    toast.error('Nie udało się pobrać statusu tokenów i subskrypcji.');
  }, []);

  return null;
}
