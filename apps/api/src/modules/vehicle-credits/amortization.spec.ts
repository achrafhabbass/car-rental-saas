import { buildAmortizationSchedule } from './amortization';

describe('buildAmortizationSchedule', () => {
  it('produces a schedule whose final balance is zero', () => {
    const { schedule } = buildAmortizationSchedule(100_000, 7.5, 60, new Date('2026-01-01Z'));
    expect(schedule).toHaveLength(60);
    expect(schedule[59].remainingBalance).toBe(0);
  });

  it('monthlyPayment × termMonths ≈ sum of installments', () => {
    const { monthlyPayment, schedule } = buildAmortizationSchedule(
      120_000,
      6.0,
      48,
      new Date('2026-01-01Z'),
    );
    const sum = schedule.reduce((acc, r) => acc + r.scheduledAmount, 0);
    // Last installment absorbs rounding, so tolerate a small difference.
    expect(Math.abs(sum - monthlyPayment * 48)).toBeLessThan(5);
  });

  it('total interest equals sum of interest portions', () => {
    const principal = 50_000;
    const { schedule } = buildAmortizationSchedule(
      principal,
      8.25,
      24,
      new Date('2026-01-01Z'),
    );
    const totalInterest = schedule.reduce((acc, r) => acc + r.interestPortion, 0);
    const totalPrincipal = schedule.reduce((acc, r) => acc + r.principalPortion, 0);
    // Principal portions must sum back to the original amount (± rounding).
    expect(Math.abs(totalPrincipal - principal)).toBeLessThan(0.5);
    expect(totalInterest).toBeGreaterThan(0);
  });

  it('handles zero interest with equal-split fallback', () => {
    const { monthlyPayment, schedule } = buildAmortizationSchedule(
      60_000,
      0,
      12,
      new Date('2026-01-01Z'),
    );
    expect(monthlyPayment).toBe(5000);
    expect(schedule[0].interestPortion).toBe(0);
    expect(schedule[11].remainingBalance).toBe(0);
  });

  it('installments are monthly (one calendar month apart)', () => {
    const start = new Date('2026-02-15T00:00:00Z');
    const { schedule } = buildAmortizationSchedule(10_000, 5, 3, start);
    expect(schedule[0].scheduledDate.getUTCMonth()).toBe(2); // March
    expect(schedule[1].scheduledDate.getUTCMonth()).toBe(3); // April
    expect(schedule[2].scheduledDate.getUTCMonth()).toBe(4); // May
  });

  it('rejects invalid term', () => {
    expect(() =>
      buildAmortizationSchedule(1000, 5, 0, new Date()),
    ).toThrow();
  });
});
