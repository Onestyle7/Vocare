'use client';

import * as React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { cn } from '@/lib/utils';

import { DashboardCard, DashboardCardContent, DashboardCardTitle } from './dashboard-card';

interface ProgressDoubleCardProps extends React.ComponentProps<typeof DashboardCard> {
  profilePercentage?: number;
  salaryPercentage?: number;
  currentSalary?: string;
  expectedSalary?: string;
}

export default function ProgressDoubleCard({
  profilePercentage = 82,
  salaryPercentage = 75,
  currentSalary = '7.5 tyś. PLN/m',
  expectedSalary = '10 tyś. PLN/m',
  className,
  ...props
}: ProgressDoubleCardProps) {
  const profileData = [
    { value: profilePercentage, color: 'var(--dashboard-primary, #8b5cf6)' },
    { value: 100 - profilePercentage, color: '#1f1f2e' },
  ];

  const salaryData = [
    { value: salaryPercentage, color: 'var(--dashboard-primary, #8b5cf6)' },
    { value: 100 - salaryPercentage, color: '#1f1f2e' },
  ];

  return (
    <DashboardCard className={cn('px-6 lg:px-0', className)} {...props}>
      <DashboardCardContent className="flex flex-col divide-y p-0 md:flex-row md:divide-x md:divide-y-0">
        <div className="flex flex-1 flex-col px-0 lg:px-6">
          <DashboardCardTitle>Uzupełnienie Profilu</DashboardCardTitle>
          <div className="relative flex flex-1 items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-semibold tracking-tight text-white">
                {profilePercentage}%
              </span>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={profileData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={78}
                  startAngle={0}
                  endAngle={-360}
                  dataKey="value"
                  stroke="none"
                >
                  {profileData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-0 lg:px-6">
          <DashboardCardTitle className="pt-6 lg:pt-0">Postęp w Wynagrodzeniu</DashboardCardTitle>

          <div className="relative mt-4 flex flex-col items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-3xl font-semibold tracking-tight">{salaryPercentage}%</span>
              <span className="text-dashboard-secondary-foreground mt-1 text-xs font-light">
                Realizacja celu
              </span>
            </div>

            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={salaryData}
                  cx="50%"
                  cy="75%"
                  innerRadius={70}
                  outerRadius={83}
                  startAngle={180}
                  endAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {salaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-dashboard-accent rounded-xl p-3 text-center">
              <span className="text-dashboard- block text-sm font-medium">{currentSalary}</span>
              <span className="text-dashboard-secondary-foreground mt-0.5 block text-[11px]">
                Twoje zarobki
              </span>
            </div>

            <div className="bg-dashboard-accent rounded-xl p-3 text-center">
              <span className="block text-sm font-medium">{expectedSalary}</span>
              <span className="text-dashboard-secondary-foreground mt-0.5 block text-[11px]">
                Oczekiwane
              </span>
            </div>
          </div>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
