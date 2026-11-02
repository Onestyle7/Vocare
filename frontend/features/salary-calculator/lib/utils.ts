import type { ContractResult, ContractType, MonthBreakdown } from './types';

export const roundToGrosz = (value: number) => Math.round(value * 100) / 100;

// Tax bases and tax advances are rounded to full złoty (Ordynacja podatkowa, art. 63).
export const roundToZloty = (value: number) => Math.round(value);

export const sumBy = (months: MonthBreakdown[], key: keyof Omit<MonthBreakdown, 'month'>) =>
  months.reduce((total, month) => total + month[key], 0);

export function toContractResult(type: ContractType, months: MonthBreakdown[]): ContractResult {
  const average = (key: keyof Omit<MonthBreakdown, 'month'>) =>
    roundToGrosz(sumBy(months, key) / months.length);

  return {
    type,
    gross: average('gross'),
    social: average('social'),
    health: average('health'),
    pit: average('pit'),
    net: average('net'),
    employerCost: average('employerCost'),
    months,
  };
}

// Splits a monthly tax base into parts below and above the annual PIT threshold.
export function splitByThreshold(base: number, cumulativeBase: number, threshold: number) {
  const roomBelow = Math.max(0, threshold - cumulativeBase);
  const lower = Math.min(base, roomBelow);
  return { lower, upper: base - lower };
}

// Part of the monthly revenue covered by "ulga dla młodych", given revenue earned earlier in the year.
export function youthExemptPart(gross: number, cumulativeGross: number, limit: number) {
  return Math.min(gross, Math.max(0, limit - cumulativeGross));
}
