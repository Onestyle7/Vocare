'use client';

import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleHelp,
  LoaderCircle,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';

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
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { ai_magic } from '@/features/marketing/constants';
import { CvAnalysisResult } from '@/lib/types/cv';
import { cn } from '@/lib/utils';

import { analyzeCvCommand, getCvAnalysisCommand } from '../dal/commands';

interface CvAnalysisDrawerProps {
  cvId: string | null;
  cvName: string;
  targetPosition?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToSection: (sectionId: string) => void;
}

const SECTION_LABELS: Record<string, string> = {
  Basics: 'Dane podstawowe',
  Work: 'Doświadczenie',
  Education: 'Wykształcenie',
  Certificates: 'Certyfikaty',
  Skills: 'Umiejętności',
  Languages: 'Języki',
  Projects: 'Projekty',
  Social: 'Linki i portfolio',
};

const ANALYZE_CV_PRICE = 10;

const SECTION_FORM_IDS: Record<string, string> = {
  Basics: 'profile',
  Work: 'experience',
  Education: 'education',
  Certificates: 'certificates',
  Skills: 'skills',
  Languages: 'languages',
  Projects: 'projects',
  Social: 'contact',
};

const OVERALL_SCORE_CHART_CONFIG = {
  score: {
    label: 'Wynik',
    color: '#915EFF',
  },
  remaining: {
    label: 'Pozostało',
    color: '#E9E5F5',
  },
} satisfies ChartConfig;

const clampScore = (score: number) => Math.min(100, Math.max(0, Number(score) || 0));

const scoreBarColor = (score: number) => {
  const safeScore = clampScore(score);
  if (safeScore < 40) return '#DDD6FE';
  if (safeScore < 70) return '#C4B5FD';
  if (safeScore < 85) return '#A78BFA';
  return '#7C3AED';
};

const scoreMeta = (score: number) => {
  if (score < 40) return { label: 'Wymaga uzupełnienia', color: 'text-rose-600' };
  if (score < 70) return { label: 'Dobry fundament', color: 'text-amber-600' };
  if (score < 85) return { label: 'Dobre CV', color: 'text-[#915EFF]' };
  return { label: 'Bardzo mocne CV', color: 'text-emerald-600' };
};

const ScoreBar = ({ score }: { score: number }) => {
  const safeScore = clampScore(score);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeScore}
    >
      <div
        className="h-full rounded-full transition-[width,background-color] duration-500"
        style={{ width: `${safeScore}%`, backgroundColor: scoreBarColor(safeScore) }}
      />
    </div>
  );
};

