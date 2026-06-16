'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { stage: 'Junior', optymistyczny: 7500, realistyczny: 6800, ostrozny: 6000 },
  { stage: 'Mid', optymistyczny: 13200, realistyczny: 12000, ostrozny: 10200 },
  { stage: 'Senior', optymistyczny: 19200, realistyczny: 18000, ostrozny: 15800 },
  { stage: 'Lead/Expert', optymistyczny: 21200, realistyczny: 19800, ostrozny: 17800 },
];

const chartConfig = {
  optymistyczny: { label: 'Optymistyczny', color: '#C7A9FE' },
  realistyczny: { label: 'Realistyczny', color: '#9296FD' },
  ostrozny: { label: 'Ostrożny', color: '#4FA3E3' },
} satisfies ChartConfig;

export const SalaryProgressionChart = () => {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto min-h-0 w-full flex-1">
      <LineChart data={chartData} margin={{ top: 12, right: 16, left: -6, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey="stage"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fill: 'rgba(241,244,255,0.5)', fontSize: 12 }}
        />
        <YAxis
          width={50}
          tickLine={false}
          axisLine={false}
          domain={[0, 24000]}
          ticks={[0, 6000, 12000, 18000, 24000]}
          tick={{ fill: 'rgba(241,244,255,0.5)', fontSize: 12 }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          dataKey="ostrozny"
          type="monotone"
          stroke="var(--color-ostrozny)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="realistyczny"
          type="monotone"
          stroke="var(--color-realistyczny)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="optymistyczny"
          type="monotone"
          stroke="var(--color-optymistyczny)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
};

export default SalaryProgressionChart;
