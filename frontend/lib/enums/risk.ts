export enum Risk {
  Low = 1,
  Medium,
  High,
  Critical,
  Unknown,
}

export const riskLabels: Record<string, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
  5: 'Unknown',
};
