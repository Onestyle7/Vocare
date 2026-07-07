'use client';

import { ArrowRight, BriefcaseBusiness, Plus, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import { star_generate } from '@/features/marketing/constants';

const GENERATE_PRICE = 60;

interface NoRecommendationsStateProps {
  onGenerate: () => void;
  autoGenerate?: boolean;
}

export default function NoRecommendationsState({
  onGenerate,
  autoGenerate,
}: NoRecommendationsStateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { tokenBalance, hasActiveSubscription } = useTokenBalanceContext();

  const hasEnoughTokens =
    hasActiveSubscription || (typeof tokenBalance === 'number' && tokenBalance >= GENERATE_PRICE);

  useEffect(() => {
    if (autoGenerate) {
      onGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmGenerate = () => {
    setIsDialogOpen(false);
    onGenerate();
  };

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

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="font-grotesk font-korbin mx-auto max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl font-bold">
              Wygenerować rekomendacje?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-center">
              {!hasActiveSubscription ? (
                <>
                  Zostanie pobrane <b className="text-[#915EFF]">{GENERATE_PRICE} tokenów</b> z
                  Twojego konta.
                  {!hasEnoughTokens && (
                    <p className="mt-2 text-sm text-red-500">
                      Niewystarczające saldo ({tokenBalance}/{GENERATE_PRICE} tokenów)
                    </p>
                  )}
                </>
              ) : (
                <p className="mx-auto max-w-xs">
                  Jesteś na aktywnej subskrypcji, więc ta akcja nie wykorzysta żadnych tokenów.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-8 flex flex-row justify-center gap-4 sm:justify-center">
            <AlertDialogCancel className="border-muted-foreground/20 w-[130px]">
              Anuluj
            </AlertDialogCancel>

            {!hasEnoughTokens ? (
              <Link href="/pricing">
                <AlertDialogAction
                  className="group bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Zdobądź tokeny
                  <ArrowRight className="scale-90 transition-all ease-in-out group-hover:translate-x-2" />
                </AlertDialogAction>
              </Link>
            ) : (
              <AlertDialogAction
                onClick={handleConfirmGenerate}
                className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
              >
                Generuj
                <Image src={star_generate} alt="star" width={16} height={16} />
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
