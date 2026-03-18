'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Layers3,
  RefreshCcw,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { archiveRoadmap, generateRoadmap, getUserRoadmaps } from '@/lib/api/roadmap';
import type {
  GenerateRoadmapPayload,
  RoadmapListItemDto,
  RoadmapStatus,
} from '@/lib/types/roadmap';
import { cn } from '@/lib/utils';

const timeHorizonOptions = [3, 6, 9, 12, 18, 24] as const;

const statusClassNames: Record<RoadmapStatus, string> = {
  Active: 'border-sky-400/25 bg-sky-300/10 text-sky-100',
  Draft: 'border-amber-400/25 bg-amber-300/10 text-amber-100',
  Completed: 'border-emerald-400/25 bg-emerald-300/10 text-emerald-100',
  Archived: 'border-white/10 bg-white/5 text-white/60',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as
      | { Error?: string; error?: string; detail?: string }
      | string
      | undefined;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      return payload.Error || payload.error || payload.detail || 'Request failed.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Wystapil nieoczekiwany blad.';
};

export default function RoadmapDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [timeHorizonMonths, setTimeHorizonMonths] = useState<number>(9);
  const [roadmaps, setRoadmaps] = useState<RoadmapListItemDto[]>([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [deletingRoadmapId, setDeletingRoadmapId] = useState<string | null>(null);
  const [deleteDialogRoadmapId, setDeleteDialogRoadmapId] = useState<string | null>(null);
  const [roadmapsError, setRoadmapsError] = useState<string | null>(null);

  const source = searchParams.get('source') ?? 'unknown';
  const careerPathId = searchParams.get('careerPathId') ?? '';
  const careerPathName = searchParams.get('careerPathName') ?? 'Brak wybranej sciezki';
  const pathIndex = searchParams.get('pathIndex');

  const createPayload = useMemo<GenerateRoadmapPayload>(
    () => ({
      careerPathId,
      timeHorizonMonths,
    }),
    [careerPathId, timeHorizonMonths]
  );

  const relatedRoadmaps = useMemo(() => {
    const normalizedCareerPathName = careerPathName.trim().toLowerCase();
    return roadmaps.filter(
      (roadmap) => roadmap.careerPathName.trim().toLowerCase() === normalizedCareerPathName
    );
  }, [careerPathName, roadmaps]);

  const canCreateRoadmap = careerPathId.length > 0 && !isCreatingRoadmap;

  const fetchRoadmaps = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingRoadmaps(true);
    setRoadmapsError(null);

    try {
      const data = await getUserRoadmaps({ signal });
      setRoadmaps(data);
    } catch (error) {
      if ((error as DOMException)?.name === 'CanceledError' || signal?.aborted) {
        return;
      }

      const message = normalizeErrorMessage(error);
      setRoadmapsError(message);
    } finally {
      if (!signal?.aborted) {
        setIsLoadingRoadmaps(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRoadmaps(controller.signal);
    return () => controller.abort();
  }, [fetchRoadmaps]);

  const handleCreateRoadmap = async () => {
    if (!canCreateRoadmap) return;

    setIsCreatingRoadmap(true);

    try {
      const createdRoadmap = await generateRoadmap(createPayload);
      toast.success('Roadmapa zostala utworzona');
      router.push(`/roadmap/${createdRoadmap.id}`);
    } catch (error) {
      const message = normalizeErrorMessage(error);
      toast.error('Nie udalo sie utworzyc roadmapy', {
        description: message,
      });
    } finally {
      setIsCreatingRoadmap(false);
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    setDeletingRoadmapId(roadmapId);

    try {
      await archiveRoadmap(roadmapId);
      setRoadmaps((currentRoadmaps) =>
        currentRoadmaps.filter((roadmap) => roadmap.id !== roadmapId)
      );
      toast.success('Roadmapa zostala usunieta');
    } catch (error) {
      const message = normalizeErrorMessage(error);
      toast.error('Nie udalo sie usunac roadmapy', {
        description: message,
      });
    } finally {
      setDeletingRoadmapId(null);
      setDeleteDialogRoadmapId(null);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#05070b] px-4 pb-16 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,153,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(57,211,176,0.10),transparent_24%),linear-gradient(180deg,#05070b_0%,#090c12_42%,#05070b_100%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 pt-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <Badge className="w-fit rounded-full border border-sky-400/20 bg-sky-300/10 px-3 py-1 text-[11px] tracking-[0.18em] text-sky-100 uppercase">
              Roadmap Dashboard
            </Badge>
            <div className="space-y-2">
              <h1 className="font-grotesk text-4xl leading-tight font-semibold text-white sm:text-5xl">
                Dashboard tworzenia roadmapy
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
                Klik z assistanta juz przekazuje prawdziwy `careerPathId`, a ten widok jest
                podlaczony do endpointow roadmapy.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="ghost"
            className="rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.05] hover:text-white"
          >
            <Link href="/assistant">
              <ArrowLeft className="h-4 w-4" />
              Wroc do assistanta
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <Card className="rounded-[28px] border border-white/10 bg-white/[0.03] py-0 text-white shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <CardHeader className="gap-4 border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-sky-400/20 bg-sky-300/10 text-sky-100">
                  source: {source}
                </Badge>
                {pathIndex ? (
                  <Badge className="rounded-full border border-white/10 bg-white/5 text-white/65">
                    path index: {pathIndex}
                  </Badge>
                ) : null}
                {relatedRoadmaps.length > 0 ? (
                  <Badge className="rounded-full border border-amber-400/25 bg-amber-300/10 text-amber-100">
                    Istnieje juz {relatedRoadmaps.length} roadmap(a) dla podobnej sciezki
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2">
                <CardTitle className="font-grotesk text-2xl leading-tight">
                  {careerPathName}
                </CardTitle>
                <CardDescription className="text-white/55">
                  To jest wybrana sciezka kariery, dla ktorej backend bedzie generowal roadmape.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoTile
                  icon={Target}
                  label="careerPathId"
                  value={careerPathId || 'Brak careerPathId w query'}
                  mono
                />
                <InfoTile
                  icon={CalendarRange}
                  label="Wybrany horyzont"
                  value={`${timeHorizonMonths} miesiecy`}
                />
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-100" />
                  <p className="text-sm text-white/70">
                    Create button odpala teraz `POST /api/Roadmap/generate`.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {timeHorizonOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTimeHorizonMonths(option)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs transition-colors',
                        option === timeHorizonMonths
                          ? 'border-sky-300/25 bg-sky-300/10 text-sky-100'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white'
                      )}
                    >
                      {option} mies.
                    </button>
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-[#04060a]">
                  <div className="border-b border-white/10 px-4 py-3 text-xs text-white/45">
                    Payload do create roadmapy
                  </div>
                  <pre className="overflow-auto px-4 py-4 text-xs leading-6 text-white/75">
                    {JSON.stringify(createPayload, null, 2)}
                  </pre>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!canCreateRoadmap}
                    onClick={handleCreateRoadmap}
                    className="rounded-full bg-[linear-gradient(90deg,rgba(86,163,255,0.95),rgba(47,214,168,0.95))] text-black hover:opacity-90"
                  >
                    {isCreatingRoadmap ? 'Tworzenie...' : 'Utworz roadmape'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void fetchRoadmaps()}
                    className="rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.05] hover:text-white"
                  >
                    Odswiez liste
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/10 bg-white/[0.03] py-0 text-white backdrop-blur-xl">
            <CardHeader className="gap-2 border-b border-white/10">
              <CardTitle className="font-grotesk text-lg">Twoje roadmapy</CardTitle>
              <CardDescription className="text-white/55">
                Dane pochodza z `GET /api/Roadmap/user-roadmaps`.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-6">
              {isLoadingRoadmaps ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={`roadmap-skeleton-${item}`}
                      className="animate-pulse rounded-[20px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="h-4 w-2/3 rounded bg-white/10" />
                      <div className="mt-3 h-3 w-1/2 rounded bg-white/8" />
                      <div className="mt-4 h-2 rounded-full bg-white/8" />
                    </div>
                  ))}
                </div>
              ) : roadmapsError ? (
                <div className="rounded-[20px] border border-rose-400/20 bg-rose-300/10 p-4 text-sm text-rose-100">
                  <p>{roadmapsError}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void fetchRoadmaps()}
                    className="mt-3 rounded-full border border-white/10 bg-white/[0.04] text-white"
                  >
                    Sprobuj ponownie
                  </Button>
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  Nie masz jeszcze zadnej roadmapy. Mozesz utworzyc pierwsza z wybranej sciezki po
                  lewej.
                </div>
              ) : (
                roadmaps.map((roadmap) => (
                  <div
                    key={roadmap.id}
                    className="rounded-[20px] border border-white/10 bg-black/20 p-4 transition-colors hover:bg-black/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{roadmap.title}</p>
                        <p className="text-xs text-white/45">{roadmap.careerPathName}</p>
                        <p className="font-mono text-[11px] text-white/35">{roadmap.id}</p>
                      </div>
                      <Badge
                        className={cn('rounded-full border', statusClassNames[roadmap.status])}
                      >
                        {roadmap.status}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-white/45">
                      <span>{roadmap.timeHorizonMonths} mies.</span>
                      <span>{formatDate(roadmap.createdAt)}</span>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(86,163,255,0.9),rgba(47,214,168,0.9))]"
                        style={{ width: `${roadmap.progress}%` }}
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Button
                        asChild
                        type="button"
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Link href={`/roadmap/${roadmap.id}`}>Otworz</Link>
                      </Button>

                      <AlertDialog
                        open={deleteDialogRoadmapId === roadmap.id}
                        onOpenChange={(open) => setDeleteDialogRoadmapId(open ? roadmap.id : null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={deletingRoadmapId === roadmap.id}
                            className="rounded-full border border-rose-400/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15 hover:text-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingRoadmapId === roadmap.id ? 'Usuwanie...' : 'Usuń'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="font-grotesk border-white/10 bg-[#0b1016] text-white shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              Usunąć roadmapę?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                              Ta akcja nie może być cofnięta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={deletingRoadmapId === roadmap.id}
                              onClick={() => setDeleteDialogRoadmapId(null)}
                              className="border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
                            >
                              Zachowaj roadmapę
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={deletingRoadmapId === roadmap.id}
                              className="bg-red-500 text-white hover:bg-red-400"
                              onClick={() => void handleDeleteRoadmap(roadmap.id)}
                            >
                              Tak, chcę usunąć
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] py-0 text-white backdrop-blur-xl">
          <CardHeader className="gap-2 border-b border-white/10">
            <CardTitle className="font-grotesk text-lg">Co zostalo po tym kroku</CardTitle>
            <CardDescription className="text-white/55">
              Flow tworzenia i przejscia do detalu roadmapy juz dziala. Pozostaja rozszerzenia.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
            <ChecklistTile
              icon={Layers3}
              title="1. Create flow"
              description="Zrobione: dashboard wysyla request generate i przechodzi do konkretnej roadmapy."
            />
            <ChecklistTile
              icon={CalendarRange}
              title="2. Lista roadmap"
              description="Zrobione: dashboard pobiera roadmaps z backendu i pozwala otwierac detale."
            />
            <ChecklistTile
              icon={ArrowRight}
              title="3. Rozszerzenia"
              description="Status update zostal na pozniej, ale usuwanie i archiwizacja roadmap sa juz dostepne."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-white/45">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] tracking-[0.18em] uppercase">{label}</p>
      </div>
      <p className={cn('mt-2 text-sm text-white', mono && 'font-mono text-[12px] leading-6')}>
        {value}
      </p>
    </div>
  );
}

function ChecklistTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-white">
        <Icon className="h-4 w-4 text-sky-100" />
        <p className="font-medium">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
    </div>
  );
}
