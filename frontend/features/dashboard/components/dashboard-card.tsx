import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DashboardCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
} & React.ComponentProps<'div'>) {
  return (
    <Card
      className={cn(
        'font-poppins text-dashboard-foreground bg-dashboard flex h-full min-h-0 flex-col overflow-hidden',
        className
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="show-scrollbar flex-1 overflow-y-auto">{children}</CardContent>
    </Card>
  );
}
