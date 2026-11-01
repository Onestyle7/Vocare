import { Skeleton } from '@/components/ui/skeleton';

/**
 * Odwzorowuje układ DetailedMarketAnalysis — nagłówek, kolumny trendów i popytu na umiejętności
 * oraz karta branży jako pełne bloki skeletonu o zbliżonych wymiarach.
 */
export default function MarketAnalysisSkeleton() {
  return (
    <div className="relative mx-auto min-h-screen px-4 py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Ładowanie analizy rynku...
      </span>

      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Skeleton className="h-104 rounded-3xl md:h-46" />

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-180 rounded-3xl" />
            <Skeleton className="h-180 rounded-3xl" />
          </div>

          <Skeleton className="h-350 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
