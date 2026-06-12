'use client';

import { ArrowRight, Clock, Layers3, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import type { CareerPath } from '@/lib/types/recommendation';
import type { GenerateRoadmapPayload, RoadmapListItemDto } from '@/lib/types/roadmap';
import { cn } from '@/lib/utils';

import { useRoadmapDashboardActions } from '../hooks/useRoadmapDashboardActions';

const timeHorizonOptions = [3, 6, 9, 12, 18, 24] as const;
const DEFAULT_ROADMAP_LIMIT = 1;
const PREMIUM_ROADMAP_LIMIT = 10;
const ROADMAPS_SECTION_ID = 'active-roadmaps-section';

type CareerPathOption = Pick<CareerPath, 'id' | 'careerName' | 'description'>;

const formatDate = (value: string) =>
  new Date(value).toLocaleString('pl-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  });

// removed normalizeErrorMessage

const formatRoadmapLimitNoun = (count: number) => {
  if (count === 1) return 'roadmapę';
  if (count >= 2 && count <= 4) return 'roadmapy';
  return 'roadmap';
};

const formatRoadmapStatusLabel = (status: RoadmapListItemDto['status']) => {
  switch (status) {
    case 'Draft':
      return 'Szkic';
    case 'Completed':
      return 'Ukończona';
    case 'Archived':
      return 'Archiwum';
    default:
      return 'Aktywna';
  }
};

interface RoadmapDashboardPageProps {
  initialRoadmaps: RoadmapListItemDto[];
  initialError: string | null;
  availableCareerPaths: CareerPathOption[];
}

export default function RoadmapDashboardPage({
  initialRoadmaps,
  initialError,
  availableCareerPaths: serverCareerPaths,
}: RoadmapDashboardPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscriptionStatus } = useTokenBalanceContext();
  const { handleGenerateRoadmap, handleArchiveRoadmap, isPending, deletingId } =
    useRoadmapDashboardActions();

  const [timeHorizonMonths, setTimeHorizonMonths] = useState<number>(9);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCareerPathId, setSelectedCareerPathId] = useState('');
  const [selectedCareerPathName, setSelectedCareerPathName] = useState('');
  const [deleteDialogRoadmapId, setDeleteDialogRoadmapId] = useState<string | null>(null);

  const roadmaps = initialRoadmaps;
  const roadmapsError = initialError;
  const isCreatingRoadmap = isPending;
  const deletingRoadmapId = deletingId;
  const roadmapLimit =
    subscriptionStatus === 'Active' ? PREMIUM_ROADMAP_LIMIT : DEFAULT_ROADMAP_LIMIT;

  const intentCareerPathId = searchParams.get('careerPathId') ?? '';
  const intentCareerPathName = searchParams.get('careerPathName') ?? '';

  const createPayload = useMemo<GenerateRoadmapPayload>(
    () => ({
      careerPathId: selectedCareerPathId,
      timeHorizonMonths,
    }),
    [selectedCareerPathId, timeHorizonMonths]
  );

  const visibleRoadmaps = useMemo(
    () => roadmaps.filter((roadmap) => roadmap.status !== 'Archived'),
    [roadmaps]
  );
  const currentRoadmapCount = roadmaps.length;
  const isRoadmapLimitReached = currentRoadmapCount >= roadmapLimit;

  const availableCareerPaths = useMemo(() => {
    if (
      !selectedCareerPathId ||
      serverCareerPaths.some((path) => path.id === selectedCareerPathId)
    ) {
      return serverCareerPaths;
    }

    return [
      {
        id: selectedCareerPathId,
        careerName: selectedCareerPathName || 'Wybrana sciezka kariery',
        description: '',
      },
      ...serverCareerPaths,
    ];
  }, [serverCareerPaths, selectedCareerPathId, selectedCareerPathName]);

  const selectedPathExistingRoadmap = useMemo(() => {
    const normalizedCareerPathName = selectedCareerPathName.trim().toLowerCase();
    if (!normalizedCareerPathName) {
      return null;
    }

    return (
      visibleRoadmaps.find(
        (roadmap) => roadmap.careerPathName.trim().toLowerCase() === normalizedCareerPathName
      ) ?? null
    );
  }, [selectedCareerPathName, visibleRoadmaps]);

  const canCreateRoadmap =
    selectedCareerPathId.length > 0 &&
    !isCreatingRoadmap &&
    !selectedPathExistingRoadmap &&
    !isRoadmapLimitReached;

  const roadmapUsageLabel = useMemo(() => {
    return `${currentRoadmapCount}/${roadmapLimit}`;
  }, [currentRoadmapCount, roadmapLimit]);

  const roadmapLimitDescription = useMemo(() => {
    return `Możesz mieć maksymalnie ${roadmapLimit} ${formatRoadmapLimitNoun(roadmapLimit)} w swoim aktualnym planie.`;
  }, [roadmapLimit]);

  const roadmapLimitHoverMessage = useMemo(() => {
    return `Osiągnięto limit roadmap dla obecnego planu (${currentRoadmapCount}/${roadmapLimit}). Usuń roadmapę albo przejdź na Pro.`;
  }, [currentRoadmapCount, roadmapLimit]);

  const showRoadmapLimitReachedToast = useCallback(() => {
    toast.error('Osiągnięto limit roadmap dla obecnego planu.', {
      action: {
        label: 'Ulepsz',
        onClick: () => router.push('/pricing'),
      },
      cancel: {
        label: 'Usuń roadmapę',
        onClick: () =>
          document
            .getElementById(ROADMAPS_SECTION_ID)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      },
    });
  }, [router]);

  const handleManageRoadmaps = useCallback(() => {
    document
      .getElementById(ROADMAPS_SECTION_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    if (isRoadmapLimitReached) {
      showRoadmapLimitReachedToast();
      return;
    }

    setIsCreateDialogOpen(true);
  }, [isRoadmapLimitReached, showRoadmapLimitReachedToast]);

  useEffect(() => {
    if (!intentCareerPathId) {
      return;
    }

    setSelectedCareerPathId(intentCareerPathId);
    setSelectedCareerPathName(intentCareerPathName || 'Wybrana ścieżka kariery');

    if (isRoadmapLimitReached) {
      showRoadmapLimitReachedToast();
    } else {
      setIsCreateDialogOpen(true);
    }

    router.replace(pathname, { scroll: false });
  }, [
    intentCareerPathId,
    intentCareerPathName,
    isRoadmapLimitReached,
    pathname,
    router,
    showRoadmapLimitReachedToast,
  ]);

  // removed loadCareerPaths useEffect

  const handleSelectCareerPath = (careerPathId: string) => {
    const nextCareerPath = availableCareerPaths.find((path) => path.id === careerPathId);

    setSelectedCareerPathId(careerPathId);
    setSelectedCareerPathName(nextCareerPath?.careerName ?? '');
  };

  const handleCreateRoadmap = () => {
    if (isRoadmapLimitReached) {
      showRoadmapLimitReachedToast();
      return;
    }

    if (!canCreateRoadmap) return;

    handleGenerateRoadmap(createPayload);
  };

  const handleDeleteRoadmap = (roadmapId: string) => {
    handleArchiveRoadmap(roadmapId, () => {
      setDeleteDialogRoadmapId(null);
    });
  };

  return (
    <div className="min-h-screen">
      <div className="font-poppins relative">
        <GridBackgroundDemo />

        <div className="relative z-10 w-full">
          <div className="container mx-auto">
            <div className="flex flex-col gap-8 md:gap-10">
              <CreateRoadmapDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                careerPathOptions={availableCareerPaths}
                selectedCareerPathId={selectedCareerPathId}
                onCareerPathChange={handleSelectCareerPath}
                timeHorizonMonths={timeHorizonMonths}
                onTimeHorizonChange={setTimeHorizonMonths}
                onCreate={handleCreateRoadmap}
                onReloadCareerPaths={() => Promise.resolve()} // obsolete
                isCreatingRoadmap={isCreatingRoadmap}
                isLoadingCareerPaths={false}
                careerPathsError={null}
                existingRoadmap={selectedPathExistingRoadmap}
                isRoadmapLimitReached={isRoadmapLimitReached}
                roadmapLimitReachedDescription={roadmapLimitHoverMessage}
                onManageRoadmaps={handleManageRoadmaps}
              />

              <div className="flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <Badge variant="secondary" className="font-poppins">
                    {roadmapUsageLabel}
                  </Badge>

                  <CreateRoadmapButton
                    onClick={handleOpenCreateDialog}
                    disabled={isRoadmapLimitReached}
                    tooltipContent={roadmapLimitHoverMessage}
                    className="font-poppins gap-2"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
                    Twoje roadmapy
                  </h2>
                  <p className="text-muted-foreground font-grotesk max-w-xl text-left text-lg leading-relaxed tracking-tight lg:max-w-lg">
                    {roadmapLimitDescription}
                  </p>
                </div>
              </div>

              <div
                id={ROADMAPS_SECTION_ID}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
              >
                {roadmapsError ? (
                  <div className="col-span-full rounded-xl border border-rose-200 bg-rose-50 p-6">
                    <p className="text-sm text-rose-700">{roadmapsError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.refresh()}
                      className="font-poppins mt-4"
                    >
                      Odśwież
                    </Button>
                  </div>
                ) : visibleRoadmaps.length === 0 ? (
                  <EmptyState
                    onCreate={handleOpenCreateDialog}
                    isCreateDisabled={isRoadmapLimitReached}
                    createTooltipContent={roadmapLimitHoverMessage}
                  />
                ) : (
                  <>
                    {visibleRoadmaps.map((roadmap) => (
                      <Link
                        key={roadmap.id}
                        href={`/roadmap/${roadmap.id}`}
                        className="block min-w-0"
                      >
                        <div className="group bg-background flex h-[400px] min-w-0 flex-col gap-2 overflow-hidden rounded-xl border p-3 transition-shadow hover:shadow-lg md:p-4">
                          <div className="flex h-full min-w-0 flex-col rounded-md border">
                            <div className="bg-muted group relative mb-2 h-1/2 rounded-tl-md rounded-tr-md">
                              <div className="absolute top-0 right-0 p-2">
                                <div className="flex flex-col items-end gap-2">
                                  <Badge className="font-poppins rounded-[7px] border border-white/60 bg-white/90 px-2.5 py-1 text-slate-800 shadow-none backdrop-blur-sm hover:bg-white">
                                    {roadmap.timeHorizonMonths} mies.
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="font-poppins rounded-[7px] border border-white/60 bg-white/85 px-2.5 py-1 text-slate-700 shadow-none backdrop-blur-sm hover:bg-white"
                                  >
                                    {formatRoadmapStatusLabel(roadmap.status)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="absolute top-0 left-0 p-2">
                                <AlertDialog
                                  open={deleteDialogRoadmapId === roadmap.id}
                                  onOpenChange={(open) =>
                                    setDeleteDialogRoadmapId(open ? roadmap.id : null)
                                  }
                                >
                                  <AlertDialogTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setDeleteDialogRoadmapId(roadmap.id);
                                      }}
                                      disabled={deletingRoadmapId === roadmap.id}
                                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/30 p-2 text-white opacity-100 shadow-md backdrop-blur-md transition-all hover:bg-red-500/80 disabled:cursor-not-allowed disabled:opacity-100 md:h-10 md:w-10 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                      <Trash2
                                        size={16}
                                        className="transition-all hover:scale-110"
                                      />
                                    </button>
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
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          setDeleteDialogRoadmapId(null);
                                        }}
                                        className="border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
                                      >
                                        Zachowaj roadmapę
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-500 text-white hover:bg-red-400"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void handleDeleteRoadmap(roadmap.id);
                                        }}
                                      >
                                        Tak, chcę usunąć
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              <div className="flex h-full min-w-0 flex-col items-center justify-center overflow-hidden px-4 md:px-5">
                                <Layers3 className="text-muted-foreground/50 h-56 w-56 translate-y-[65%] transition-all group-hover:translate-y-[50%] md:h-72 md:w-72" />

                                <div className="mt-5 w-full">
                                  <div className="bg-muted mt-3 h-2 rounded-full">
                                    <div
                                      className="bg-foreground h-full rounded-full"
                                      style={{ width: `${roadmap.progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 p-3 md:p-4">
                              <h3 className="line-clamp-2 text-base font-semibold break-words md:text-xl">
                                {roadmap.title}
                              </h3>
                              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm break-words">
                                {roadmap.careerPathName}
                              </p>
                            </div>

                            <Separator className="w-full" />

                            <div className="flex min-h-[72px] min-w-0 items-center justify-between gap-3 p-3 md:p-4">
                              <Button size="sm" className="shrink-0">
                                Otwórz
                              </Button>

                              <div className="text-muted-foreground flex min-w-0 items-center gap-2">
                                <Clock className="h-4 w-4 shrink-0" />
                                <p className="min-w-0 text-sm font-semibold break-words">
                                  Utworzono {formatDate(roadmap.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateRoadmapDialog({
  open,
  onOpenChange,
  careerPathOptions,
  selectedCareerPathId,
  onCareerPathChange,
  timeHorizonMonths,
  onTimeHorizonChange,
  onCreate,
  onReloadCareerPaths,
  isCreatingRoadmap,
  isLoadingCareerPaths,
  careerPathsError,
  existingRoadmap,
  isRoadmapLimitReached,
  roadmapLimitReachedDescription,
  onManageRoadmaps,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careerPathOptions: CareerPathOption[];
  selectedCareerPathId: string;
  onCareerPathChange: (careerPathId: string) => void;
  timeHorizonMonths: number;
  onTimeHorizonChange: (months: number) => void;
  onCreate: () => void;
  onReloadCareerPaths: () => Promise<void>;
  isCreatingRoadmap: boolean;
  isLoadingCareerPaths: boolean;
  careerPathsError: string | null;
  existingRoadmap: RoadmapListItemDto | null;
  isRoadmapLimitReached: boolean;
  roadmapLimitReachedDescription: string;
  onManageRoadmaps: () => void;
}) {
  const canSubmit =
    selectedCareerPathId.length > 0 &&
    !isCreatingRoadmap &&
    !existingRoadmap &&
    !isRoadmapLimitReached;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-poppins max-w-xl rounded-[24px] border p-0 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Utwórz roadmapę
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Wybierz ścieżkę kariery i horyzont czasowy.
          </DialogDescription>
        </DialogHeader>

        <Separator />
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Sciezka kariery</p>

            {isLoadingCareerPaths && careerPathOptions.length === 0 ? (
              <div className="bg-muted/40 text-muted-foreground rounded-xl border px-4 py-3 text-sm">
                Ladowanie sciezek kariery...
              </div>
            ) : careerPathOptions.length > 0 || selectedCareerPathId ? (
              <Select value={selectedCareerPathId} onValueChange={onCareerPathChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz sciezke kariery" />
                </SelectTrigger>
                <SelectContent>
                  {careerPathOptions.map((careerPath) => (
                    <SelectItem key={careerPath.id} value={careerPath.id}>
                      {careerPath.careerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-xl border border-dashed p-4">
                <p className="text-sm font-medium">Brak sciezek kariery do wyboru.</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  Najpierw wygeneruj lub odswiez rekomendacje w asystencie, zeby miec z czego
                  utworzyc roadmapę.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onReloadCareerPaths()}
                  >
                    Odswiez sciezki
                  </Button>
                  <Button asChild>
                    <Link href="/assistant">Przejdz do asystenta</Link>
                  </Button>
                </div>
              </div>
            )}

            {careerPathsError ? <p className="text-sm text-rose-600">{careerPathsError}</p> : null}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Horyzont czasowy</p>
            <div className="flex flex-wrap gap-2">
              {timeHorizonOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onTimeHorizonChange(option)}
                  className={cn(
                    'font-poppins min-w-0 flex-1 basis-[calc(50%-0.25rem)] cursor-pointer rounded-[7px] border px-3 py-2 text-center text-sm transition-colors md:flex-none md:basis-auto',
                    option === timeHorizonMonths
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option} mies.
                </button>
              ))}
            </div>
          </div>

          {isRoadmapLimitReached ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-800">
                Osiągnięto limit roadmap dla obecnego planu.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-rose-700">
                {roadmapLimitReachedDescription}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onManageRoadmaps();
                  }}
                >
                  Usuń roadmapę
                </Button>
                <Button asChild>
                  <Link href="/pricing">Idź Pro</Link>
                </Button>
              </div>
            </div>
          ) : existingRoadmap ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Masz juz roadmapę dla tej sciezki.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-700">
                Zamiast tworzyc duplikat, przejdz od razu do istniejacego planu.
              </p>
              <div className="mt-4">
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/roadmap/${existingRoadmap.id}`}>Otworz istniejaca roadmapę</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t px-6 pt-5 pb-6 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button type="button" onClick={() => void onCreate()} disabled={!canSubmit}>
            {isCreatingRoadmap ? 'Tworzenie...' : 'Utwórz roadmapę'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateRoadmapButton({
  onClick,
  disabled,
  tooltipContent,
  className,
  wrapperClassName,
}: {
  onClick: () => void;
  disabled: boolean;
  tooltipContent: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const button = (
    <Button
      type="button"
      variant="outline"
      className={cn('font-poppins gap-2', disabled && 'cursor-not-allowed', className)}
      onClick={onClick}
      disabled={disabled}
    >
      <Plus className="h-4 w-4" />
      Stwórz roadmapę
    </Button>
  );

  if (!disabled) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', wrapperClassName)} tabIndex={0}>
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="font-poppins max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

function EmptyState({
  onCreate,
  isCreateDisabled,
  createTooltipContent,
}: {
  onCreate: () => void;
  isCreateDisabled: boolean;
  createTooltipContent: string;
}) {
  return (
    <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center md:p-8">
      <Layers3 className="text-muted-foreground mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-medium">Brak aktywnych roadmap</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-sm leading-relaxed">
        Nie masz jeszcze żadnej aktywnej roadmapy.
      </p>
      <CreateRoadmapButton
        onClick={onCreate}
        disabled={isCreateDisabled}
        tooltipContent={createTooltipContent}
        className="w-full md:w-auto"
        wrapperClassName="w-full md:w-auto"
      />
    </div>
  );
}
