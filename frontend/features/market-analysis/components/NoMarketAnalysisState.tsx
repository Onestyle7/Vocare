'use client';

import { ArrowRight, BarChart3, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { MARKET_ANALYSIS_PRICE } from '@/features/billing/constants';
import type { ServiceCostActionResult } from '@/features/billing/types';

import { GridBackgroundDemo } from './GridBackgroundDemo';
import MarketAnalysisCostConfirmationDialog from './MarketAnalysisCostConfirmationDialog';

interface NoMarketAnalysisStateProps {
  requiresCareerPaths?: boolean;
  onOpenAdvisor: () => void;
  onGenerate: () => Promise<ServiceCostActionResult>;
}

export default function NoMarketAnalysisState({
  requiresCareerPaths,
  onOpenAdvisor,
  onGenerate,
}: NoMarketAnalysisStateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasActiveSubscription: hasUnlimitedAccess } = useTokenBalanceContext();

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
                      Twoja analiza rynku
                    </h2>
                    <p className="text-muted-foreground max-w-xl text-left text-lg leading-relaxed tracking-tight lg:max-w-lg">
                      Szczegółowa analiza rynku pracy dopasowana do Twojego profilu zawodowego.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed">
                    <BarChart3 className="text-muted-foreground mb-4 h-12 w-12" />

                    {requiresCareerPaths ? (
                      <>
                        <h3 className="mb-2 text-lg font-medium">Brak rekomendacji kariery</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm leading-relaxed">
                          Aby wygenerować analizę rynku, najpierw wygeneruj rekomendacje w Doradcy
                          AI.
                        </p>
                        <Button className="gap-2" onClick={onOpenAdvisor}>
                          <ArrowRight className="h-4 w-4" />
                          Przejdź do Doradcy
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="mb-2 text-lg font-medium">Brak analizy rynku</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm leading-relaxed">
                          Wygeneruj szczegółową analizę rynku pracy na podstawie Twoich rekomendacji
                          kariery.
                        </p>
                        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                          <Plus className="h-4 w-4" />
                          Wygeneruj
                          {!hasUnlimitedAccess && (
                            <span className="text-xs opacity-70">
                              • {MARKET_ANALYSIS_PRICE} tokenów
                            </span>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketAnalysisCostConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={onGenerate}
      />
    </>
  );
}
