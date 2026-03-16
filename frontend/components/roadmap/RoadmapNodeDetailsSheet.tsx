'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CalendarRange, CircleDot, Layers3, Sparkles, X } from 'lucide-react';

import type { RoadmapNodeData } from '@/components/roadmap/RoadmapTileNode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type Props = {
  data: RoadmapNodeData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const stepStatusLabels = {
  NotStarted: 'Not started',
  InProgress: 'In progress',
  Completed: 'Completed',
} as const;

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

const getTimelineMeta = (data: RoadmapNodeData) => {
  const parsedRange = parseTimelineRange(data.timeLabel || data.timeline);
  const startMonth = data.timeStartMonth ?? parsedRange?.startMonth ?? null;
  const endMonth = data.timeEndMonth ?? parsedRange?.endMonth ?? startMonth;
  const totalMonths =
    data.totalMonths ??
    (endMonth ? Math.max(Math.max(endMonth, 6), 12) : (parsedRange?.endMonth ?? 12));

  return {
    label:
      data.timeLabel?.trim() ||
      (startMonth && endMonth ? formatMonthRange(startMonth, endMonth) : '') ||
      data.timeline?.trim() ||
      'Brak danych',
    startMonth,
    endMonth,
    totalMonths,
  };
};

const MetaCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-[12px] border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
    <div className="flex items-center gap-2 text-slate-500">
      {icon}
      <span className="text-[11px] font-semibold uppercase">{label}</span>
    </div>
    <Separator className="mt-3 bg-gray-300" />
    <p className="mt-3 text-sm leading-6 font-medium text-slate-900">{value}</p>
  </div>
);

export function RoadmapNodeDetailsSheet({ data, open, onOpenChange }: Props) {
  const [cachedData, setCachedData] = useState<RoadmapNodeData | null>(data);

  useEffect(() => {
    if (data) {
      setCachedData(data);
    }
  }, [data]);

  const displayData = data ?? cachedData;
  const timelineMeta = displayData ? getTimelineMeta(displayData) : null;
  const phaseTitle =
    displayData?.nodeKind === 'phase'
      ? displayData.title
      : displayData?.phaseTitle?.trim() || displayData?.phase?.trim() || 'Nie przypisano';
  const phaseLabel =
    displayData?.phase?.trim() || (displayData?.nodeKind === 'phase' ? 'Phase' : 'Roadmap');
  const description =
    displayData?.summary?.trim() ||
    (displayData?.nodeKind === 'phase'
      ? 'Ta faza nie ma jeszcze dodatkowego opisu.'
      : 'Ten krok nie ma jeszcze dodatkowego opisu.');
  const statusLabel = displayData?.stepStatus ? stepStatusLabels[displayData.stepStatus] : null;
  const visibleMonths = timelineMeta
    ? Array.from({ length: timelineMeta.totalMonths }, (_, index) => index + 1)
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {displayData ? (
        <SheetContent
          side="right"
          className="font-poppins w-full gap-0 overflow-hidden border-l border-slate-200 bg-white/95 p-0 backdrop-blur-xl data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:max-w-md"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="relative gap-4 border-b border-slate-100 px-6 py-5">
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
                <Badge
                  variant="outline"
                  className="border-r-4 border-b-4 border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600"
                >
                  {phaseLabel}
                </Badge>
                {displayData.stepType ? (
                  <Badge
                    className={cn(
                      'border-r-4 border-b-4 px-3 py-1 text-[11px]',
                      displayData.stepType === 'Required'
                        ? 'bg-slate-950 text-white hover:bg-slate-950'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {displayData.stepType}
                  </Badge>
                ) : null}
                {statusLabel ? (
                  <Badge
                    variant="outline"
                    className="border-r-4 border-b-4 px-3 py-1 text-[11px] text-slate-600"
                  >
                    {statusLabel}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-2">
                <SheetTitle className="font-poppins pr-12 text-2xl leading-tight font-semibold text-slate-950">
                  {displayData.title}
                </SheetTitle>
                <SheetDescription className="text-sm leading-6 text-slate-500">
                  {displayData.nodeKind === 'phase'
                    ? 'Szczegoly fazy roadmapy.'
                    : `Element przypisany do: ${phaseTitle}.`}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetaCard icon={<Layers3 className="h-4 w-4" />} label="Faza" value={phaseTitle} />
                <MetaCard
                  icon={<CalendarRange className="h-4 w-4" />}
                  label="Czas"
                  value={timelineMeta?.label || 'Brak danych'}
                />
              </div>

              <div className="rounded-[12px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-2 text-slate-500">
                  <CircleDot className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase">Opis</span>
                </div>
                <p className="mt-4 text-[15px] leading-7 text-slate-700">{description}</p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[11px] font-semibold tracking-[0.22em] uppercase">
                        Mock timeline
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {timelineMeta?.label || 'Brak zakresu'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-3 py-1 text-[11px] tracking-[0.14em] text-slate-500 uppercase"
                  >
                    Roadmap span
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Na ten moment zakres jest mockowany w perspektywie calej roadmapy i bazuje na
                  aktualnym przedziale fazy.
                </p>

                {timelineMeta ? (
                  <div className="mt-5">
                    <div
                      className="grid gap-1.5"
                      style={{
                        gridTemplateColumns: `repeat(${timelineMeta.totalMonths}, minmax(0, 1fr))`,
                      }}
                    >
                      {visibleMonths.map((month) => {
                        const isActive =
                          timelineMeta.startMonth != null &&
                          timelineMeta.endMonth != null &&
                          month >= timelineMeta.startMonth &&
                          month <= timelineMeta.endMonth;

                        return (
                          <div
                            key={month}
                            className={cn(
                              'h-2 rounded-full transition-colors',
                              isActive ? 'bg-slate-950' : 'bg-slate-200'
                            )}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      <span>M1</span>
                      <span>{timelineMeta.label}</span>
                      <span>M{timelineMeta.totalMonths}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <Separator className="bg-slate-200" />

              <div className="space-y-2 pb-4">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                  Podglad
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  Drawer korzysta z aktualnych danych roadmapy. Timeline jest tymczasowo mockowany,
                  dopoki fazy nie dostana osobnych pol czasu w API.
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
