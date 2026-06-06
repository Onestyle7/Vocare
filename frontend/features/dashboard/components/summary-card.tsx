import { PROFILE_SUMMARY_MOCK } from '@/app/dashboard/page';
import { cn } from '@/lib/utils';

import DashboardCard from './dashboard-card';

export default function SummaryCard({
  data,
  className,
}: { data: typeof PROFILE_SUMMARY_MOCK } & React.ComponentProps<'div'>) {
  return (
    <DashboardCard className={cn('', className)} title="Podsumowanie">
      <div className="space-y-3">
        {data.map((stat) => (
          <div
            key={stat.name}
            className="border-dashboard-border flex items-center justify-start gap-4 rounded-md border px-4 py-2"
          >
            <stat.icon className="size-7!" />
            <div className="">
              <p className="text-dashboard-secondary-foreground text-xs">{stat.name}</p>
              <p className="text-dashboard-primary text-xl font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
