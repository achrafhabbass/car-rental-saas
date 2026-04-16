export interface AmortizationRow {
  installmentNumber: number;
  scheduledDate: Date;
  scheduledAmount: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
}

/**
 * Standard French-amortization schedule (constant monthly payment).
 * principal is the amount financed (after down payment).
 * annualRatePct is the nominal annual rate in percent (e.g. 7.5 for 7.5%).
 * termMonths is the total number of installments.
 *
 * The monthly payment uses the classic formula:
 *   PMT = P * r / (1 - (1 + r)^-n)
 * with r = annualRate / 12.
 * If the rate is zero the schedule falls back to a flat equal-split.
 */
export function buildAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  startDate: Date,
): { monthlyPayment: number; schedule: AmortizationRow[] } {
  if (termMonths <= 0) throw new Error('termMonths must be > 0');
  if (principal < 0) throw new Error('principal must be >= 0');

  const r = annualRatePct / 100 / 12;
  const n = termMonths;

  const monthlyPayment =
    r === 0
      ? principal / n
      : (principal * r) / (1 - Math.pow(1 + r, -n));

  const rounded = (x: number): number => Math.round(x * 100) / 100;
  const pmt = rounded(monthlyPayment);

  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= n; i++) {
    const interest = rounded(balance * r);
    let principalPortion = rounded(pmt - interest);
    // Last installment: absorb rounding residue so balance finishes at exactly 0
    if (i === n) {
      principalPortion = rounded(balance);
    }
    const scheduledAmount = rounded(principalPortion + interest);
    const due = new Date(startDate);
    due.setUTCMonth(due.getUTCMonth() + i);
    balance = rounded(balance - principalPortion);

    schedule.push({
      installmentNumber: i,
      scheduledDate: due,
      scheduledAmount,
      principalPortion,
      interestPortion: interest,
      remainingBalance: Math.max(balance, 0),
    });
  }

  return { monthlyPayment: pmt, schedule };
}
