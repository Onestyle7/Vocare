export type ContractType =
  | 'employment'
  | 'mandate'
  | 'specificTask'
  | 'b2bLumpSum'
  | 'b2bFlat'
  | 'b2bScale';

export type SalaryInput = {
  // Monthly gross salary; for B2B it is treated as the net invoice amount.
  monthlyGross: number;
  // Enables "ulga dla młodych" (PIT exemption) for employment and mandate contracts.
  under26: boolean;
  // Pupil or student under 26: no ZUS or health on mandate contracts; implies youth relief.
  student: boolean;
  // Enables 50% copyright deductible costs for the specific-task contract.
  copyrightCosts: boolean;
  // Lump-sum tax rate for B2B ryczałt, e.g. 0.12 for IT services.
  lumpSumRate: number;
};

export type MonthBreakdown = {
  month: number;
  gross: number;
  social: number;
  health: number;
  pit: number;
  net: number;
  employerCost: number;
};

export type ContractResult = {
  type: ContractType;
  // Monthly averages over the whole year.
  gross: number;
  social: number;
  health: number;
  pit: number;
  net: number;
  employerCost: number;
  months: MonthBreakdown[];
};
