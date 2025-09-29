'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

type Tone = 'dark' | 'green' | 'purple' | 'neutral';

interface StatWidgetProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  tone?: Tone;
  className?: string;
  children?: React.ReactNode; // optional chart
}

const toneClasses: Record<Tone, string> = {
  dark: 'bg-[#0f1115] text-white',
  green: 'bg-[#C6F6D5] text-[#0a0a0a] dark:bg-[#1b2b22] dark:text-white',
  purple: 'bg-[#E9D8FD] text-[#0a0a0a] dark:bg-[#231a32] dark:text-white',
  neutral: 'bg-white text-[#0a0a0a] dark:bg-[#0f0f12] dark:text-white',
};

const StatWidget: React.FC<StatWidgetProps> = ({
  title,
  value,
  subtitle,
  tone = 'neutral',
  className = '',
  children,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border shadow-sm ${toneClasses[tone]} ${className}`}
    >
      <div className="flex items-start justify-between p-4">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <div className="mt-2 text-3xl leading-none font-semibold">{value}</div>
          {subtitle && <p className="mt-2 text-xs opacity-70">{subtitle}</p>}
        </div>
        <div className="rounded-full border border-white/10 p-2 opacity-70">
          <ArrowUpRight size={16} />
        </div>
      </div>
      {children ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  );
};

export default StatWidget;
