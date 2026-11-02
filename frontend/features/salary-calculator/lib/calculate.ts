import { type Rates, RATES_2026 } from '../config/rates-2026';
import { calculateB2bFlat, calculateB2bLumpSum, calculateB2bScale } from './b2b';
import { calculateEmployment, calculateMandate } from './employee-contracts';
import { calculateSpecificTask } from './specific-task';
import type { ContractResult, ContractType, SalaryInput } from './types';

const calculators: Record<ContractType, (input: SalaryInput, rates: Rates) => ContractResult> = {
  employment: calculateEmployment,
  mandate: calculateMandate,
  specificTask: calculateSpecificTask,
  b2bLumpSum: calculateB2bLumpSum,
  b2bFlat: calculateB2bFlat,
  b2bScale: calculateB2bScale,
};

export const CONTRACT_TYPES = Object.keys(calculators) as ContractType[];

export function calculateAll(input: SalaryInput, rates: Rates = RATES_2026): ContractResult[] {
  if (!Number.isFinite(input.monthlyGross) || input.monthlyGross <= 0) return [];
  return CONTRACT_TYPES.map((type) => calculators[type](input, rates));
}
