import { type Rates, RATES_2026 } from '../config/rates-2026';
import type { ContractResult, ContractType, MonthBreakdown, SalaryInput } from './types';
import { roundToGrosz, roundToZloty, toContractResult } from './utils';

// B2B assumptions: full ZUS with voluntary sickness insurance, no business costs,
// constant monthly revenue. Tax is computed on the annual result and spread evenly.

function fullZusSocial(rates: Rates) {
  const { b2b } = rates;
  return (
    roundToGrosz(b2b.socialBase * b2b.pension) +
    roundToGrosz(b2b.socialBase * b2b.disability) +
    roundToGrosz(b2b.socialBase * b2b.sickness) +
    roundToGrosz(b2b.socialBase * b2b.accident)
  );
}

// Labor fund is paid by the entrepreneur but is not a personal contribution, so it is a business cost.
function laborFund(rates: Rates) {
  return roundToGrosz(rates.b2b.socialBase * rates.b2b.laborFund);
}

function buildResult(
  type: ContractType,
  revenue: number,
  social: number,
  health: number,
  annualTax: number
): ContractResult {
  const pit = roundToGrosz(Math.max(0, annualTax) / 12);
  const months: MonthBreakdown[] = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    gross: revenue,
    social,
    health,
    pit,
    net: roundToGrosz(revenue - social - health - pit),
    employerCost: revenue,
  }));
  return toContractResult(type, months);
}

export function calculateB2bScale(input: SalaryInput, rates: Rates = RATES_2026): ContractResult {
  const { b2b, pit } = rates;
  const revenue = input.monthlyGross;
  const social = roundToGrosz(fullZusSocial(rates) + laborFund(rates));
  const monthlyIncome = Math.max(0, revenue - laborFund(rates));
  // Health base (income reduced by paid social contributions) is also the PIT base.
  const healthBase = Math.max(0, monthlyIncome - fullZusSocial(rates));
  const health = roundToGrosz(Math.max(b2b.healthMinimum, healthBase * b2b.healthScaleRate));

  const annualBase = roundToZloty(healthBase * 12);
  const lower = Math.min(annualBase, pit.threshold);
  const upper = annualBase - lower;
  const annualTax = roundToZloty(
    lower * pit.lowerRate + upper * pit.upperRate - pit.annualReducingAmount
  );

  return buildResult('b2bScale', revenue, social, health, annualTax);
}

export function calculateB2bFlat(input: SalaryInput, rates: Rates = RATES_2026): ContractResult {
  const { b2b, pit } = rates;
  const revenue = input.monthlyGross;
  const social = roundToGrosz(fullZusSocial(rates) + laborFund(rates));
  const monthlyIncome = Math.max(0, revenue - laborFund(rates));
  // Health base is income reduced by paid social contributions.
  const healthBase = Math.max(0, monthlyIncome - fullZusSocial(rates));
  const health = roundToGrosz(Math.max(b2b.healthMinimum, healthBase * b2b.healthFlatRate));

  const healthDeduction = Math.min(health * 12, b2b.healthFlatDeductionCap);
  const annualBase = roundToZloty(Math.max(0, healthBase * 12 - healthDeduction));
  const annualTax = roundToZloty(annualBase * pit.flatRate);

  return buildResult('b2bFlat', revenue, social, health, annualTax);
}

export function calculateB2bLumpSum(input: SalaryInput, rates: Rates = RATES_2026): ContractResult {
  const { b2b } = rates;
  const revenue = input.monthlyGross;
  const annualRevenue = revenue * 12;
  // Lump-sum tax cannot deduct business costs, so the labor fund is just paid alongside social ZUS.
  const social = roundToGrosz(fullZusSocial(rates) + laborFund(rates));
  const annualSocial = fullZusSocial(rates) * 12;
  // Health tiers compare revenue reduced by paid social contributions (art. 81 ust. 2g
  // ustawy o świadczeniach opieki zdrowotnej), not the raw invoice total.
  const tierRevenue = Math.max(0, annualRevenue - annualSocial);
  const tier = b2b.lumpSumHealthTiers.find((t) => tierRevenue <= t.maxAnnualRevenue)!;
  const health = tier.monthly;

  const annualBase = roundToZloty(
    Math.max(0, annualRevenue - annualSocial - health * 12 * b2b.lumpSumHealthDeductionShare)
  );
  const annualTax = roundToZloty(annualBase * input.lumpSumRate);

  return buildResult('b2bLumpSum', revenue, social, health, annualTax);
}
