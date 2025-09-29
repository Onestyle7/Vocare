'use client';

import React from 'react';

interface PillCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  className?: string;
}

const PillCard: React.FC<PillCardProps> = ({ icon, title, subtitle, trailing, className = '' }) => {
  return (
    <div
      className={`rounded-[18px] border bg-white/80 shadow-sm backdrop-blur-md dark:bg-[#0f0f12] ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-medium">{title}</p>
          {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </div>
  );
};

export default PillCard;
