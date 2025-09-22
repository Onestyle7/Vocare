"use client";

import React from "react";

type Size = "sm" | "md";

const normalize = (val?: string) => (val || "").trim().toLowerCase();

function mapLevel(level: string): { key: "very-high" | "high" | "medium" | "low"; label: string } {
  const v = normalize(level);
  if (["very high", "bardzo wysoki", "bardzo wysoka"].some((k) => v.includes(k)))
    return { key: "very-high", label: "Very high" };
  if (["high", "wysoki", "wysoka"].some((k) => v.includes(k)))
    return { key: "high", label: "High" };
  if (["medium", "średni", "sredni"].some((k) => v.includes(k)))
    return { key: "medium", label: "Medium" };
  if (["low", "niski", "niska"].some((k) => v.includes(k)))
    return { key: "low", label: "Low" };
  // Fallback: try to parse numbers e.g. "85%"
  const asNum = parseInt(v.replace(/[^0-9]/g, ""), 10);
  if (!Number.isNaN(asNum)) {
    if (asNum >= 85) return { key: "very-high", label: `${asNum}%` };
    if (asNum >= 60) return { key: "high", label: `${asNum}%` };
    if (asNum >= 35) return { key: "medium", label: `${asNum}%` };
    return { key: "low", label: `${asNum}%` };
  }
  return { key: "medium", label: level || "—" };
}

const toneClass: Record<ReturnType<typeof mapLevel>["key"], string> = {
  "very-high": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  high: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface DemandLevelBadgeProps {
  level: string;
  size?: Size;
  className?: string;
  withDot?: boolean;
}

const sizes: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

const DemandLevelBadge: React.FC<DemandLevelBadgeProps> = ({
  level,
  size = "md",
  className = "",
  withDot = true,
}) => {
  const mapped = mapLevel(level);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${toneClass[mapped.key]} ${sizes[size]} ${className}`}>
      {withDot && (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {mapped.label}
    </span>
  );
};

export default DemandLevelBadge;

