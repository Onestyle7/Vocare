export enum Risk {
  Low = 1,
  Medium,
  High,
  Critical,
  Unknown,
}

export const riskLabels: Record<Risk, string> = {
  [Risk.Low]: 'Low',
  [Risk.Medium]: 'Medium',
  [Risk.High]: 'High',
  [Risk.Critical]: 'Critical',
  [Risk.Unknown]: 'Unknown',
};