export function CvAnalysisDrawer({
  cvId,
  targetPosition,
  open,
  onOpenChange,
  onNavigateToSection,
}: CvAnalysisDrawerProps) {
  const [analysis, setAnalysis] = useState<CvAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokenBalance, hasActiveSubscription } = useTokenBalanceContext();

  const hasEnoughTokens =
    hasActiveSubscription || (typeof tokenBalance === 'number' && tokenBalance >= ANALYZE_CV_PRICE);

  useEffect(() => {
    if (!open || !cvId) return;

    let active = true;
    const loadAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      const [loadError, result] = await getCvAnalysisCommand(cvId);
      if (!active) return;

      if (loadError?.type === 'NotFound') {
        setAnalysis(null);
      } else if (loadError) {
        setError('Nie udało się pobrać ostatniej analizy. Spróbuj ponownie.');
      } else {
        setAnalysis(result);
      }
      setIsLoading(false);
    };

    void loadAnalysis();
    return () => {
      active = false;
    };
  }, [cvId, open]);

  const handleAnalyze = async () => {
    if (!cvId || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    const [analyzeError, result] = await analyzeCvCommand(cvId);
    if (analyzeError) {
      setError(
        analyzeError.type === 'Unauthorized'
          ? 'Sesja wygasła. Zaloguj się ponownie.'
          : 'Nie udało się przeanalizować CV. Sprawdź swój plan lub spróbuj ponownie.'
      );
    } else {
      setAnalysis(result);
    }
    setIsAnalyzing(false);
  };

  const handleConfirmAnalyze = () => {
    setIsCostDialogOpen(false);
    void handleAnalyze();
  };

  const overallScore = clampScore(analysis?.overallScore ?? 0);
  const meta = scoreMeta(overallScore);
  const sections = [...(analysis?.sectionScores ?? [])].sort(
    (a, b) => clampScore(a.score) - clampScore(b.score)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="font-poppins w-[min(94vw,480px)] gap-0 overflow-hidden border-l border-slate-200 bg-white p-0 text-slate-950 sm:max-w-120"
      >
        <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
          <SheetTitle className="pr-10 text-xl font-medium text-slate-950">
            Analiza jakości CV
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            {targetPosition ? `${targetPosition}` : ''}
          </SheetDescription>
        </SheetHeader>

        <SheetClose asChild>
          <button
            type="button"
            className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none"
            aria-label="Zamknij analizę CV"
          >
            <X className="size-5" />
          </button>
        </SheetClose>

        <div className="flex-1 overflow-y-auto bg-white px-6 py-6 text-slate-950">
          {isLoading ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <LoaderCircle className="mb-4 size-8 animate-spin text-[#915EFF]" />
              <p className="font-medium">Pobieramy ostatnią analizę…</p>
            </div>
          ) : isAnalyzing ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <div className="mb-5 rounded-full bg-[#915EFF]/10 p-4">
                <LoaderCircle className="size-8 animate-spin text-[#915EFF]" />
              </div>
              <h3 className="text-lg font-semibold">Analizujemy Twoje CV</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                Sprawdzamy kompletność sekcji, jakość opisów i najważniejsze obszary do poprawy.
                Zajmie to do minuty.
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-7">
              <section
                className="rounded-2xl border border-[#915EFF]/20 bg-[#FAF8FF] px-5 py-6 text-center"
                aria-label={`Wynik ogólny: ${overallScore} na 100. ${meta.label}`}
              >
                <p className="text-sm font-medium text-slate-600">Wynik ogólny</p>
                <div className="relative mx-auto mt-2 size-52">
                  <ChartContainer
                    config={OVERALL_SCORE_CHART_CONFIG}
                    className="aspect-square size-full"
                  >
                    <PieChart accessibilityLayer>
                      <Pie
                        data={[
                          { name: 'score', value: overallScore },
                          { name: 'remaining', value: 100 - overallScore },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={72}
                        outerRadius={92}
                        cornerRadius={10}
                        stroke="none"
                        isAnimationActive
                      >
                        <Cell fill="var(--color-score)" />
                        <Cell fill="var(--color-remaining)" />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                    aria-hidden="true"
                  >
                    <div className="flex items-baseline">
                      <span className="text-5xl font-semibold tracking-tight text-slate-950">
                        {overallScore}
                      </span>
                      <span className="text-base font-medium text-slate-500">/100</span>
                    </div>
                    <span className="mt-1 text-xs text-slate-500">punktów</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <p className={cn('text-base font-semibold', meta.color)}>{meta.label}</p>
                  <HoverCard openDelay={150} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-[#915EFF] focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none"
                        aria-label="Jak działa ocena jakości CV?"
                      >
                        <CircleHelp className="size-4" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="top"
                      align="center"
                      className="font-poppins w-80 border-slate-200 bg-white p-4 text-left text-slate-950 shadow-xl"
                    >
                      <h4 className="text-sm font-semibold">Jak działa ten wynik?</h4>
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        AI ocenia kompletność CV, jakość opisów doświadczenia, umiejętności oraz
                        pozostałe sekcje. Wynik ogólny jest prezentowany w skali od 0 do 100.
                      </p>
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-rose-600">Wymaga uzupełnienia</span>
                          <span className="text-slate-500">0–39</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-amber-600">Dobry fundament</span>
                          <span className="text-slate-500">40–69</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-[#915EFF]">Dobre CV</span>
                          <span className="text-slate-500">70–84</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-emerald-600">Bardzo mocne CV</span>
                          <span className="text-slate-500">85–100</span>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] leading-4 text-slate-500">
                        To ocena jakości treści, a nie gwarancja przejścia przez konkretny system
                        ATS.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </section>

              {targetPosition ? (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Dopasowanie do stanowiska
                    </div>
                    <span className="font-semibold">
                      {clampScore(analysis.targetPositionScore)}/100
                    </span>
                  </div>
                  <ScoreBar score={analysis.targetPositionScore} />
                  <p className="mt-2 truncate text-xs text-slate-500">{targetPosition}</p>
                </section>
              ) : (
                <section className="flex gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <BriefcaseBusiness className="mt-0.5 size-5 shrink-0 text-[#915EFF]" />
                  <div>
                    <p className="text-sm font-medium">Brak stanowiska docelowego</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Uzupełnij je w danych CV, aby otrzymać ocenę dopasowania.
                    </p>
                  </div>
                </section>
              )}

              {analysis.topImprovements.length > 0 && (
                <section>
                  <h3 className="mb-3 text-base font-semibold">Największy wpływ</h3>
                  <div className="space-y-2">
                    {analysis.topImprovements.slice(0, 3).map((improvement, index) => (
                      <div
                        key={`${improvement}-${index}`}
                        className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-slate-800"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#915EFF] text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 text-base font-semibold">Ocena sekcji</h3>
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <details
                      key={`${section.sectionName}-${index}`}
                      className="group rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition-colors open:bg-slate-50 hover:border-[#915EFF]/40"
                    >
                      <summary
                        className="cursor-pointer list-none text-left focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:ring-offset-4 focus-visible:outline-none"
                        onClick={(event) => {
                          const details = event.currentTarget.parentElement as HTMLDetailsElement;
                          const isCurrentlyOpen = details.open;
                          if (isCurrentlyOpen) return;

                          const formSectionId = SECTION_FORM_IDS[section.sectionName];
                          if (formSectionId) onNavigateToSection(formSectionId);
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium">
                            {SECTION_LABELS[section.sectionName] ?? section.sectionName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {clampScore(section.score)}/100
                            </span>
                            <ArrowUpRight className="size-4 transition-transform duration-300 ease-out group-open:rotate-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <ScoreBar score={section.score} />
                        </div>
                      </summary>
                      {section.insights.length > 0 && (
                        <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm leading-5 text-slate-600">
                          {section.insights.map((insight, insightIndex) => (
                            <li key={`${insight}-${insightIndex}`} className="flex gap-2">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#915EFF]" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  ))}
                </div>
              </section>

              <p className="text-xs leading-5 text-slate-500">
                Ocena dotyczy treści CV. Nie jest gwarancją przejścia przez konkretny system ATS.
              </p>
              <Button
                className="w-full bg-[#915EFF] text-white hover:bg-[#713ae8] hover:text-white"
                onClick={() => setIsCostDialogOpen(true)}
              >
                <Image src={ai_magic} width={20} height={20} alt="ai-analysys" className="invert" />
                Analizuj ponownie
              </Button>
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center text-center">
              <h3 className="text-xl font-medium">Sprawdź jakość swojego CV</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                Ocenimy kompletność, doświadczenie, umiejętności i pozostałe sekcje oraz wskażemy
                trzy najważniejsze poprawki.
              </p>
              <Button
                className="mt-6 bg-[#915EFF] text-white hover:bg-[#713ae8] hover:text-white"
                onClick={() => setIsCostDialogOpen(true)}
                disabled={!cvId}
              >
                <Image src={ai_magic} width={20} height={20} alt="ai-analysys" className="invert" />
                Analizuj CV
              </Button>
            </div>
          )}

          {error && !isLoading && !isAnalyzing && (
            <div className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm leading-5">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-rose-300 bg-white text-rose-800 hover:bg-rose-100 hover:text-rose-900"
                  onClick={() => setIsCostDialogOpen(true)}
                >
                  Spróbuj ponownie
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>

      <AlertDialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <AlertDialogContent className="font-poppins mx-auto max-w-sm border-slate-200 bg-white text-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl font-bold text-slate-950">
              Przeanalizować CV?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-700">
              {!hasActiveSubscription ? (
                <>
                  Zostanie pobrane <b className="text-[#915EFF]">{ANALYZE_CV_PRICE} tokenów</b> z
                  Twojego konta.
                  {!hasEnoughTokens && (
                    <span className="mt-2 block font-medium text-rose-600">
                      Niewystarczające saldo ({tokenBalance}/{ANALYZE_CV_PRICE} tokenów)
                    </span>
                  )}
                </>
              ) : (
                <span>
                  Jesteś na aktywnej subskrypcji, więc ta akcja nie wykorzysta żadnych tokenów.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-8 flex flex-row justify-center gap-4 sm:justify-center">
            <AlertDialogCancel className="w-[130px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950">
              Anuluj
            </AlertDialogCancel>

            {!hasEnoughTokens ? (
              <Link href="/pricing">
                <AlertDialogAction
                  className="group bg-[#915EFF] text-white hover:bg-[#7b4ee0] hover:text-white"
                  onClick={() => setIsCostDialogOpen(false)}
                >
                  Zdobądź tokeny
                  <ArrowRight className="scale-90 transition-transform group-hover:translate-x-1" />
                </AlertDialogAction>
              </Link>
            ) : (
              <AlertDialogAction
                onClick={handleConfirmAnalyze}
                className="bg-[#915EFF] text-white hover:bg-[#7b4ee0] hover:text-white"
              >
                Analizuj
                <Image src={ai_magic} width={16} height={16} alt="" className="invert" />
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
