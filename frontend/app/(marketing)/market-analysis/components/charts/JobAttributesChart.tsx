'use client';

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { attribute: 'Doświadczenie praktyczne', value: 85 },
  { attribute: 'Kompetencje twarde', value: 92 },
  { attribute: 'Kreatywność', value: 48 },
  { attribute: 'Zespół', value: 62 },
  { attribute: 'Samodzielność', value: 82 },
  { attribute: 'Kompetencje miękkie', value: 58 },
  { attribute: 'Certyfikacja', value: 52 },
  { attribute: 'Umiejętności techniczne', value: 88 },
];

const chartConfig = {
  value: { label: 'Poziom', color: '#9296FD' },
} satisfies ChartConfig;

export const JobAttributesChart = () => {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto min-h-0 w-full flex-1">
      <RadarChart
        data={chartData}
        outerRadius="62%"
        margin={{ top: 8, right: 50, bottom: 8, left: 50 }}
      >
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarGrid stroke="rgba(255,255,255,0.12)" />
        <PolarAngleAxis
          dataKey="attribute"
          tick={{ fill: 'rgba(241,244,255,0.55)', fontSize: 10 }}
        />
        <Radar
          dataKey="value"
          fill="var(--color-value)"
          fillOpacity={0.45}
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 0 }}
        />
      </RadarChart>
    </ChartContainer>
  );
};

export default JobAttributesChart;
