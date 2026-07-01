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
import { star_generate } from '@/features/marketing/constants';

interface GenerateRecommendationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveSubscription: boolean;
  tokenBalance: number | null | undefined;
  generatePricePerUse: number;
  onGenerate: () => void;
}

export default function GenerateRecommendationDialog({
  isOpen,
  onOpenChange,
  hasActiveSubscription,
  tokenBalance,
  generatePricePerUse,
  onGenerate,
}: GenerateRecommendationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="font-grotesk font-korbin mx-auto max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-xl font-bold">
            Wygenerować nowe rekomendacje?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground text-center">
            {!hasActiveSubscription ? (
              <>
                Zostanie pobrane{' '}
                <b className="text-[#915EFF]">{generatePricePerUse} tokenów</b> z Twojego konta.
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

          {!hasActiveSubscription &&
          typeof tokenBalance === 'number' &&
          tokenBalance < generatePricePerUse ? (
            <Link href="/pricing">
              <AlertDialogAction
                className="group bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                onClick={() => onOpenChange(false)}
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
              Generuj
              <Image src={star_generate} alt="star" width={16} height={16} />
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
