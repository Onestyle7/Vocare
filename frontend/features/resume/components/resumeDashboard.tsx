'use client';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import { ai_magic, file_document, file_edit } from '@/features/marketing/constants';
import { GENERATE_CV_FROM_PROFILE_PRICE } from '@/features/resume/constants';
import { CvLimits, CvListItemDto } from '@/lib/types/cv';

import { useResumeDashboardActions } from '../hooks/useResumeDashboardActions';

interface ResumeDashboardProps {
  initialCvs: CvListItemDto[];
  initialLimits: CvLimits | null;
  autoOpenCreateDialog?: boolean;
}

type CreateCvSetup = 'choose-method' | 'job-offer' | 'confirm-cost' | 'limit-reached';

/** Czas znikania starej treści — musi być równy klasie duration-200 na wrapperze treści. */
const FADE_MS = 200;
/** Wspólny easing dla resize'u kontenera (wolne wyjście, miękkie dojście). */
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Czas animacji wyjścia Radixa — reset stanu czeka, żeby nie mignął pierwszy krok. */
const EXIT_MS = 220;

const ResumeDashboard = ({
  initialCvs,
  initialLimits,
  autoOpenCreateDialog = false,
}: ResumeDashboardProps) => {
  const router = useRouter();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showCreateCvDialog, setShowCreateCvDialog] = useState(false);

  // Stan docelowy — steruje szerokością/paddingiem modala i zmienia się natychmiast.
  const [createCvSetup, setCreateCvSetup] = useState<CreateCvSetup>('choose-method');
  // Stan renderowany — podmieniany dopiero wtedy, gdy treść jest już niewidoczna.
  const [renderedSetup, setRenderedSetup] = useState<CreateCvSetup>('choose-method');
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [contentHeight, setContentHeight] = useState<number>();

  // Ref jako state, nie useRef: Radix montuje treść w portalu dopiero po pierwszym
  // commicie, więc useLayoutEffect trafiałby na null i nigdy nie zmierzył wysokości.
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [jobOfferForm, setJobOfferForm] = useState({
    targetPosition: '',
    jobDescription: '',
  });
  const [insufficientTokensDetected, setInsufficientTokensDetected] = useState(false);
  const [generateSubmitError, setGenerateSubmitError] = useState(false);
  const jobOfferTitleRef = useRef<HTMLHeadingElement>(null);
  const costTitleRef = useRef<HTMLHeadingElement>(null);
  const limitTitleRef = useRef<HTMLHeadingElement>(null);
  const upgradeButtonRef = useRef<HTMLButtonElement>(null);
  const rejectedBillingSnapshotRef = useRef<string | null>(null);
  const generateLockRef = useRef(false);
  const { tokenBalance, subscriptionStatus } = useTokenBalanceContext();
  const { handleDeleteResume, handleCreateResume, handleGenerateResume, isCreating, isGenerating } =
    useResumeDashboardActions();
  const cvs = initialCvs;
  const limits = initialLimits;

  // BillingService zwalnia z opłaty wyłącznie aktywną subskrypcję.
  const hasUnlimitedGeneration = subscriptionStatus === 'Active';
  const hasConfirmedUnlimitedGeneration = hasUnlimitedGeneration && !insufficientTokensDetected;
  const hasEnoughTokens =
    hasConfirmedUnlimitedGeneration ||
    (!insufficientTokensDetected && tokenBalance >= GENERATE_CV_FROM_PROFILE_PRICE);
  const billingSnapshot = `${subscriptionStatus}:${tokenBalance}`;
  const hasReachedCvLimit = Boolean(
    limits && (!limits.canCreateNew || limits.currentCount >= limits.maxLimit)
  );

  /**
   * Przejście między krokami modala:
   * 1. treść znika (opacity + lekki lift),
   * 2. równolegle kontener animuje max-width / padding / height,
   * 3. po zakończeniu fade-outu podmieniamy treść „pod zasłoną",
   * 4. nowa treść pojawia się ze staggerem na polach formularza.
   */
  const goToSetup = (next: CreateCvSetup) => {
    if (next === renderedSetup) return;

    setIsContentVisible(false);
    setCreateCvSetup(next);

    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => {
      setRenderedSetup(next);
      // Podwójna ramka: pozwala przeglądarce zamalować nową treść w stanie ukrytym,
      // zanim włączymy fade-in (bez tego przejście zostałoby pominięte).
      requestAnimationFrame(() => requestAnimationFrame(() => setIsContentVisible(true)));
    }, FADE_MS);
  };

  useEffect(
    () => () => {
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
    },
    []
  );

  // Mierzymy realną wysokość treści — bez tego nie da się animować height z auto.
  useLayoutEffect(() => {
    if (!contentNode) return;

    const update = () => setContentHeight(contentNode.scrollHeight);
    update();

    // Pierwsze otwarcie potrafi mierzyć fallbackowym fontem — mierzymy ponownie po dociągnięciu.
    document.fonts?.ready.then(update).catch(() => {});

    const observer = new ResizeObserver(update);
    observer.observe(contentNode);
    return () => observer.disconnect();
  }, [contentNode, renderedSetup]);

  useEffect(() => {
    if (showCreateCvDialog && renderedSetup === 'job-offer' && isContentVisible) {
      jobOfferTitleRef.current?.focus();
    }
  }, [isContentVisible, renderedSetup, showCreateCvDialog]);

  useEffect(() => {
    if (
      showCreateCvDialog &&
      renderedSetup === 'confirm-cost' &&
      isContentVisible &&
      hasEnoughTokens
    ) {
      costTitleRef.current?.focus();
    }
  }, [hasEnoughTokens, isContentVisible, renderedSetup, showCreateCvDialog]);

  useEffect(() => {
    if (showCreateCvDialog && renderedSetup === 'limit-reached' && isContentVisible) {
      limitTitleRef.current?.focus();
    }
  }, [isContentVisible, renderedSetup, showCreateCvDialog]);

  useEffect(() => {
    if (
      showCreateCvDialog &&
      renderedSetup === 'confirm-cost' &&
      isContentVisible &&
      !hasEnoughTokens
    ) {
      upgradeButtonRef.current?.focus();
    }
  }, [hasEnoughTokens, isContentVisible, renderedSetup, showCreateCvDialog]);

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

  const resetCreateCvState = () => {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    setCreateCvSetup('choose-method');
    setRenderedSetup('choose-method');
    setIsContentVisible(true);
    setContentHeight(undefined);
    setJobOfferForm({
      targetPosition: '',
      jobDescription: '',
    });
    setInsufficientTokensDetected(false);
    setGenerateSubmitError(false);
    rejectedBillingSnapshotRef.current = null;
    generateLockRef.current = false;
  };

  const handleCreateCvDialogChange = (open: boolean) => {
    if (!open && isGenerating) return;

    setShowCreateCvDialog(open);
    if (resetTimeout.current) clearTimeout(resetTimeout.current);

    if (open) {
      // Ponowne otwarcie przed końcem animacji wyjścia — czyścimy od razu.
      resetCreateCvState();
    } else {
      // Radix trzyma treść zamontowaną przez czas animacji wyjścia; reset przed
      // jej końcem pokazałby na moment pierwszy krok.
      resetTimeout.current = setTimeout(resetCreateCvState, EXIT_MS);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    });
  };

  const getCvBadgeInfo = (createdAt: string, lastModifiedAt: string) => {
    const created = new Date(createdAt);
    const modified = new Date(lastModifiedAt);
    const now = new Date();

    const daysSinceCreated = (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
    const daysSinceModified = (now.getTime() - modified.getTime()) / (24 * 60 * 60 * 1000);
    const timeBetweenCreatedAndModified = (modified.getTime() - created.getTime()) / (60 * 1000); // w minutach

    // Nowe: utworzone max 3 dni temu I nie było znacząco modyfikowane
    if (daysSinceCreated <= 3 && timeBetweenCreatedAndModified < 30) {
      return { label: 'New', variant: 'new' };
    }

    // Zaktualizowane: modyfikowane w ciągu ostatnich 2 dni
    if (daysSinceModified <= 2 && timeBetweenCreatedAndModified >= 30) {
      return { label: 'Zaktualizowano', variant: 'updated' };
    }

    return null;
  };

  const handleNewResumeClick = () => {
    if (hasReachedCvLimit) {
      setShowLimitDialog(true);
    } else {
      handleCreateCvDialogChange(true);
    }
  };

  const handleRequestGenerate = () => {
    if (isGenerating || !jobOfferForm.targetPosition.trim() || !jobOfferForm.jobDescription.trim())
      return;

    setGenerateSubmitError(false);
    goToSetup('confirm-cost');
  };

  const handleConfirmGenerate = async () => {
    if (generateLockRef.current || isGenerating || !hasEnoughTokens) return;
    generateLockRef.current = true;
    setGenerateSubmitError(false);
    let completed = false;

    try {
      const result = await handleGenerateResume({
        targetPosition: jobOfferForm.targetPosition,
        jobDescription: jobOfferForm.jobDescription,
      });

      if (result === 'success') {
        completed = true;
        handleCreateCvDialogChange(false);
        return;
      }

      if (result === 'insufficient-tokens') {
        rejectedBillingSnapshotRef.current = billingSnapshot;
        setInsufficientTokensDetected(true);
        return;
      }

      if (result === 'limit-reached') {
        goToSetup('limit-reached');
        return;
      }

      setGenerateSubmitError(true);
    } catch {
      setGenerateSubmitError(true);
    } finally {
      if (!completed) generateLockRef.current = false;
    }
  };

  const handleUpgradeTokens = () => {
    handleCreateCvDialogChange(false);
    router.push('/pricing');
  };

  const hasHandledAutoOpen = useRef(false);

  // Wejście z karty oferty (?create=1) — otwieramy ten sam modal co „Stwórz nowe".
  useEffect(() => {
    if (!autoOpenCreateDialog || hasHandledAutoOpen.current) return;
    hasHandledAutoOpen.current = true;

    // Czyścimy query, żeby odświeżenie strony nie otwierało modala ponownie.
    router.replace('/dashboard/resume', { scroll: false });

    if (hasReachedCvLimit) {
      setShowLimitDialog(true);
      return;
    }

    handleCreateCvDialogChange(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreateDialog, hasReachedCvLimit, router]);

  const EmptyState = () => (
    <div className="col-span-full flex h-100 flex-col items-center justify-center rounded-xl border border-dashed">
      <FileText className="text-muted-foreground mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-medium">Brak CV</h3>
      <p className="text-muted-foreground mb-4 max-w-sm px-4 text-center text-sm">
        Rozpocznij tworzenie swojego pierwszego CV, klikając przycisk poniżej.
      </p>
      <Button className="gap-2" onClick={handleNewResumeClick} disabled={isCreating}>
        <Plus className="h-4 w-4" />
        {isCreating ? 'Tworzenie...' : 'Stwórz CV'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="font-grotesk relative">
        <GridBackgroundDemo />
        <div className="relative z-10 w-full">
          <div className="container mx-auto">
            <div className="flex flex-col gap-10">
              {/* Header Section */}
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {limits ? `${limits.currentCount}/${limits.maxLimit}` : 'Basic'}
                  </Badge>
                  {cvs.length > 0 && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleNewResumeClick}
                      disabled={isCreating}
                    >
                      <Plus className="h-4 w-4" />
                      {isCreating ? 'Tworzenie...' : 'Stwórz nowe'}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
                    Twoje cv
                  </h2>
                  <p className="text-muted-foreground max-w-xl text-left text-lg leading-relaxed tracking-tight lg:max-w-lg">
                    {limits
                      ? `Możesz zapisać do ${limits.maxLimit} CV w swoim aktualnym planie.`
                      : 'Zarządzaj swoimi profesjonalnymi CV i śledź swoje aplikacje.'}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {cvs.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {cvs.map((cv) => (
                      <div
                        key={cv.id}
                        onClick={() => router.push(`/resume/${cv.id}`)}
                        className="block cursor-pointer"
                      >
                        <div className="group bg-background flex h-100 flex-col gap-2 rounded-xl border p-4 transition-shadow hover:shadow-lg">
                          <div className="flex h-full flex-col rounded-md border">
                            <div className="bg-muted group relative mb-2 h-1/2 rounded-tl-md rounded-tr-md">
                              {/* Badge - conditionally rendered based on CV status */}
                              {(() => {
                                const badgeInfo = getCvBadgeInfo(cv.createdAt, cv.lastModifiedAt);
                                return badgeInfo ? (
                                  <div className="absolute top-0 right-0 p-2">
                                    <Badge
                                      className={
                                        badgeInfo.variant === 'new'
                                          ? 'bg-white text-black hover:bg-white'
                                          : 'bg-white text-black hover:bg-white'
                                      }
                                    >
                                      {badgeInfo.label}
                                    </Badge>
                                  </div>
                                ) : null;
                              })()}

                              {/* Delete Button */}
                              <div className="absolute top-0 left-0 p-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/30 p-2 text-white opacity-0 shadow-md backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-red-500/80 [@media(hover:none)]:opacity-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Trash2
                                        size={16}
                                        className="transition-all hover:scale-110"
                                      />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="font-grotesk">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Usunąć CV?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ta akcja nie może być cofnięta.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                        Zachowaj CV
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-500 text-white hover:bg-red-400"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteResume(cv.id);
                                        }}
                                      >
                                        Tak, chcę usunąć
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              {/* Preview Area */}
                              <div className="flex h-full items-center justify-center overflow-hidden">
                                <FileText className="text-muted-foreground/50 h-52 w-52 translate-y-1/2 transition-all group-hover:translate-y-1/3" />
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 p-4">
                              <h3 className="line-clamp-1 text-xl tracking-tight">{cv.name}</h3>
                              <p className="text-muted-foreground line-clamp-2 text-base">
                                {cv.targetPosition || 'Nie określono stanowiska docelowego'}
                              </p>
                            </div>

                            <Separator className="w-full" />

                            {/* Card Actions */}
                            <div className="flex min-h-18 flex-row items-center justify-between p-4">
                              <Button size="sm">Edytuj</Button>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <Clock className="text-muted-foreground h-4 w-4" />
                                <p className="text-muted-foreground text-sm font-semibold">
                                  {cv.lastModifiedAt
                                    ? `Edytowano ${formatDateTime(cv.lastModifiedAt)}`
                                    : 'Utworzono niedawno'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Reached Alert Dialog */}
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent className="font-grotesk">
          <AlertDialogHeader>
            <AlertDialogTitle>Osiągnąłeś limit CV dla swojego planu</AlertDialogTitle>
            <AlertDialogDescription>
              Usuń nieaktualne CV lub podnieś swój plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = '/pricing';
              }}
            >
              Podnieś
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCreateCvDialog} onOpenChange={handleCreateCvDialogChange}>
        <DialogContent
          style={{ transitionTimingFunction: EASE }}
          aria-busy={isGenerating}
          onEscapeKeyDown={(event) => {
            if (isGenerating) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (isGenerating) event.preventDefault();
          }}
          className={`font-poppins max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] content-start gap-0 overflow-y-auto rounded-3xl border-0 bg-[#17181d] px-8 pt-12 pb-12 text-white transition-[max-width,padding] duration-500 motion-reduce:transition-none [&>button]:top-5 [&>button]:right-5 [&>button]:text-white/60 [&>button]:opacity-100 [&>button:hover]:text-white [&>button>svg]:size-6 ${
            createCvSetup === 'choose-method'
              ? 'max-w-170 sm:max-w-170 sm:px-16'
              : 'max-w-[860px] sm:max-w-[860px] sm:px-20'
          } ${isGenerating ? '[&>button]:pointer-events-none [&>button]:opacity-30' : ''}`}
        >
          {/* Warstwa 1: animowana wysokość kontenera */}
          <div
            className="w-full overflow-hidden transition-[height] duration-500 motion-reduce:transition-none"
            style={{
              height: contentHeight !== undefined ? `${contentHeight}px` : undefined,
              transitionTimingFunction: EASE,
            }}
          >
            {/* Warstwa 2: fade-out / fade-in treści */}
            <div
              ref={setContentNode}
              className={`w-full transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
                isContentVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              }`}
            >
              {renderedSetup === 'choose-method' ? (
                <>
                  <DialogHeader className="flex w-full items-center gap-2 text-center sm:text-center">
                    <DialogTitle className="text-[22px] leading-tight font-normal text-white">
                      Jak chcesz utworzyć CV?
                    </DialogTitle>
                    <DialogDescription className="text-[14px] leading-relaxed font-light text-white/75">
                      Wybierz sposób, w jaki chcesz rozpocząć tworzenie swojego CV.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-9 grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleCreateResume}
                      disabled={isCreating}
                      className="group flex h-44 w-full cursor-pointer flex-col overflow-hidden rounded-2xl text-white focus-visible:ring-2 focus-visible:ring-[#7178ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17181d] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                    >
                      <span className="flex min-h-0 flex-1 items-center justify-center self-stretch overflow-hidden bg-[#292a30]">
                        <Image
                          src={file_document}
                          width={57.17}
                          height={73.5}
                          alt="file-edit"
                          className="translate-y-8 transition-transform duration-300 ease-out group-hover:translate-y-1"
                        />
                      </span>
                      <span className="relative z-10 flex h-18 w-full shrink-0 items-center justify-center bg-[#686fde] px-4 text-[16px] font-normal">
                        {isCreating ? (
                          'Tworzenie...'
                        ) : (
                          <span>
                            Stwórz <strong className="font-medium">puste CV</strong>
                          </span>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="group flex h-44 w-full cursor-pointer flex-col overflow-hidden rounded-2xl text-white focus-visible:ring-2 focus-visible:ring-[#7178ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17181d] focus-visible:outline-none"
                      onClick={() => goToSetup('job-offer')}
                    >
                      <span className="flex min-h-0 flex-1 items-center justify-center self-stretch overflow-hidden bg-[#292a30]">
                        <Image
                          src={file_edit}
                          width={57.17}
                          height={73.5}
                          alt="file-edit"
                          className="translate-y-8 transition-transform duration-300 ease-out group-hover:translate-y-1"
                        />
                      </span>
                      <span className="relative z-10 flex h-18 w-full shrink-0 items-center justify-center bg-[#686fde] px-8 text-center text-[16px] leading-snug font-normal">
                        <span>
                          Wygeneruj CV pod <strong className="font-medium">konkretną ofertę</strong>
                        </span>
                      </span>
                    </button>
                  </div>
                </>
              ) : renderedSetup === 'job-offer' ? (
                <>
                  <DialogHeader className="flex w-full items-center gap-2 text-center sm:text-center">
                    <DialogTitle
                      ref={jobOfferTitleRef}
                      tabIndex={-1}
                      className="text-[28px] leading-tight font-normal text-white focus:outline-none"
                    >
                      Wygeneruj CV pod ofertę
                    </DialogTitle>
                    <DialogDescription className="max-w-xl text-[15px] leading-relaxed font-light text-white/75">
                      Uzupełnij informacje o stanowisku i wklej opis oferty.
                      <br />
                      Na tej podstawie dopasujemy treść Twojego CV.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-9 grid gap-6">
                    <div
                      className={`grid gap-2 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${
                        isContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                      style={{ transitionDelay: isContentVisible ? '120ms' : '0ms' }}
                    >
                      <Label htmlFor="target-position" className="text-white/60">
                        Tytuł stanowiska
                      </Label>
                      <Input
                        id="target-position"
                        value={jobOfferForm.targetPosition}
                        onChange={(event) =>
                          setJobOfferForm((current) => ({
                            ...current,
                            targetPosition: event.target.value,
                          }))
                        }
                        placeholder="Frontend Developer"
                        maxLength={100}
                        className="h-14 rounded-2xl border-0 bg-[#292a30] px-5 text-white placeholder:text-white/25 dark:bg-[#292a30]"
                      />
                    </div>

                    <div
                      className={`grid gap-2 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${
                        isContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                      style={{ transitionDelay: isContentVisible ? '200ms' : '0ms' }}
                    >
                      <Label htmlFor="job-description" className="text-white/60">
                        Opis oferty
                      </Label>
                      <Textarea
                        id="job-description"
                        value={jobOfferForm.jobDescription}
                        onChange={(event) =>
                          setJobOfferForm((current) => ({
                            ...current,
                            jobDescription: event.target.value,
                          }))
                        }
                        placeholder="Wklej tutaj treść oferty pracy..."
                        maxLength={15000}
                        className="field-sizing-fixed h-36 max-h-36 min-h-36 resize-none overflow-y-auto rounded-2xl border-0 bg-[#292a30] px-5 py-4 text-white placeholder:text-white/25 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none dark:bg-[#292a30]"
                      />
                    </div>

                    <div
                      className={`mt-2 flex flex-col-reverse gap-3 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none sm:flex-row sm:justify-end sm:gap-4 ${
                        isContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                      style={{ transitionDelay: isContentVisible ? '280ms' : '0ms' }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToSetup('choose-method')}
                        disabled={isGenerating}
                        className="h-12 w-full min-w-36 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
                      >
                        Anuluj
                      </Button>
                      <Button
                        type="button"
                        onClick={handleRequestGenerate}
                        disabled={
                          isGenerating ||
                          !jobOfferForm.targetPosition.trim() ||
                          !jobOfferForm.jobDescription.trim()
                        }
                        className="h-12 w-full min-w-36 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
                      >
                        {isGenerating ? 'Generowanie...' : 'Stwórz CV'}
                        {!isGenerating && <ChevronRight />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : renderedSetup === 'confirm-cost' ? (
                <>
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
                      {hasConfirmedUnlimitedGeneration ? (
                        <>Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.</>
                      ) : (
                        <>
                          Zostanie pobrane{' '}
                          <strong className="font-medium text-[#9da3ff]">
                            {GENERATE_CV_FROM_PROFILE_PRICE} tokenów
                          </strong>{' '}
                          z Twojego konta.
                        </>
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  {!hasEnoughTokens && (
                    <div
                      role="alert"
                      className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-center text-sm font-light text-red-50"
                    >
                      {insufficientTokensDetected
                        ? `Saldo tokenów zmieniło się. Potrzebujesz ${GENERATE_CV_FROM_PROFILE_PRICE} tokenów, aby wygenerować CV.`
                        : `Niewystarczające saldo (${tokenBalance}/${GENERATE_CV_FROM_PROFILE_PRICE} tokenów)`}
                    </div>
                  )}

                  {generateSubmitError && (
                    <div
                      role="alert"
                      className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-center text-sm font-light text-red-50"
                    >
                      Nie udało się potwierdzić wyniku operacji. Przed ponowną próbą sprawdź listę
                      CV - nowa pozycja mogła już zostać zapisana.
                    </div>
                  )}

                  {isGenerating && (
                    <p role="status" className="sr-only">
                      Trwa generowanie CV pod ofertę.
                    </p>
                  )}

                  <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row sm:gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        generateSubmitError
                          ? handleCreateCvDialogChange(false)
                          : goToSetup('job-offer')
                      }
                      disabled={isGenerating}
                      className="h-12 w-full min-w-32 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
                    >
                      {!generateSubmitError && <ChevronLeft aria-hidden="true" />}
                      {generateSubmitError ? 'Wróć do dashboardu' : 'Wróć'}
                    </Button>

                    {generateSubmitError ? null : !hasEnoughTokens ? (
                      <Button
                        ref={upgradeButtonRef}
                        type="button"
                        onClick={handleUpgradeTokens}
                        className="h-12 w-full min-w-44 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
                      >
                        Zdobądź tokeny
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => void handleConfirmGenerate()}
                        disabled={isGenerating}
                        className="h-12 w-full min-w-44 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
                      >
                        {isGenerating ? 'Generowanie CV...' : 'Generuj'}
                        {!isGenerating && (
                          <Image
                            src={ai_magic}
                            width={24}
                            height={24}
                            alt="ai_magic"
                            className="invert"
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader className="flex w-full items-center gap-3 text-center sm:text-center">
                    <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
                      <AlertTriangle aria-hidden="true" className="size-7" />
                    </div>
                    <DialogTitle
                      ref={limitTitleRef}
                      tabIndex={-1}
                      className="text-[26px] leading-tight font-normal text-white focus:outline-none"
                    >
                      Osiągnąłeś limit CV dla swojego planu
                    </DialogTitle>
                    <DialogDescription className="max-w-xl text-[15px] leading-relaxed font-light text-white/70">
                      Limit zmienił się podczas generowania. Sprawdź listę CV albo zwiększ limit
                      swojego planu.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row sm:gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCreateCvDialogChange(false)}
                      className="h-12 w-full min-w-40 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white sm:w-auto"
                    >
                      Wróć do dashboardu
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpgradeTokens}
                      className="h-12 w-full min-w-44 bg-[#686fde] text-white hover:bg-[#7379e5] sm:w-auto"
                    >
                      Zwiększ limit CV
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeDashboard;
