const DAY_MS = 24 * 60 * 60 * 1000;

export const TRIAL_OFFER_SNOOZE_KEY = 'vocare-trial-offer-snooze';

// Each dismissal hides the offer for longer: 1 day, then 2, then a week for every later one
export const TRIAL_OFFER_SNOOZE_DAYS = [1, 2, 7] as const;

export type TrialOfferSnooze = {
  dismissCount: number;
  // Epoch ms; the offer stays hidden until then
  hiddenUntil: number;
};

export function getSnoozeDays(dismissCount: number): number {
  const index = Math.min(Math.max(dismissCount, 1), TRIAL_OFFER_SNOOZE_DAYS.length) - 1;
  return TRIAL_OFFER_SNOOZE_DAYS[index];
}

export function parseSnooze(raw: string | null): TrialOfferSnooze | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'dismissCount' in value &&
      'hiddenUntil' in value &&
      typeof value.dismissCount === 'number' &&
      typeof value.hiddenUntil === 'number'
    ) {
      return { dismissCount: value.dismissCount, hiddenUntil: value.hiddenUntil };
    }
  } catch {
    // Corrupted value: treat as never dismissed.
  }
  return null;
}

export function nextSnooze(previous: TrialOfferSnooze | null, now: number): TrialOfferSnooze {
  const dismissCount = (previous?.dismissCount ?? 0) + 1;
  return { dismissCount, hiddenUntil: now + getSnoozeDays(dismissCount) * DAY_MS };
}

export function isSnoozed(snooze: TrialOfferSnooze | null, now: number): boolean {
  return snooze !== null && now < snooze.hiddenUntil;
}
