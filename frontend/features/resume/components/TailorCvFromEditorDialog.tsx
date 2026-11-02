'use client';

import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import Image from 'next/image';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { ai_magic } from '@/features/marketing/constants';
import { TAILOR_CV_PRICE } from '@/features/resume/constants';
import type { CvLimits } from '@/lib/types/cv';

export type TailorCvMode = 'copy' | 'replace';
export type TailorCvSubmitResult = 'success' | 'limit-reached' | 'insufficient-tokens' | 'error';

type TailorCvScreen = 'form' | 'confirm-replace' | 'confirm-cost';

interface TailorCvFormValues {
  targetPosition: string;
  jobDescription: string;
}

interface TailorCvFromEditorDialogProps {
  open: boolean;
  limits: CvLimits | null;
  currentCvName: string;
  defaultTargetPosition?: string;
  isCheckingLimits: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TailorCvFormValues, mode: TailorCvMode) => Promise<TailorCvSubmitResult>;
  onUpgrade: () => void;
}

const TailorCvFromEditorDialog = ({
  open,
  limits,
  currentCvName,
  defaultTargetPosition,
  isCheckingLimits,
  isSubmitting,
  onOpenChange,
  onSubmit,
  onUpgrade,
}: TailorCvFromEditorDialogProps) => {
  const { tokenBalance, subscriptionStatus, hasActiveSubscription } = useTokenBalanceContext();
  const [screen, setScreen] = useState<TailorCvScreen>('form');
  const [pendingMode, setPendingMode] = useState<TailorCvMode>('copy');
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [limitDetectedDuringSubmit, setLimitDetectedDuringSubmit] = useState(false);
  const [insufficientTokensDetected, setInsufficientTokensDetected] = useState(false);
  const [targetPosition, setTargetPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [submitError, setSubmitError] = useState(false);
  const formTitleRef = useRef<HTMLHeadingElement>(null);
  const confirmTitleRef = useRef<HTMLHeadingElement>(null);
  const costTitleRef = useRef<HTMLHeadingElement>(null);
  const upgradeButtonRef = useRef<HTMLButtonElement>(null);
  const rejectedBillingSnapshotRef = useRef<string | null>(null);
  const submitLockRef = useRef(false);

  // BillingService exempts active and trialing subscriptions from token deductions (HasPremiumAccess).
  const hasUnlimitedTailoring = hasActiveSubscription;
  const hasConfirmedUnlimitedTailoring = hasUnlimitedTailoring && !insufficientTokensDetected;
  const hasEnoughTokens =
    hasConfirmedUnlimitedTailoring ||
    (!insufficientTokensDetected && tokenBalance >= TAILOR_CV_PRICE);
  const billingSnapshot = `${subscriptionStatus}:${tokenBalance}`;

  const isAtLimit =
    limitDetectedDuringSubmit ||
    limits?.canCreateNew === false ||
    Boolean(limits && limits.currentCount >= limits.maxLimit);
  const limitState: 'available' | 'full' | 'unknown' = isAtLimit
    ? 'full'
    : limits
      ? 'available'
      : 'unknown';

  useEffect(() => {
    if (!open) return;
    setScreen('form');
    setPendingMode('copy');
    setCostConfirmed(false);
    setLimitDetectedDuringSubmit(false);
    setInsufficientTokensDetected(false);
    rejectedBillingSnapshotRef.current = null;
    setTargetPosition(defaultTargetPosition?.trim() ?? '');
    setJobDescription('');
    setSubmitError(false);
  }, [defaultTargetPosition, open]);

  useEffect(() => {
    if (!open) return;

    if (screen === 'form') {
      formTitleRef.current?.focus();
    } else if (screen === 'confirm-replace') {
      confirmTitleRef.current?.focus();
    } else {
      costTitleRef.current?.focus();
    }
  }, [open, screen]);

  useEffect(() => {
    if (open && screen === 'confirm-cost' && !hasEnoughTokens) {
      upgradeButtonRef.current?.focus();
    }
  }, [hasEnoughTokens, open, screen]);

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

  const submit = async (mode: TailorCvMode) => {
    if (submitLockRef.current || isCheckingLimits) return;
    submitLockRef.current = true;
    setSubmitError(false);

    try {
      const result = await onSubmit(
        {
          targetPosition: targetPosition.trim(),
          jobDescription: jobDescription.trim(),
        },
        mode
      );

      if (result === 'limit-reached') {
        setLimitDetectedDuringSubmit(true);
        setScreen('confirm-replace');
      } else if (result === 'insufficient-tokens') {
        setPendingMode(mode);
        setCostConfirmed(false);
        rejectedBillingSnapshotRef.current = billingSnapshot;
        setInsufficientTokensDetected(true);
        setScreen('confirm-cost');
      } else if (result === 'error') {
        setCostConfirmed(false);
        setSubmitError(true);
        setScreen('form');
      }
    } catch {
      setCostConfirmed(false);
      setSubmitError(true);
      setScreen('form');
    } finally {
      submitLockRef.current = false;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetPosition.trim() || !jobDescription.trim() || isCheckingLimits || isSubmitting)
      return;

    if (isAtLimit) {
      setCostConfirmed(false);
      setScreen('confirm-replace');
      return;
    }

    setPendingMode('copy');
    setCostConfirmed(false);
    setScreen('confirm-cost');
  };

  const handleBackToForm = () => {
    setCostConfirmed(false);
    setScreen('form');
  };

  const handleRequestReplace = () => {
    if (costConfirmed) {
      void submit('replace');
      return;
    }

    setPendingMode('replace');
    setScreen('confirm-cost');
  };

  const handleConfirmCost = () => {
    if (!hasEnoughTokens || isSubmitting) return;
    setCostConfirmed(true);
    void submit(pendingMode);
  };

  const handleBackFromCost = () => {
    setCostConfirmed(false);
    setScreen(pendingMode === 'replace' ? 'confirm-replace' : 'form');
  };

  const handleUpgrade = () => {
    handleOpenChange(false);
    onUpgrade();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`font-poppins max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[860px] gap-0 overflow-y-auto rounded-3xl border-0 bg-[#17181d] px-6 pt-12 pb-10 text-white sm:max-w-[860px] sm:px-20 sm:pb-12 [&>button]:top-5 [&>button]:right-5 [&>button]:text-white/60 [&>button]:opacity-100 [&>button:hover]:text-white [&>button>svg]:size-6 ${
          isSubmitting ? '[&>button]:pointer-events-none [&>button]:opacity-30' : ''
        }`}
        aria-busy={isCheckingLimits || isSubmitting}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
      >
        {screen === 'form' ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader className="flex w-full items-center gap-2 text-center sm:text-center">
              <DialogTitle
                ref={formTitleRef}
                tabIndex={-1}
                className="text-[28px] leading-tight font-normal text-white focus:outline-none"
              >
                Wygeneruj CV pod ofertę
              </DialogTitle>
              <DialogDescription className="max-w-xl text-[15px] leading-relaxed font-light text-white/75">
                Na podstawie aktualnie otwartego CV przygotujemy wersję dopasowaną do tej oferty.
              </DialogDescription>
            </DialogHeader>

            {limitState === 'unknown' && (
              <div
                className="mt-7 flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-50"
                aria-live="polite"
              >
                <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-300" />
                <div>
                  <p className="font-medium">
                    {isCheckingLimits
                      ? 'Sprawdzamy dostępny limit CV'
                      : 'Nie udało się sprawdzić limitu CV'}
                  </p>
                  <p className="mt-0.5 font-light text-white/70">
                    {isCheckingLimits
                      ? 'Za chwilę pokażemy, czy możemy zapisać nową kopię.'
                      : 'Spróbujemy utworzyć osobną kopię. Jeśli limit jest pełny, poprosimy o potwierdzenie przed zmianą aktualnego CV.'}
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-50"
              >
                Operacja nie została potwierdzona. Przed ponowną próbą sprawdź listę CV i jego
                aktualną treść.
              </div>
            )}

            {(isCheckingLimits || isSubmitting) && (
              <p role="status" className="sr-only">
                {isCheckingLimits
                  ? 'Trwa sprawdzanie limitu CV.'
                  : 'Trwa generowanie CV pod ofertę.'}
              </p>
            )}

            <div className="mt-7 grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="editor-target-position" className="text-white/60">
                  Tytuł stanowiska
                </Label>
                <Input
                  id="editor-target-position"
                  value={targetPosition}
                  onChange={(event) => setTargetPosition(event.target.value)}
                  placeholder="Frontend Developer"
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                  className="h-14 rounded-2xl border-0 bg-[#292a30] px-5 text-white placeholder:text-white/25 focus-visible:ring-2 focus-visible:ring-[#8b92ff]/70 dark:bg-[#292a30]"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="editor-job-description" className="text-white/60">
                    Opis oferty
                  </Label>
                  <span id="editor-job-description-count" className="text-xs text-white/60">
                    {jobDescription.length}/15000
                  </span>
                </div>
                <Textarea
                  id="editor-job-description"
                  aria-describedby={
                    limitState === 'available'
                      ? 'editor-job-description-count editor-copy-safety-note'
                      : limitState === 'full'
                        ? 'editor-job-description-count editor-cv-limit-note'
                        : 'editor-job-description-count'
                  }
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Wklej tutaj treść oferty pracy..."
                  maxLength={15000}
                  required
                  disabled={isSubmitting}
                  className="field-sizing-fixed h-36 max-h-36 min-h-36 resize-none overflow-y-auto rounded-2xl border-0 bg-[#292a30] px-5 py-4 text-white placeholder:text-white/25 focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-[#8b92ff]/70 focus-visible:ring-offset-0 focus-visible:outline-none dark:bg-[#292a30]"
                />
                {limitState === 'available' && (
                  <p
                    id="editor-copy-safety-note"
                    className="text-xs leading-relaxed font-light text-white/60"
                  >
                    Aktualne CV nie zostanie zastąpione. Nową wersję zapiszemy jako osobne CV i
                    dopiero ją dopasujemy do oferty.
                  </p>
                )}
                {limitState === 'full' && (
                  <p
                    id="editor-cv-limit-note"
                    className="text-xs leading-relaxed font-light text-white/60"
                  >
                    Limit CV wykorzystany
                    {limits && !limitDetectedDuringSubmit
                      ? ` · ${limits.currentCount}/${limits.maxLimit}`
                      : ''}
                    . Nie możemy zapisać kolejnej kopii. Możesz zastąpić obecne CV albo zwiększyć
                    limit.
                  </p>
                )}
              </div>

              <div className="mt-2 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
                {isAtLimit ? (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleUpgrade}
                    disabled={isSubmitting}
                    className="h-12 justify-start px-0 text-white/70 hover:text-white"
                  >
                    Zwiększ limit CV
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                    className="h-12 w-full min-w-32 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    variant={isAtLimit ? 'destructive' : 'default'}
                    disabled={
                      isCheckingLimits ||
                      isSubmitting ||
                      !targetPosition.trim() ||
                      !jobDescription.trim()
                    }
                    className={`h-12 w-full min-w-44 text-white sm:w-auto ${
                      isAtLimit ? '' : 'bg-[#686fde] hover:bg-[#7379e5]'
                    }`}
                  >
                    {isCheckingLimits
                      ? 'Sprawdzanie limitu...'
                      : isSubmitting
                        ? isAtLimit
                          ? 'Dopasowywanie CV...'
                          : 'Tworzenie kopii...'
                        : isAtLimit
                          ? 'Zastąp obecne CV'
                          : 'Stwórz CV pod ofertę'}
                    {!isCheckingLimits && !isSubmitting && <ChevronRight aria-hidden="true" />}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : screen === 'confirm-replace' ? (
          <div>
            <DialogHeader className="flex w-full items-center gap-3 text-center sm:text-center">
              <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <AlertTriangle aria-hidden="true" className="size-7" />
              </div>
              <DialogTitle
                ref={confirmTitleRef}
                tabIndex={-1}
                className="text-[26px] leading-tight font-normal text-white focus:outline-none"
              >
                Zastąpić „{currentCvName}”?
              </DialogTitle>
              <DialogDescription className="max-w-xl text-[15px] leading-relaxed font-light text-white/70">
                Aktualna treść tego CV zostanie zastąpiona wersją dopasowaną do stanowiska „
                {targetPosition.trim()}”. Poprzedniej wersji nie będzie można przywrócić.
              </DialogDescription>
            </DialogHeader>

            {/* <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-center text-sm font-light text-white/75">
              Najpierw wygenerujemy nową treść. Aktualne CV zostanie nadpisane dopiero po otrzymaniu
              wyniku.
            </div> */}

            {isSubmitting && (
              <p role="status" className="sr-only">
                Trwa dopasowywanie aktualnego CV.
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="link"
                onClick={handleUpgrade}
                disabled={isSubmitting}
                className="h-12 justify-start px-0 text-white/70 hover:text-white"
              >
                Zwiększ limit CV
              </Button>

              <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToForm}
                  disabled={isSubmitting}
                  className="h-12 w-full min-w-32 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
                >
                  <ChevronLeft aria-hidden="true" />
                  Wróć
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRequestReplace}
                  disabled={isSubmitting}
                  className="h-12 w-full min-w-44 sm:w-auto"
                >
                  {isSubmitting ? 'Dopasowywanie CV...' : 'Tak, zastąp CV'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <DialogHeader className="flex w-full items-center gap-3 text-center sm:text-center">
              <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-[#686fde]/15 text-[#9da3ff]">
                <BriefcaseBusiness aria-hidden="true" className="size-7" />
              </div>
              <DialogTitle
                ref={costTitleRef}
                tabIndex={-1}
                className="text-[26px] leading-tight font-normal text-white focus:outline-none"
              >
                Wygenerować CV pod ofertę?
              </DialogTitle>
              <DialogDescription className="max-w-xl text-[15px] leading-relaxed font-light text-white/70">
                {hasConfirmedUnlimitedTailoring ? (
                  <>Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.</>
                ) : (
                  <>
                    Zostanie pobrane{' '}
                    <strong className="font-medium text-[#9da3ff]">
                      {TAILOR_CV_PRICE} tokenów
                    </strong>{' '}
                    z Twojego konta.
                  </>
                )}
                {pendingMode === 'replace' && (
                  <span className="mt-2 block text-white/60">
                    Po wygenerowaniu zastąpimy „{currentCvName}”.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {!hasEnoughTokens && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-center text-sm font-light text-red-50"
              >
                {insufficientTokensDetected
                  ? `Saldo tokenów zmieniło się. Potrzebujesz ${TAILOR_CV_PRICE} tokenów, aby wygenerować CV.`
                  : `Niewystarczające saldo (${tokenBalance}/${TAILOR_CV_PRICE} tokenów)`}
              </div>
            )}

            {isSubmitting && (
              <p role="status" className="sr-only">
                Trwa generowanie CV pod ofertę.
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackFromCost}
                disabled={isSubmitting}
                className="h-12 w-full min-w-32 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
              >
                <ChevronLeft aria-hidden="true" />
                Wróć
              </Button>

              {!hasEnoughTokens ? (
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
                  onClick={handleConfirmCost}
                  disabled={isSubmitting}
                  className="h-12 w-full min-w-44 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
                >
                  {isSubmitting
                    ? 'Generowanie CV...'
                    : pendingMode === 'replace'
                      ? 'Generuj i zastąp CV'
                      : 'Generuj'}
                  {!isSubmitting && (
                    <Image
                      src={ai_magic}
                      width={22}
                      height={22}
                      alt="icon_ai"
                      className="invert"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TailorCvFromEditorDialog;
