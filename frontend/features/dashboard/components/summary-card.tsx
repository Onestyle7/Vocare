import { Info, LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from './dashboard-card';

export interface SummaryCardDataItem {
  name: string;
  value: number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
}

export default function SummaryCard({
  data,
  className,
  isProfileEmpty,
}: { data: SummaryCardDataItem[] | null; isProfileEmpty: boolean } & React.ComponentProps<'div'>) {
  return (
    <DashboardCard className={cn('', className)} title="Podsumowanie">
      <DashboardCardHeader>
        <DashboardCardTitle>Podsumowanie</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-3">
        {data &&
          data.map((stat) => (
            <div
              key={stat.name}
              className="border-dashboard-border flex items-center justify-start gap-4 rounded-md border px-4 py-2"
            >
              <stat.icon className="size-7!" />
              <div className="">
                <p className="text-dashboard-secondary-foreground text-xs">{stat.name}</p>
                <p className="text-dashboard-primary text-xl font-semibold">{stat.value ?? '-'}</p>
              </div>
            </div>
          ))}
        {isProfileEmpty && (
          <div className="flex h-full justify-center">
            <p className="text-dashboard-secondary-foreground flex items-center gap-2 py-8 text-center">
              <Info />
              Uzupełnij profil aby wyświetlić statystyki
            </p>
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
