export enum Risk {
  Low = 1,
  Medium,
  High,
  Critical,
  Unknown,
}

export const riskLabels: Record<Risk, string> = {
  [Risk.Low]: 'Niska',
  [Risk.Medium]: 'Średnia',
  [Risk.High]: 'Wysoka',
  [Risk.Critical]: 'Bardzo wysoka',
  [Risk.Unknown]: 'Nie wiem',
};
