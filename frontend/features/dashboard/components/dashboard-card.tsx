import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function DashboardCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'font-poppins text-dashboard-foreground bg-dashboard flex h-full min-h-0 flex-col overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

export function DashboardCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn(className)} {...props} />;
}

export function DashboardCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof CardTitle>) {
  return <CardTitle className={cn('text-lg font-medium tracking-tight', className)} {...props} />;
}

export function DashboardCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn('show-scrollbar flex-1 overflow-y-auto pt-0', className)}
      {...props}
    />
  );
}
