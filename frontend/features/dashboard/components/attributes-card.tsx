'use client';

import { Info } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { cn } from '@/lib/utils';

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from './dashboard-card';

export interface AttributesCardDataItem {
  attribute: string;
  score: number;
}

export default function AttributesCard({
  data,
  className,
}: {
  data?: AttributesCardDataItem[] | null;
} & React.ComponentProps<'div'>) {
  return (
    <DashboardCard className={cn('gap-0 pb-1', className)}>
      <DashboardCardHeader>
        <DashboardCardTitle>Atrybuty Profilu</DashboardCardTitle>
      </DashboardCardHeader>
      {data && (
        <DashboardCardContent className="min-w-0 p-0">
          <ResponsiveContainer width="100%" height={325}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="var(--dashboard-accent-foreground)" />
              <PolarAngleAxis
                dataKey="attribute"
                tick={{ fill: 'var(--dashboard-primary-foreground)', fontSize: 11 }}
              />
              <PolarRadiusAxis
                tick={{ fill: 'var(--dashboard-primary-gradient)', fontSize: 0 }}
                angle={30}
                domain={[0, 100]}
                opacity={0}
              />
              <Radar
                name="Poziom"
                dataKey="score"
                stroke="var(--dashboard-primary)"
                fill="var(--dashboard-primary)"
                fillOpacity={0.35}
              />
              <Tooltip
                contentStyle={{
                  background: '#191A23',
                  border: '1px solid var(--dashboard-border)',
                  borderRadius: 12,
                }}
                formatter={(value: number) => `${value}%`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </DashboardCardContent>
      )}
      {!data && (
        <div className="flex h-full justify-center">
          <p className="text-dashboard-secondary-foreground flex items-center gap-2 py-8 text-center">
            <Info />
            Uzupełnij profil aby wyświetlić statystyki
          </p>
        </div>
      )}
    </DashboardCard>
  );
}
