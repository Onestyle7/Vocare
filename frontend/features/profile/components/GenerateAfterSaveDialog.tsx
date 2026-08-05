'use client';

import { BriefcaseBusiness } from 'lucide-react';

import { ASSISTANT_AUTO_GENERATE_CONFIRMATION_KEY } from '@/features/assistant/constants';
import ServiceCostConfirmationDialog from '@/features/billing/components/ServiceCostConfirmationDialog';
import { ASSISTANT_RECOMMENDATIONS_PRICE } from '@/features/billing/constants';
import type { ServiceCostActionResult } from '@/features/billing/types';

interface GenerateAfterSaveDialogProps {
  open: boolean;
  onGenerate: () => void;
  onSkip: () => void;
}

export default function GenerateAfterSaveDialog({
  open,
  onGenerate,
  onSkip,
}: GenerateAfterSaveDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onSkip();
  };

  const handleConfirm = (): ServiceCostActionResult => {
    try {
      sessionStorage.setItem(ASSISTANT_AUTO_GENERATE_CONFIRMATION_KEY, '1');
      onGenerate();
      return 'success';
    } catch {
      sessionStorage.removeItem(ASSISTANT_AUTO_GENERATE_CONFIRMATION_KEY);
      return 'error';
    }
  };

  return (
    <ServiceCostConfirmationDialog
      open={open}
      onOpenChange={handleOpenChange}
      icon={BriefcaseBusiness}
      title="Wygenerować nowe rekomendacje?"
      tokenCost={ASSISTANT_RECOMMENDATIONS_PRICE}
      actionLabel="Wygeneruj"
      pendingLabel="Przechodzenie..."
      backLabel="Nie teraz"
      errorBackLabel="Wróć do profilu"
      statusLabel="Trwa przechodzenie do Asystenta."
      additionalDescription="Twój profil został zaktualizowany. Wygenerujemy rekomendacje kariery AI dopasowane do aktualnego profilu."
      errorMessage="Nie udało się przejść do Asystenta. Spróbuj ponownie z poziomu profilu."
      onConfirm={handleConfirm}
    />
  );
}
