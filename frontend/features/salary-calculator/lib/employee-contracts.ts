import { type Rates, RATES_2026 } from '../config/rates-2026';
import type { ContractResult, MonthBreakdown, SalaryInput } from './types';
import {
  roundToGrosz,
  roundToZloty,
  splitByThreshold,
  toContractResult,
  youthExemptPart,
} from './utils';

type EmployeeContract = 'employment' | 'mandate';

// Umowa o pracę and umowa zlecenie share ZUS rules (30x cap, employer contributions);
// they differ in deductible costs and in how the tax advance is computed.
function calculateEmployeeContract(
  contract: EmployeeContract,
  input: SalaryInput,
  rates: Rates
): ContractResult {
  const { employee, employer, pit } = rates;
  const gross = input.monthlyGross;

  let cumulativeGross = 0;
  let cumulativeTaxBase = 0;
  const months: MonthBreakdown[] = [];

  // Students and pupils under 26 on a mandate contract are not covered by social or health
  // insurance, so neither they nor the client pay any contributions or labor funds.
  const isInsured = !(contract === 'mandate' && input.student);
  const youthRelief = input.under26 || input.student;

  for (let month = 1; month <= 12; month++) {
    const pensionBase = isInsured
      ? Math.min(gross, Math.max(0, rates.pensionContributionCap - cumulativeGross))
      : 0;

    const social = isInsured
      ? roundToGrosz(pensionBase * employee.pension) +
        roundToGrosz(pensionBase * employee.disability) +
        roundToGrosz(gross * employee.sickness)
      : 0;
    const health = isInsured ? roundToGrosz((gross - social) * employee.health) : 0;

    const exempt = youthRelief ? youthExemptPart(gross, cumulativeGross, pit.youthReliefLimit) : 0;
    const taxedGross = gross - exempt;
    const taxedShare = gross > 0 ? taxedGross / gross : 0;
    const taxedRevenue = taxedGross - social * taxedShare;

    let advance = 0;
    if (taxedGross > 0) {
      if (contract === 'employment') {
        const taxBase = roundToZloty(Math.max(0, taxedRevenue - employee.monthlyDeductibleCosts));
        const { lower, upper } = splitByThreshold(taxBase, cumulativeTaxBase, pit.threshold);
        cumulativeTaxBase += taxBase;
        advance = lower * pit.lowerRate + upper * pit.upperRate - pit.monthlyReducingAmount;
      } else {
        // Mandate advances are always 12% without PIT-2 reducing amount.
        const deductibleCosts = taxedRevenue * rates.civilContract.deductibleCostsRate;
        advance = roundToZloty(taxedRevenue - deductibleCosts) * pit.lowerRate;
      }
    }
    const pitAdvance = Math.max(0, roundToZloty(advance));

    const laborFunds =
      isInsured && gross >= rates.minimumWage ? roundToGrosz(gross * employer.laborFund) : 0;
    const employerContributions = isInsured
      ? roundToGrosz(pensionBase * employer.pension) +
        roundToGrosz(pensionBase * employer.disability) +
        roundToGrosz(gross * employer.accident) +
        laborFunds +
        roundToGrosz(gross * employer.guaranteedBenefitsFund)
      : 0;

    months.push({
      month,
      gross,
      social: roundToGrosz(social),
      health,
      pit: pitAdvance,
      net: roundToGrosz(gross - social - health - pitAdvance),
      employerCost: roundToGrosz(gross + employerContributions),
    });

    cumulativeGross += gross;
  }

  return toContractResult(contract, months);
}

export const calculateEmployment = (input: SalaryInput, rates: Rates = RATES_2026) =>
  calculateEmployeeContract('employment', input, rates);

export const calculateMandate = (input: SalaryInput, rates: Rates = RATES_2026) =>
  calculateEmployeeContract('mandate', input, rates);
