import { Skeleton } from '@/components/ui/skeleton';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';

const ROADMAP_CARDS_COUNT = 3;

/** Odwzorowuje układ RoadmapDashboardPage — nagłówek z limitem i siatka kart roadmap. */
export default function RoadmapDashboardSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true">
      <span className="sr-only" role="status">
        Ładowanie roadmap...
      </span>

      <div className="relative">
        <GridBackgroundDemo />

        <div className="relative z-10 w-full">
          <div className="container mx-auto">
            <div className="flex flex-col gap-8 md:gap-10">
              <div className="flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <Skeleton className="h-5.5 w-10" />
                  <Skeleton className="h-9 w-40" />
                </div>

                <div className="flex w-full flex-col gap-2">
                  <Skeleton className="h-9 w-56 md:h-12 md:w-96" />
                  <div className="flex w-full max-w-xl flex-col gap-2.5 py-1 lg:max-w-lg">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                {Array.from({ length: ROADMAP_CARDS_COUNT }, (_, index) => (
                  <Skeleton key={index} className="h-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
