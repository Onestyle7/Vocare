// Public ZUS / NFZ / PIT parameters for 2026, verified against official sources on 2026-10-21:
// - podatki.gov.pl: PIT scale, deductible costs, youth relief, flat-tax health deduction cap, lump-sum rates
// - zus.pl "Nowe wysokości składek na ubezpieczenia społeczne w 2026 r." (B2B base, 30x cap, forecast wage)
// - zus.pl "Składki na ubezpieczenia" (full ZUS amounts incl. 1.67% accident rate)
// - zus.pl "Informacja w sprawie podstawy wymiaru składki ... zdrowotne w 2026 r." (health minimum and lump-sum tiers)
// - zus.pl "Finansowanie składek", "FP", "FGŚP" (employee/employer split, labor funds without the 30x cap)
// Update this file once a year - calculators read only from here.

export const RATES_2026 = {
  year: 2026,

  minimumWage: 4806,
  forecastAverageWage: 9420,
  // 30 x forecastAverageWage - annual cap for pension and disability contributions.
  pensionContributionCap: 282_600,

  pit: {
    lowerRate: 0.12,
    upperRate: 0.32,
    threshold: 120_000,
    // Monthly tax-reducing amount (30 000 zł tax-free amount * 12% / 12) applied with PIT-2.
    monthlyReducingAmount: 300,
    annualReducingAmount: 3600,
    flatRate: 0.19,
    // "Ulga dla młodych" - annual tax-exempt revenue for people under 26.
    youthReliefLimit: 85_528,
  },

  employee: {
    pension: 0.0976,
    disability: 0.015,
    sickness: 0.0245,
    health: 0.09,
    // Standard monthly employment deductible costs (koszty uzyskania przychodu).
    monthlyDeductibleCosts: 250,
  },

  employer: {
    pension: 0.0976,
    disability: 0.065,
    accident: 0.0167,
    laborFund: 0.0245,
    guaranteedBenefitsFund: 0.001,
  },

  civilContract: {
    deductibleCostsRate: 0.2,
    copyrightDeductibleCostsRate: 0.5,
    // Annual cap on 50% copyright deductible costs.
    copyrightDeductibleCostsCap: 120_000,
  },

  b2b: {
    // Full ZUS: 60% of forecastAverageWage.
    socialBase: 5652,
    pension: 0.1952,
    disability: 0.08,
    sickness: 0.0245,
    accident: 0.0167,
    laborFund: 0.0245,

    // Monthly health minimum for tax scale and flat tax: 9% of 100% minimum wage (Feb-Dec 2026).
    healthMinimum: 432.54,
    healthScaleRate: 0.09,
    healthFlatRate: 0.049,
    // Annual cap on deducting health contributions from flat-tax income.
    healthFlatDeductionCap: 14_100,

    // Lump-sum health contribution tiers by annual revenue (based on Q4 2025 average wage 9228.64 zł).
    lumpSumHealthTiers: [
      { maxAnnualRevenue: 60_000, monthly: 498.35 },
      { maxAnnualRevenue: 300_000, monthly: 830.58 },
      { maxAnnualRevenue: Infinity, monthly: 1495.04 },
    ],
    // 50% of paid lump-sum health contributions reduces taxable revenue.
    lumpSumHealthDeductionShare: 0.5,
    defaultLumpSumRate: 0.12,
  },
} as const;

export type Rates = typeof RATES_2026;
