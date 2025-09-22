"use client";

import React from "react";

export interface ForecastItem {
  title: string;
  description?: string;
}

interface ForecastTimelineProps {
  items: ForecastItem[];
  className?: string;
}

// Vertical timeline, soft rounded card, green accent — inspired by provided shots
const ForecastTimeline: React.FC<ForecastTimelineProps> = ({ items, className = "" }) => {
  return (
    <div className={`rounded-[20px] border p-6 shadow-sm bg-white dark:bg-[#0f0f12] ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Market forecast</h3>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-[2px] rounded bg-emerald-400/70" />
        <ul className="space-y-6">
          {items.map((it, idx) => (
            <li key={idx} className="relative pl-10">
              <div className="absolute left-2 top-1 h-4 w-4 rounded-full border-2 border-emerald-500 bg-white dark:bg-[#0f0f12]" />
              <div>
                <p className="text-sm font-medium leading-tight">{it.title}</p>
                {it.description && (
                  <p className="text-muted-foreground mt-1 text-sm leading-snug">{it.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ForecastTimeline;

