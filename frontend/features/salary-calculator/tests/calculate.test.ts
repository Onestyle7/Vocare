// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { RATES_2026 } from '../config/rates-2026';
import { calculateB2bFlat, calculateB2bLumpSum, calculateB2bScale } from '../lib/b2b';
import { calculateAll, CONTRACT_TYPES } from '../lib/calculate';
import { calculateEmployment, calculateMandate } from '../lib/employee-contracts';
import { calculateSpecificTask } from '../lib/specific-task';
import type { SalaryInput } from '../lib/types';

const input = (monthlyGross: number, overrides: Partial<SalaryInput> = {}): SalaryInput => ({
  monthlyGross,
  under26: false,
  student: false,
  copyrightCosts: false,
  lumpSumRate: 0.12,
  ...overrides,
});

describe('calculateEmployment', () => {
  it('matches the published 2026 minimum wage net amount and employer cost', () => {
    const result = calculateEmployment(input(4806));

    expect(result.net).toBe(3605.85);
    expect(result.social).toBe(658.91);
    expect(result.health).toBe(373.24);
    expect(result.pit).toBe(168);
    expect(result.employerCost).toBe(5790.28);
  });

  it('matches reference values for 10 000 zł gross', () => {
    const result = calculateEmployment(input(10_000));

    expect(result.net).toBe(7147.39);
    expect(result.employerCost).toBe(12_048);
  });

  it('stops pension and disability contributions after the 30x annual cap', () => {
    const { months } = calculateEmployment(input(25_000));

    // 11 x 25 000 = 275 000, so only 7 600 zł of December salary is below the 282 600 zł cap.
    expect(months[10].social).toBe(3427.5);
    expect(months[11].social).toBe(1468.26);
    expect(months[11].employerCost).toBeLessThan(months[10].employerCost);
  });

  it('applies the 32% rate once the annual tax base exceeds 120 000 zł', () => {
    const { months } = calculateEmployment(input(25_000));

    expect(months[0].pit).toBe(2259);
    expect(months[11].pit).toBeGreaterThan(months[0].pit * 2);
  });

  it('exempts income up to the youth relief limit for people under 26', () => {
    const { months } = calculateEmployment(input(10_000, { under26: true }));

    // 8 x 10 000 = 80 000 is fully exempt; September crosses 85 528 zł.
    expect(months.slice(0, 8).every((month) => month.pit === 0)).toBe(true);
    expect(months[8].pit).toBeGreaterThan(0);
    expect(months[8].pit).toBeLessThan(months[9].pit);
    expect(months[9].pit).toBe(705);
  });
});

describe('calculateMandate', () => {
  it('uses 20% deductible costs and a flat 12% advance without PIT-2', () => {
    const result = calculateMandate(input(4806));

    expect(result.social).toBe(658.91);
    expect(result.pit).toBe(398);
    expect(result.net).toBe(3375.85);
  });
});

describe('calculateMandate for a student under 26', () => {
  it('charges no ZUS, health or employer contributions within the youth relief limit', () => {
    const result = calculateMandate(input(4000, { student: true }));

    // 12 x 4000 = 48 000 zł stays below 85 528 zł, so gross equals net all year.
    expect(result.social).toBe(0);
    expect(result.health).toBe(0);
    expect(result.pit).toBe(0);
    expect(result.net).toBe(4000);
    expect(result.employerCost).toBe(4000);
  });

  it('taxes income above the youth relief limit with standard rules', () => {
    const { months } = calculateMandate(input(10_000, { student: true }));

    expect(months.slice(0, 8).every((month) => month.net === 10_000)).toBe(true);
    // September: 4 472 zł above the limit, 20% costs, 12% advance.
    expect(months[8].pit).toBe(429);
    // October onwards: whole salary taxed, still without ZUS.
    expect(months[9].pit).toBe(960);
    expect(months[9].net).toBe(9040);
    expect(months[9].social).toBe(0);
  });

  it('implies youth relief even when the under-26 switch is off', () => {
    const student = calculateMandate(input(4000, { student: true, under26: false }));
    expect(student.pit).toBe(0);
  });

  it('does not exempt employment contracts from ZUS', () => {
    const result = calculateEmployment(input(4000, { student: true }));

    expect(result.social).toBeGreaterThan(0);
    expect(result.health).toBeGreaterThan(0);
    expect(result.pit).toBe(0);
  });
});

describe('calculateSpecificTask', () => {
  it('charges no ZUS and taxes 80% of revenue at 12%', () => {
    const result = calculateSpecificTask(input(10_000));

    expect(result.social).toBe(0);
    expect(result.health).toBe(0);
    expect(result.pit).toBe(960);
    expect(result.net).toBe(9040);
  });

  it('applies 50% copyright costs up to the annual cap', () => {
    const { months } = calculateSpecificTask(input(30_000, { copyrightCosts: true }));

    // 15 000 zł of costs per month exhausts the 120 000 zł cap after 8 months.
    expect(months[0].pit).toBe(1800);
    expect(months[8].pit).toBe(3600);
  });

  it('ignores youth relief', () => {
    expect(calculateSpecificTask(input(6000, { under26: true })).pit).toBe(576);
  });
});

describe('B2B', () => {
  const fullZusWithLaborFund = 1926.76;

  it('applies the minimum health contribution on the tax scale', () => {
    const result = calculateB2bScale(input(4806));

    expect(result.social).toBe(fullZusWithLaborFund);
    expect(result.health).toBe(RATES_2026.b2b.healthMinimum);
    expect(result.pit).toBe(45.5);
  });

  it('computes 9% health on the tax scale above the minimum', () => {
    expect(calculateB2bScale(input(25_000)).health).toBe(2076.59);
  });

  it('computes 4.9% health on the flat tax above the minimum', () => {
    const result = calculateB2bFlat(input(25_000));

    expect(result.health).toBe(1130.59);
    expect(result.net).toBe(17_773.57);
  });

  it('picks the lump-sum health tier by annual revenue', () => {
    expect(calculateB2bLumpSum(input(5000)).health).toBe(498.35);
    expect(calculateB2bLumpSum(input(5000.01)).health).toBe(830.58);
    expect(calculateB2bLumpSum(input(25_001)).health).toBe(1495.04);
  });

  it('uses the configured lump-sum rate', () => {
    const it12 = calculateB2bLumpSum(input(10_000));
    const rate85 = calculateB2bLumpSum(input(10_000, { lumpSumRate: 0.085 }));

    expect(it12.pit).toBe(935.58);
    expect(rate85.pit).toBeLessThan(it12.pit);
  });

  it('treats the invoice amount as the total cost for the client', () => {
    expect(calculateB2bFlat(input(18_000)).employerCost).toBe(18_000);
  });
});

describe('calculateAll', () => {
  it('returns one result per contract type', () => {
    expect(calculateAll(input(8000)).map((result) => result.type)).toEqual(CONTRACT_TYPES);
  });

  it.each([0, -100, Number.NaN])('returns no results for invalid amount %s', (amount) => {
    expect(calculateAll(input(amount))).toEqual([]);
  });

  it('keeps net equal to gross minus all deductions', () => {
    for (const result of calculateAll(input(13_337))) {
      for (const month of result.months) {
        expect(month.net).toBeCloseTo(month.gross - month.social - month.health - month.pit, 2);
      }
    }
  });
});
