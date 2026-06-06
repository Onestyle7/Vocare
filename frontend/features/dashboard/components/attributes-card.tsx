'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { PROFILE_ATTRIBUTES_MOCK } from '@/app/dashboard/page';
import { cn } from '@/lib/utils';

import DashboardCard from './dashboard-card';

export default function AttributesCard({
  data,
  className,
}: { data: typeof PROFILE_ATTRIBUTES_MOCK } & React.ComponentProps<'div'>) {
  return (
    <DashboardCard className={cn('gap-0 pb-1', className)} title="Atrybuty Profilu">
      <ResponsiveContainer width="100%" height={340}>
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
    </DashboardCard>
  );
}
