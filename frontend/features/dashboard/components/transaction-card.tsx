import { PAYMENT_HISTORY_MOCK } from '@/app/dashboard/page';
import { cn } from '@/lib/utils';

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from './dashboard-card';

export default function TransactionCard({
  data,
  className,
}: { data: typeof PAYMENT_HISTORY_MOCK } & React.ComponentProps<'div'>) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
  });

  return (
    <DashboardCard className={cn('', className)} title="Historia transakcji">
      <DashboardCardHeader>
        <DashboardCardTitle>Historia transakcji</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-3">
        {data.map((payment) => (
          <div
            key={`${payment.type}-${payment.amount}-${payment.createdAt}`}
            className="border-dashboard-border flex items-start justify-between gap-4 border-b px-4 py-2"
          >
            <p className="text-dashboard-primary-foreground text-lg">{payment.type}</p>
            <div>
              <p className="text-dashboard-primary-foreground text-lg">
                {payment.amount} {payment.currency}
              </p>
              <p className="text-dashboard-secondary-foreground text-sm">
                {dateFormatter.format(new Date(payment.createdAt))}
              </p>
            </div>
          </div>
        ))}
      </DashboardCardContent>
    </DashboardCard>
  );
}
