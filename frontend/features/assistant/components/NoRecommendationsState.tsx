'use client';

import { BriefcaseBusiness, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import ServiceCostConfirmationDialog from '@/features/billing/components/ServiceCostConfirmationDialog';
import { ASSISTANT_RECOMMENDATIONS_PRICE } from '@/features/billing/constants';
import type { ServiceCostActionResult } from '@/features/billing/types';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';

interface NoRecommendationsStateProps {
  onGenerate: () => Promise<ServiceCostActionResult> | ServiceCostActionResult;
}

export default function NoRecommendationsState({ onGenerate }: NoRecommendationsStateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen">
        <div className="font-grotesk relative">
          <GridBackgroundDemo />
          <div className="relative z-10 w-full">
            <div className="container mx-auto p-4">
              <div className="flex flex-col gap-10">
                <div className="flex flex-col items-start gap-4">
                  <div className="flex flex-col gap-2">
                    <h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
                      Twoje rekomendacje
                    </h2>
                    <p className="text-muted-foreground max-w-xl text-left text-lg leading-relaxed tracking-tight lg:max-w-lg">
                      Spersonalizowane rekomendacje kariery AI dopasowane do Twojego profilu.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed">
                    <BriefcaseBusiness className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-medium">Brak aktualnych rekomendacji</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
                      Wygeneruj rekomendacje kariery AI i odkryj idealną ścieżkę zawodową.
                    </p>
                    <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Wygeneruj
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceCostConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        icon={BriefcaseBusiness}
        title="Wygenerować rekomendacje?"
        tokenCost={ASSISTANT_RECOMMENDATIONS_PRICE}
        actionLabel="Generuj"
        pendingLabel="Generowanie..."
        errorBackLabel="Wróć do Asystenta"
        statusLabel="Trwa generowanie rekomendacji."
        errorMessage="Nie udało się potwierdzić wyniku generowania. Sprawdź, czy rekomendacje nie zostały już zapisane."
        onConfirm={onGenerate}
      />
    </>
  );
}
