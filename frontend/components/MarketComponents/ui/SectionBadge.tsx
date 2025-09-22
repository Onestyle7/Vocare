"use client";

import React from "react";

type Tone = "neutral" | "violet" | "green" | "dark";

interface SectionBadgeProps {
  label: string;
  className?: string;
  tone?: Tone;
  center?: boolean;
  icon?: React.ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral:
    "border-white/50 text-white/90 bg-white/5 dark:border-white/20 dark:text-white/90",
  violet:
    "border-[#915EFF]/50 text-[#915EFF] bg-[#915EFF]/10 dark:border-[#915EFF]/40",
  green: "border-emerald-400/50 text-emerald-600 bg-emerald-400/10 dark:text-emerald-300",
  dark: "border-black/10 text-black bg-black/5 dark:border-white/10 dark:text-white/90 dark:bg-white/5",
};

const SectionBadge: React.FC<SectionBadgeProps> = ({
  label,
  className = "",
  tone = "neutral",
  center = true,
  icon,
}) => {
  return (
    <div
      className={`font-korbin mt-1 mb-6 inline-flex h-[38px] min-w-[160px] items-center ${
        center ? "justify-center" : "justify-start pl-3 pr-4"
      } gap-2 rounded-full border text-sm backdrop-blur ${toneClasses[tone]} ${className}`}
      role="status"
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full bg-current opacity-80"
      />
      {icon ? <span className="grid place-items-center">{icon}</span> : null}
      <span className="font-medium tracking-tight">{label}</span>
    </div>
  );
};

export default SectionBadge;

