import { Info } from 'lucide-react';

import { PaymentHistoryItem } from '@/features/billing/dal/api';
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
}: { data: PaymentHistoryItem[] } & React.ComponentProps<'div'>) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
  });

  return (
    <DashboardCard className={cn('', className)} title="Historia transakcji">
      <DashboardCardHeader>
        <DashboardCardTitle>Historia transakcji</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-3">
        {data.length > 0 ? (
          data.map((payment) => (
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
          ))
        ) : (
          <div className="flex h-full justify-center">
            <p className="text-dashboard-secondary-foreground flex items-center gap-2 py-4 text-center">
              <Info />
              Brak historii transakcji
            </p>
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
