'use client';

import { ArrowRight, CalendarRange, CircleDot, LoaderCircle, X } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Timeline from '@/features/assistant/components/Timeline';
import type { RoadmapNodeData } from '@/features/roadmap/components/RoadmapTileNode';
import type { StepStatus } from '@/lib/types/roadmap';
import { cn } from '@/lib/utils';

type Props = {
  data: RoadmapNodeData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStepStatusChange?: (status: StepStatus) => void | Promise<void>;
  isStepStatusUpdating?: boolean;
};

const stepStatusLabels = {
  NotStarted: 'Nie rozpoczęto',
  InProgress: 'W trakcie',
  Completed: 'Ukończono',
} as const;

const stepTypeLabels = {
  Required: 'Wymagany',
  Optional: 'Opcjonalny',
} as const;

const stepStatusOrder: StepStatus[] = ['NotStarted', 'InProgress', 'Completed'];

const headerBadgeBaseClassName =
  'font-poppins inline-flex items-center gap-2 border border-r-4 border-b-4 px-3 py-1 text-[11px] shadow-[0_12px_24px_-24px_rgba(15,23,42,0.55)]';

const stepTypeBadgeClassNames = {
  Required: 'border-slate-200 bg-white text-slate-950',
  Optional: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

const stepTypeIndicatorClassNames = {
  Required: 'bg-slate-950',
  Optional: 'border border-slate-400 bg-white',
} as const;

const stepStatusBadgeClassNames = {
  NotStarted: 'border-slate-200 bg-white text-slate-700',
  InProgress: 'border-amber-200 bg-amber-50 text-amber-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
} as const;

const stepStatusIndicatorClassNames = {
  NotStarted: 'border border-slate-400 bg-white',
  InProgress: 'bg-amber-500',
  Completed: 'bg-emerald-500',
} as const;

const getPolishPluralForm = (count: number) => {
  const absoluteCount = Math.abs(count);
  const mod10 = absoluteCount % 10;
  const mod100 = absoluteCount % 100;

  if (absoluteCount === 1) {
    return 'one';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'few';
  }

  return 'many';
};

const formatCountLabel = (count: number, one: string, few: string, many: string) => {
  const form = getPolishPluralForm(count);

  if (form === 'one') {
    return `${count} ${one}`;
  }

  if (form === 'few') {
    return `${count} ${few}`;
  }

  return `${count} ${many}`;
};

const formatStepCountLabel = (count: number) => formatCountLabel(count, 'krok', 'kroki', 'kroków');

const formatRequiredCountLabel = (count: number) =>
  formatCountLabel(count, 'wymagany', 'wymagane', 'wymaganych');

const formatOptionalCountLabel = (count: number) =>
  formatCountLabel(count, 'opcjonalny', 'opcjonalne', 'opcjonalnych');

const formatCompletedCountLabel = (count: number) =>
  formatCountLabel(count, 'ukończony', 'ukończone', 'ukończonych');

const formatActiveCountLabel = (count: number) =>
  formatCountLabel(count, 'aktywny', 'aktywne', 'aktywnych');

const formatNotStartedCountLabel = (count: number) =>
  formatCountLabel(count, 'nie rozpoczęty', 'nie rozpoczęte', 'nie rozpoczętych');

const parseTimelineRange = (value?: string | null) => {
  if (!value) return null;

  const match = value.trim().match(/^M?(\d+)(?:\s*-\s*M?(\d+))?$/i);
  if (!match) return null;

  const startMonth = Number(match[1]);
  const endMonth = Number(match[2] ?? match[1]);

  if (!Number.isFinite(startMonth) || !Number.isFinite(endMonth)) return null;

  return {
    startMonth: Math.min(startMonth, endMonth),
    endMonth: Math.max(startMonth, endMonth),
  };
};

const formatMonthRange = (startMonth: number, endMonth: number) =>
  startMonth === endMonth ? `M${startMonth}` : `M${startMonth}-M${endMonth}`;

const formatDurationLabel = (durationMonths: number) =>
  durationMonths === 1 ? '1 miesiac' : `${durationMonths} mies.`;

const formatTimelineSummary = (startMonth: number, endMonth: number) =>
  startMonth === endMonth
    ? `Zaplanowane na miesiac ${startMonth}.`
    : `Zaplanowane od miesiaca ${startMonth} do ${endMonth}.`;

const detailCardSurfaceClassName =
  'relative overflow-hidden rounded-[12px] border border-b-4 border-r-4 border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.94)_52%,rgba(241,245,249,0.88))] shadow-xs';

const getNextStepStatus = (status: StepStatus) => {
  const currentIndex = stepStatusOrder.indexOf(status);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % stepStatusOrder.length;

  return stepStatusOrder[nextIndex];
};

const toTimelineStatus = (status: StepStatus) => {
  if (status === 'Completed') return 'completed' as const;
  if (status === 'InProgress') return 'current' as const;
  return 'upcoming' as const;
};

const getTimelineMeta = (data: RoadmapNodeData) => {
  const parsedRange = parseTimelineRange(data.timeLabel || data.timeline);
  const startMonth = data.timeStartMonth ?? parsedRange?.startMonth ?? null;
  const endMonth = data.timeEndMonth ?? parsedRange?.endMonth ?? startMonth;
  const hasMonthRange = startMonth != null && endMonth != null;
  const durationMonths = hasMonthRange ? endMonth - startMonth + 1 : null;
  const totalMonths =
    data.totalMonths ??
    (endMonth != null ? Math.max(Math.max(endMonth, 6), 12) : (parsedRange?.endMonth ?? 12));
  const rangeLabel = hasMonthRange ? formatMonthRange(startMonth, endMonth) : null;
  const rawLabel = data.timeLabel?.trim() || rangeLabel || data.timeline?.trim() || 'Brak danych';

  return {
    label: rawLabel,
    startMonth,
    endMonth,
    totalMonths,
    durationMonths,
    durationLabel: durationMonths ? formatDurationLabel(durationMonths) : null,
    rangeLabel,
    summaryLabel:
      hasMonthRange && durationMonths ? formatTimelineSummary(startMonth, endMonth) : rawLabel,
  };
};

const HeaderBadge = ({
  children,
  className,
  indicatorClassName,
}: {
  children: ReactNode;
  className?: string;
  indicatorClassName?: string;
}) => (
  <Badge variant="outline" className={cn(headerBadgeBaseClassName, className)}>
    {indicatorClassName ? (
      <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', indicatorClassName)} />
    ) : null}
    {children}
  </Badge>
);

const StatusHeaderButton = ({
  status,
  onClick,
  disabled,
}: {
  status: StepStatus;
  onClick?: (status: StepStatus) => void | Promise<void>;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    variant="outline"
    disabled={disabled}
    onClick={() => void onClick?.(getNextStepStatus(status))}
    className={cn(
      headerBadgeBaseClassName,
      'hover:text-none h-auto rounded-[7px] pr-2 pl-3 transition-transform hover:-translate-y-0.5',
      stepStatusBadgeClassNames[status]
    )}
  >
    <span
      aria-hidden
      className={cn('h-2.5 w-2.5 rounded-full', stepStatusIndicatorClassNames[status])}
    />
    <span>{stepStatusLabels[status]}</span>
    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-current/15 bg-white/75">
      {disabled ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" />
      )}
    </span>
  </Button>
);

const TimelineMetaCard = ({
  timelineMeta,
}: {
  timelineMeta: ReturnType<typeof getTimelineMeta> | null;
}) => (
  <div className={cn(detailCardSurfaceClassName, 'p-4')}>
    <div className="absolute top-2 right-2 h-16 w-16 rounded-full bg-slate-200/70 blur-2xl" />

    <div className="relative">
      <div className="flex items-center justify-between gap-3 text-slate-500">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase">Cel osiągniesz w ciągu</span>
        </div>
      </div>

      <Separator className="mt-3 bg-gray-300" />

      {timelineMeta?.durationLabel ? (
        <div className="mt-4 space-y-3">
          <p className="text-[18px] leading-none font-semibold tracking-[-0.04em] text-slate-950">
            {timelineMeta.durationLabel}
          </p>
          <p className="text-sm leading-6 text-slate-600">{timelineMeta.summaryLabel}</p>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600"></div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 font-medium text-slate-900">
          {timelineMeta?.label || 'Brak danych'}
        </p>
      )}
    </div>
  </div>
);

export function RoadmapNodeDetailsSheet({
  data,
  open,
  onOpenChange,
  onStepStatusChange,
  isStepStatusUpdating = false,
}: Props) {
  const [cachedData, setCachedData] = useState<RoadmapNodeData | null>(data);

  useEffect(() => {
    if (data) {
      setCachedData(data);
    }
  }, [data]);

  const displayData = data ?? cachedData;
  const isPhaseNode = displayData?.nodeKind === 'phase';
  const timelineMeta = displayData ? getTimelineMeta(displayData) : null;
  const phaseTitle = isPhaseNode
    ? displayData.title
    : displayData?.phaseTitle?.trim() || displayData?.phase?.trim() || 'Nie przypisano';
  const phaseLabel = displayData?.phase?.trim() || (isPhaseNode ? 'Faza' : 'Roadmap');
  const subtitle = displayData?.subtitle?.trim() || null;
  const description =
    displayData?.description?.trim() ||
    displayData?.summary?.trim() ||
    (isPhaseNode
      ? 'Ta faza nie ma jeszcze dodatkowego opisu.'
      : 'Ten krok nie ma jeszcze dodatkowego opisu.');
  const topics = Array.from(
    new Set((displayData?.topics ?? []).map((topic) => topic.trim()).filter(Boolean))
  );
  const currentStepStatus = displayData?.stepStatus ?? 'NotStarted';
  const statusLabel = isPhaseNode ? null : stepStatusLabels[currentStepStatus];
  const phaseSteps = displayData?.phaseSteps ?? [];
  const phaseStepCount = phaseSteps.length || displayData?.phaseStepCount || 0;
  const phaseRequiredCount = phaseSteps.length
    ? phaseSteps.filter((step) => step.stepType === 'Required').length
    : Math.min(displayData?.phaseRequiredCount ?? 0, phaseStepCount);
  const phaseOptionalCount = phaseSteps.length
    ? phaseSteps.filter((step) => step.stepType === 'Optional').length
    : Math.max(0, displayData?.phaseOptionalCount ?? phaseStepCount - phaseRequiredCount);
  const phaseCompletedCount = phaseSteps.filter((step) => step.status === 'Completed').length;
  const phaseActiveCount = phaseSteps.filter((step) => step.status === 'InProgress').length;
  const phaseNotStartedCount = Math.max(0, phaseStepCount - phaseCompletedCount - phaseActiveCount);
  const phaseTimelineItems = phaseSteps.length
    ? phaseSteps.map((step) => ({
        title: step.title,
        description: `${stepTypeLabels[step.stepType]} • ${stepStatusLabels[step.status]}`,
        status: toTimelineStatus(step.status),
        isOptional: step.stepType === 'Optional',
      }))
    : Array.from({ length: phaseStepCount }, (_, index) => ({
        title: `Krok ${index + 1}`,
        description:
          index < phaseRequiredCount
            ? `Krok ${index + 1} jest wymagany.`
            : `Krok ${index + 1} jest opcjonalny.`,
        status: index < phaseRequiredCount ? ('completed' as const) : ('upcoming' as const),
        isOptional: index >= phaseRequiredCount,
      }));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {displayData ? (
        <SheetContent
          side="right"
          className="font-poppins w-full gap-0 overflow-hidden border-l border-slate-200 bg-white/95 p-0 backdrop-blur-xl data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:max-w-md"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="relative gap-4 border-b border-slate-100 px-6 pt-5 pb-4">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-5 right-5 h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>

              <div className="flex flex-wrap gap-2 pr-12">
                <HeaderBadge className="border-slate-200 bg-white text-slate-600">
                  {phaseLabel}
                </HeaderBadge>
                {displayData.stepType ? (
                  <HeaderBadge
                    className={stepTypeBadgeClassNames[displayData.stepType]}
                    indicatorClassName={stepTypeIndicatorClassNames[displayData.stepType]}
                  >
                    {stepTypeLabels[displayData.stepType]}
                  </HeaderBadge>
                ) : null}
                {statusLabel ? (
                  onStepStatusChange ? (
                    <StatusHeaderButton
                      status={currentStepStatus}
                      disabled={isStepStatusUpdating}
                      onClick={onStepStatusChange}
                    />
                  ) : (
                    <HeaderBadge
                      className={stepStatusBadgeClassNames[currentStepStatus]}
                      indicatorClassName={stepStatusIndicatorClassNames[currentStepStatus]}
                    >
                      {statusLabel}
                    </HeaderBadge>
                  )
                ) : null}
              </div>

              <div className="space-y-3">
                <SheetTitle className="font-poppins pr-12 text-2xl leading-tight font-semibold text-slate-950">
                  {displayData.title}
                </SheetTitle>
                {subtitle ? (
                  <p className="pr-12 text-sm leading-6 font-medium text-slate-900">{subtitle}</p>
                ) : null}
                <SheetDescription className="text-sm leading-6 font-medium text-slate-500">
                  {isPhaseNode ? (
                    'Szczegoly fazy roadmapy.'
                  ) : (
                    <>
                      Element przypisany do:{' '}
                      <span className="font-medium text-slate-900">{phaseTitle}</span>.
                    </>
                  )}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 pt-4 pb-6">
              <TimelineMetaCard timelineMeta={timelineMeta} />

              {isPhaseNode ? (
                <div className="rounded-[12px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.22)]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CircleDot className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase">Kroki</span>
                  </div>

                  {phaseStepCount > 0 ? (
                    <>
                      <Timeline
                        items={phaseTimelineItems}
                        variant="phase-progress"
                        className="mt-4"
                      />

                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                        <div className="font-medium text-slate-900">
                          {formatStepCountLabel(phaseStepCount)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-slate-950 bg-slate-950" />
                          <span>{formatRequiredCountLabel(phaseRequiredCount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-slate-400 bg-white" />
                          <span>{formatOptionalCountLabel(phaseOptionalCount)}</span>
                        </div>
                      </div>

                      {phaseSteps.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <HeaderBadge
                            className={stepStatusBadgeClassNames.Completed}
                            indicatorClassName={stepStatusIndicatorClassNames.Completed}
                          >
                            {formatCompletedCountLabel(phaseCompletedCount)}
                          </HeaderBadge>
                          <HeaderBadge
                            className={stepStatusBadgeClassNames.InProgress}
                            indicatorClassName={stepStatusIndicatorClassNames.InProgress}
                          >
                            {formatActiveCountLabel(phaseActiveCount)}
                          </HeaderBadge>
                          <HeaderBadge
                            className={stepStatusBadgeClassNames.NotStarted}
                            indicatorClassName={stepStatusIndicatorClassNames.NotStarted}
                          >
                            {formatNotStartedCountLabel(phaseNotStartedCount)}
                          </HeaderBadge>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-4 text-[15px] leading-7 text-slate-700">
                      Ta faza nie ma jeszcze zadnych krokow.
                    </p>
                  )}
                </div>
              ) : (
                <Card className={cn(detailCardSurfaceClassName, 'gap-0 py-0')}>
                  <CardHeader className="gap-0 px-5 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CircleDot className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase">Opis</span>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5">
                    <Separator className="bg-gray-300" />

                    <div className="mt-4 space-y-5">
                      <p className="text-[15px] leading-7 text-slate-700">{description}</p>

                      {topics.length > 0 ? (
                        <div className="rounded-[14px] border border-white/80 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                          <div className="mt-3 flex flex-wrap gap-2">
                            {topics.map((topic) => (
                              <Badge
                                key={topic}
                                variant="outline"
                                className={cn(
                                  headerBadgeBaseClassName,
                                  'border-slate-200 bg-white text-slate-950'
                                )}
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
