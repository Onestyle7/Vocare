import { type Rates, RATES_2026 } from '../config/rates-2026';
import type { ContractResult, MonthBreakdown, SalaryInput } from './types';
import { roundToGrosz, roundToZloty, toContractResult } from './utils';

// Umowa o dzieło: no ZUS and no health contribution, flat 12% tax advance.
// "Ulga dla młodych" does not cover this contract.
export function calculateSpecificTask(
  input: SalaryInput,
  rates: Rates = RATES_2026
): ContractResult {
  const { civilContract, pit } = rates;
  const gross = input.monthlyGross;

  let usedCopyrightCosts = 0;
  const months: MonthBreakdown[] = [];

  for (let month = 1; month <= 12; month++) {
    let deductibleCosts: number;
    if (input.copyrightCosts) {
      const remainingCap = Math.max(
        0,
        civilContract.copyrightDeductibleCostsCap - usedCopyrightCosts
      );
      deductibleCosts = Math.min(gross * civilContract.copyrightDeductibleCostsRate, remainingCap);
      usedCopyrightCosts += deductibleCosts;
    } else {
      deductibleCosts = gross * civilContract.deductibleCostsRate;
    }

    const pitAdvance = roundToZloty(roundToZloty(gross - deductibleCosts) * pit.lowerRate);

    months.push({
      month,
      gross,
      social: 0,
      health: 0,
      pit: pitAdvance,
      net: roundToGrosz(gross - pitAdvance),
      employerCost: gross,
    });
  }

  return toContractResult('specificTask', months);
}
