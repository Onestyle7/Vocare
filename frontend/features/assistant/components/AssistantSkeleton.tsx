import Section from '@/components/SupportComponents/Section';
import { Skeleton } from '@/components/ui/skeleton';

const ALTERNATIVE_PATHS_COUNT = 3;

/**
 * Odwzorowuje początkowy (zwinięty) stan MainPageAssisstant — każdy kafelek to jeden blok
 * skeletonu o tym samym kształcie i przybliżonej wysokości, żeby po załadowaniu nic nie skakało.
 */
export default function AssistantSkeleton() {
  return (
    <Section
      className="relative -mt-21 flex w-full items-center justify-center overflow-x-hidden pt-14"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
    >
      <div className="mt-8 w-full min-w-0 px-4 xl:mt-12 xl:px-10 2xl:px-30" aria-busy="true">
        <span className="sr-only" role="status">
          Ładowanie rekomendacji...
        </span>

        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col items-center justify-center md:p-8">
          <Skeleton className="mt-1 mb-6 h-9.5 w-45 rounded-full" />

          <Skeleton className="mb-4 h-105 w-full rounded-[28px] md:h-65" />

          {Array.from({ length: ALTERNATIVE_PATHS_COUNT }, (_, index) => (
            <Skeleton key={index} className="mb-4 h-90 w-full rounded-[28px] md:h-42.5" />
          ))}

          <div className="mt-16 flex w-full justify-center">
            <Skeleton className="h-12 w-1/2 rounded-full" />
          </div>
        </div>
      </div>
    </Section>
  );
}
