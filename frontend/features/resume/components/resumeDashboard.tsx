'use client';
import { ChevronRight, Clock, FileText, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import { file_document, file_edit } from '@/features/marketing/constants';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { CvLimits, CvListItemDto } from '@/lib/types/cv';

import { useResumeDashboardActions } from '../hooks/useResumeDashboardActions';

interface ResumeDashboardProps {
  initialCvs: CvListItemDto[];
  initialLimits: CvLimits | null;
  autoOpenCreateDialog?: boolean;
}

type CreateCvSetup = 'choose-method' | 'job-offer';

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
  const isMobile = useIsMobile();
  const { handleDeleteResume, handleCreateResume, handleGenerateResume, isCreating, isGenerating } =
    useResumeDashboardActions();
  const cvs = initialCvs;
  const limits = initialLimits;

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
    if (isMobile) return;
    if (limits && limits.currentCount >= limits.maxLimit) {
      setShowLimitDialog(true);
    } else {
      setShowCreateCvDialog(true);
    }
  };

  const hasHandledAutoOpen = useRef(false);

  // Wejście z karty oferty (?create=1) — otwieramy ten sam modal co „Stwórz nowe".
  useEffect(() => {
    if (!autoOpenCreateDialog || hasHandledAutoOpen.current) return;
    hasHandledAutoOpen.current = true;

    // Czyścimy query, żeby odświeżenie strony nie otwierało modala ponownie.
    router.replace('/dashboard/resume', { scroll: false });

    if (isMobile) {
      toast.info('Tworzenie CV jest dostępne na komputerze.');
      return;
    }

    if (limits && limits.currentCount >= limits.maxLimit) {
      setShowLimitDialog(true);
      return;
    }

    handleCreateCvDialogChange(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreateDialog, isMobile, limits, router]);

  const EmptyState = () => (
    <div className="col-span-full flex h-100 flex-col items-center justify-center rounded-xl border border-dashed">
      <FileText className="text-muted-foreground mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-medium">Brak CV</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
        {isMobile
          ? 'Tworzenie i edycja CV są dostępne na komputerze. Po utworzeniu zobaczysz podgląd w tym miejscu.'
          : 'Rozpocznij tworzenie swojego pierwszego CV, klikając przycisk poniżej.'}
      </p>
      {!isMobile && (
        <Button className="gap-2" onClick={handleNewResumeClick} disabled={isCreating}>
          <Plus className="h-4 w-4" />
          {isCreating ? 'Tworzenie...' : 'Stwórz CV'}
        </Button>
      )}
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
                  {cvs.length > 0 && !isMobile && (
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
                  {isMobile && (
                    <p className="text-muted-foreground max-w-xl text-left text-sm leading-relaxed tracking-tight lg:max-w-lg">
                      Na telefonie dostępny jest podgląd i pobieranie CV. Tworzenie i edycja są
                      możliwe na komputerze.
                    </p>
                  )}
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
                                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/30 p-2 text-white opacity-0 shadow-md backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-red-500/80"
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
                              <Button size="sm">{isMobile ? 'Podgląd' : 'Edytuj'}</Button>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <Clock className="text-muted-foreground h-4 w-4" />
                                <p className="text-muted-foreground text-sm font-semibold">
                                  {cv.lastModifiedAt
                                    ? `Zmodyf. ${formatDateTime(cv.lastModifiedAt)}`
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
          className={`font-poppins h-auto w-[calc(100%-2rem)] content-start gap-0 overflow-hidden rounded-3xl border-0 bg-[#17181d] px-8 pt-12 pb-12 text-white transition-[max-width,padding] duration-500 motion-reduce:transition-none [&>button]:top-5 [&>button]:right-5 [&>button]:text-white/60 [&>button]:opacity-100 [&>button:hover]:text-white [&>button>svg]:size-6 ${
            createCvSetup === 'choose-method'
              ? 'max-w-170 sm:max-w-170 sm:px-16'
              : 'max-w-[860px] sm:max-w-[860px] sm:px-20'
          }`}
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
              ) : (
                <>
                  <DialogHeader className="flex w-full items-center gap-2 text-center sm:text-center">
                    <DialogTitle className="text-[28px] leading-tight font-normal text-white">
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
                        className="field-sizing-fixed h-36 min-h-36 max-h-36 resize-none overflow-y-auto rounded-2xl border-0 bg-[#292a30] px-5 py-4 text-white placeholder:text-white/25 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none dark:bg-[#292a30]"
                      />
                    </div>

                    <div
                      className={`mt-2 flex justify-end gap-4 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${
                        isContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                      style={{ transitionDelay: isContentVisible ? '280ms' : '0ms' }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToSetup('choose-method')}
                        disabled={isGenerating}
                        className="h-12 min-w-36 border-white/30 bg-transparent text-white hover:bg-white/5 hover:text-white"
                      >
                        Anuluj
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          handleGenerateResume({
                            targetPosition: jobOfferForm.targetPosition,
                            jobDescription: jobOfferForm.jobDescription,
                          })
                        }
                        disabled={
                          isGenerating ||
                          !jobOfferForm.targetPosition.trim() ||
                          !jobOfferForm.jobDescription.trim()
                        }
                        className="h-12 min-w-36 bg-[#686fde] text-white hover:bg-[#7379e5]"
                      >
                        {isGenerating ? 'Generowanie...' : 'Stwórz CV'}
                        {!isGenerating && <ChevronRight />}
                      </Button>
                    </div>
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
