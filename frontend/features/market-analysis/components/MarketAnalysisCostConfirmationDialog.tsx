'use client';

import { TrendingUp } from 'lucide-react';

import ServiceCostConfirmationDialog from '@/features/billing/components/ServiceCostConfirmationDialog';
import { MARKET_ANALYSIS_PRICE } from '@/features/billing/constants';
import type { ServiceCostActionResult } from '@/features/billing/types';

interface MarketAnalysisCostConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<ServiceCostActionResult>;
}

export default function MarketAnalysisCostConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: MarketAnalysisCostConfirmationDialogProps) {
  return (
    <ServiceCostConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={TrendingUp}
      title="Wygenerować analizę rynku?"
      tokenCost={MARKET_ANALYSIS_PRICE}
      actionLabel="Generuj"
      pendingLabel="Generowanie analizy..."
      errorBackLabel="Wróć do analizy"
      statusLabel="Trwa generowanie analizy rynku."
      errorMessage={
        <>
          Nie udało się potwierdzić wyniku generowania. Przed ponowną próbą sprawdź, czy analiza nie
          została już zapisana.
        </>
      }
      onConfirm={onConfirm}
    />
  );
}
