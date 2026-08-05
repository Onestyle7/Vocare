'use client';

import { ArrowRight, ChevronLeft, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ai_magic } from '@/features/marketing/constants';

import type { ServiceCostActionResult } from '../types';
import { useTokenBalanceContext } from './SubscriptionTokenProvider';

interface ServiceCostConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  tokenCost: number;
  actionLabel?: string;
  pendingLabel?: string;
  backLabel?: string;
  errorBackLabel?: string;
  statusLabel?: string;
  freeDescription?: ReactNode;
  additionalDescription?: ReactNode;
  errorMessage?: ReactNode;
  onBack?: () => void;
  onConfirm: () => Promise<ServiceCostActionResult> | ServiceCostActionResult;
}

export default function ServiceCostConfirmationDialog({
  open,
  onOpenChange,
  icon: ServiceIcon,
  title,
  tokenCost,
  actionLabel = 'Generuj',
  pendingLabel = 'Generowanie...',
  backLabel = 'Wróć',
  errorBackLabel = 'Wróć do modułu',
  statusLabel = 'Trwa generowanie.',
  freeDescription = 'Ta akcja nie wykorzysta żadnych tokenów.',
  additionalDescription,
  errorMessage = (
    <>
      Nie udało się potwierdzić wyniku operacji. Przed ponowną próbą sprawdź, czy nowy wynik nie
      został już zapisany.
    </>
  ),
  onBack,
  onConfirm,
}: ServiceCostConfirmationDialogProps) {
  const router = useRouter();
  const { tokenBalance, subscriptionStatus } = useTokenBalanceContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insufficientTokensDetected, setInsufficientTokensDetected] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const upgradeButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const rejectedBillingSnapshotRef = useRef<string | null>(null);
  const submitLockRef = useRef(false);
  const returnFocusElementRef = useRef<HTMLElement | null>(null);

  // BillingService zwalnia z kosztu wyłącznie dokładny status Active.
  const hasUnlimitedAccess = subscriptionStatus === 'Active';
  const isFreeService = tokenCost === 0;
  const hasEnoughTokens =
    !insufficientTokensDetected &&
    (isFreeService || hasUnlimitedAccess || tokenBalance >= tokenCost);
  const billingSnapshot = `${subscriptionStatus}:${tokenBalance}:${tokenCost}`;

  useEffect(() => {
    if (!open) return;
    setIsSubmitting(false);
    setInsufficientTokensDetected(false);
    setSubmitError(false);
    rejectedBillingSnapshotRef.current = null;
    submitLockRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (submitError) {
      backButtonRef.current?.focus();
    } else if (!hasEnoughTokens) {
      upgradeButtonRef.current?.focus();
    } else {
      titleRef.current?.focus();
    }
  }, [hasEnoughTokens, open, submitError]);

  useEffect(() => {
    if (
      insufficientTokensDetected &&
      rejectedBillingSnapshotRef.current &&
      rejectedBillingSnapshotRef.current !== billingSnapshot
    ) {
      rejectedBillingSnapshotRef.current = null;
      setInsufficientTokensDetected(false);
    }
  }, [billingSnapshot, insufficientTokensDetected]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return;
    onOpenChange(nextOpen);
  };

  const handleBack = () => {
    if (isSubmitting) return;

    if (submitError) {
      onOpenChange(false);
      return;
    }

    if (onBack) {
      onBack();
    } else {
      onOpenChange(false);
    }
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/pricing');
  };

  const handleConfirm = async () => {
    if (submitLockRef.current || isSubmitting || !hasEnoughTokens) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const result = await onConfirm();

      if (result === 'success' || result === 'handled-error') {
        onOpenChange(false);
        return;
      }

      if (result === 'insufficient-tokens') {
        rejectedBillingSnapshotRef.current = billingSnapshot;
        setInsufficientTokensDetected(true);
        router.refresh();
        return;
      }

      setSubmitError(true);
      router.refresh();
    } catch {
      setSubmitError(true);
      router.refresh();
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-busy={isSubmitting}
        onOpenAutoFocus={(event) => {
          event.preventDefault();

          const activeElement = document.activeElement;
          returnFocusElementRef.current =
            activeElement instanceof HTMLElement && activeElement !== document.body
              ? activeElement
              : null;

          if (!hasEnoughTokens) {
            upgradeButtonRef.current?.focus();
          } else {
            titleRef.current?.focus();
          }
        }}
        onCloseAutoFocus={(event) => {
          const returnFocusElement = returnFocusElementRef.current;
          returnFocusElementRef.current = null;

          if (returnFocusElement?.isConnected) {
            event.preventDefault();
            returnFocusElement.focus();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        className={`font-poppins max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[860px] gap-0 overflow-y-auto rounded-3xl border-0 bg-[#17181d] px-6 pt-12 pb-10 text-white sm:max-w-[860px] sm:px-20 sm:pb-12 [&>button]:top-5 [&>button]:right-5 [&>button]:text-white/60 [&>button]:opacity-100 [&>button:hover]:text-white [&>button>svg]:size-6 ${
          isSubmitting ? '[&>button]:pointer-events-none [&>button]:opacity-30' : ''
        }`}
      >
        <DialogHeader className="flex w-full items-center gap-3 text-center sm:text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-[#686fde]/15 text-[#9da3ff]">
            <ServiceIcon aria-hidden="true" className="size-7" />
          </div>
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="text-[26px] leading-tight font-normal text-white focus:outline-none"
          >
            {title}
          </DialogTitle>
          <DialogDescription className="max-w-xl text-[15px] leading-relaxed font-light text-white/70">
            {isFreeService && insufficientTokensDetected ? (
              <>Nie możemy już potwierdzić, że ta akcja jest bezpłatna.</>
            ) : isFreeService ? (
              freeDescription
            ) : hasUnlimitedAccess && !insufficientTokensDetected ? (
              <>Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.</>
            ) : (
              <>
                Zostanie pobrane{' '}
                <strong className="font-medium text-[#9da3ff]">{tokenCost} tokenów</strong> z
                Twojego konta.
              </>
            )}
            {additionalDescription ? (
              <span className="mt-2 block text-white/60">{additionalDescription}</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {!hasEnoughTokens && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-center text-sm font-light text-red-50"
          >
            {insufficientTokensDetected && isFreeService
              ? 'Warunki rozliczenia tej usługi uległy zmianie. Sprawdź dostępne pakiety przed ponowną próbą.'
              : insufficientTokensDetected
                ? `Saldo tokenów zmieniło się. Potrzebujesz ${tokenCost} tokenów, aby wykonać tę akcję.`
                : `Niewystarczające saldo (${tokenBalance}/${tokenCost} tokenów)`}
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-center text-sm font-light text-red-50"
          >
            {errorMessage}
          </div>
        )}

        {isSubmitting && (
          <p role="status" className="sr-only">
            {statusLabel}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row sm:gap-4">
          <Button
            ref={backButtonRef}
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="h-12 w-full min-w-32 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
          >
            {!submitError && <ChevronLeft aria-hidden="true" />}
            {submitError ? errorBackLabel : backLabel}
          </Button>

          {submitError ? null : !hasEnoughTokens ? (
            <Button
              ref={upgradeButtonRef}
              type="button"
              onClick={handleUpgrade}
              className="h-12 w-full min-w-44 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
            >
              Zdobądź tokeny
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              className="h-12 w-full min-w-44 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
            >
              {isSubmitting ? pendingLabel : actionLabel}
              {!isSubmitting && (
                <Image
                  src={ai_magic}
                  width={22}
                  height={22}
                  alt=""
                  className="invert"
                  aria-hidden="true"
                />
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
