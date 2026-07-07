'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { star_generate } from '@/features/marketing/constants';

const GENERATE_PRICE = 60;

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
  const { tokenBalance, hasActiveSubscription } = useTokenBalanceContext();

  const hasEnoughTokens =
    hasActiveSubscription || (typeof tokenBalance === 'number' && tokenBalance >= GENERATE_PRICE);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="font-grotesk mx-auto max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-xl font-bold">
            Wygenerować nowe rekomendacje?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground text-center">
            Twój profil został zaktualizowany. Wygeneruj nowe rekomendacje kariery AI dopasowane do
            aktualnego profilu.
            {!hasActiveSubscription && (
              <span className="mt-2 block">
                Koszt: <b className="text-[#915EFF]">{GENERATE_PRICE} tokenów</b>
              </span>
            )}
            {hasActiveSubscription && (
              <span className="mt-2 block text-sm text-green-600 dark:text-green-400">
                Aktywna subskrybcja
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 flex flex-row justify-center gap-4 sm:justify-center">
          <AlertDialogCancel onClick={onSkip} className="border-muted-foreground/20 w-[130px]">
            Nie teraz
          </AlertDialogCancel>

          {!hasEnoughTokens ? (
            <Link href="/pricing">
              <AlertDialogAction
                className="group bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                onClick={onSkip}
              >
                Zdobądź tokeny
                <ArrowRight className="scale-90 transition-all ease-in-out group-hover:translate-x-2" />
              </AlertDialogAction>
            </Link>
          ) : (
            <AlertDialogAction
              onClick={onGenerate}
              className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
            >
              Wygeneruj
              <Image src={star_generate} alt="star" width={16} height={16} />
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
