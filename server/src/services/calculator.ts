export interface CalculationInput {
  amount: number;
  termMonths: number;
  annualRate: number;
  vatRate: number;
  calcMethod: 'pmt' | 'flat';
  depositMonths: number;
  depositEnabled: boolean;
}

export interface CalculationResult {
  depositAmount: number;
  principal: number;
  monthlyPaymentExclVat: number;
  monthlyPaymentInclVat: number;
  quarterlyPaymentExclVat: number;
  quarterlyPaymentInclVat: number;
  vatAmountMonthly: number;
  totalLeaseExclVat: number;
  totalLeaseInclVat: number;
  termMonths: number;
}

/**
 * PMT (Annuity) Formula:
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculatePMT(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Flat-Rate Formula:
 * M = (P + (P × annual_rate / 100 × years)) / n
 */
function calculateFlat(principal: number, annualRate: number, termMonths: number): number {
  const years = termMonths / 12;
  const totalInterest = principal * (annualRate / 100) * years;
  return (principal + totalInterest) / termMonths;
}

export function calculate(input: CalculationInput): CalculationResult {
  const {
    amount,
    termMonths,
    annualRate,
    vatRate,
    calcMethod,
    depositMonths,
    depositEnabled,
  } = input;

  // Calculate deposit (advance rental = depositMonths × estimated monthly)
  // For deposit calculation, use a preliminary monthly to determine deposit amount
  let depositAmount = 0;
  let principal = amount;

  if (depositEnabled && depositMonths > 0) {
    // Deposit = number of advance months × monthly payment
    // We compute on full amount first, then the deposit is those advance months
    const prelimMonthly = calcMethod === 'pmt'
      ? calculatePMT(amount, annualRate, termMonths)
      : calculateFlat(amount, annualRate, termMonths);

    depositAmount = prelimMonthly * depositMonths;
    // Principal financed = total amount minus deposit
    principal = amount - depositAmount;
    // Remaining term after deposit months
  }

  // Ensure principal is not negative
  if (principal < 0) principal = 0;

  // Calculate monthly payment on remaining principal for remaining term
  const remainingTerm = depositEnabled ? termMonths - depositMonths : termMonths;
  const effectiveTerm = Math.max(remainingTerm, 1);

  const monthlyExclVat = calcMethod === 'pmt'
    ? calculatePMT(principal, annualRate, effectiveTerm)
    : calculateFlat(principal, annualRate, effectiveTerm);

  const vatMultiplier = vatRate / 100;
  const vatAmountMonthly = monthlyExclVat * vatMultiplier;
  const monthlyInclVat = monthlyExclVat + vatAmountMonthly;

  const quarterlyExclVat = monthlyExclVat * 3;
  const quarterlyInclVat = monthlyInclVat * 3;

  const totalExclVat = depositAmount + (monthlyExclVat * effectiveTerm);
  const totalInclVat = (depositAmount * (1 + vatMultiplier)) + (monthlyInclVat * effectiveTerm);

  return {
    depositAmount: round2(depositAmount),
    principal: round2(principal),
    monthlyPaymentExclVat: round2(monthlyExclVat),
    monthlyPaymentInclVat: round2(monthlyInclVat),
    quarterlyPaymentExclVat: round2(quarterlyExclVat),
    quarterlyPaymentInclVat: round2(quarterlyInclVat),
    vatAmountMonthly: round2(vatAmountMonthly),
    totalLeaseExclVat: round2(totalExclVat),
    totalLeaseInclVat: round2(totalInclVat),
    termMonths,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
