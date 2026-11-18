export interface EmiScheduleRow {
  year: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export interface EmiResult {
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  totalMonths: number;
  principalPercent: number;
  interestPercent: number;
  yearlySchedule: EmiScheduleRow[];
}

export function calculateEmi(
  principal: number,
  annualRatePercent: number,
  tenureValue: number,
  tenureUnit: 'years' | 'months'
): EmiResult {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error('Enter a loan principal greater than 0.');
  }
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100) {
    throw new Error('Enter an annual interest rate between 0% and 100%.');
  }
  if (!Number.isFinite(tenureValue) || tenureValue <= 0) {
    throw new Error('Enter a valid loan tenure greater than 0.');
  }

  const totalMonths =
    tenureUnit === 'years' ? Math.round(tenureValue * 12) : Math.round(tenureValue);
  if (totalMonths < 1 || totalMonths > 600) {
    throw new Error('Loan tenure must be between 1 month and 50 years (600 months).');
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  let monthlyEmi: number;

  if (monthlyRate === 0) {
    monthlyEmi = principal / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    monthlyEmi = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = monthlyEmi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  const yearlySchedule: EmiScheduleRow[] = [];
  let balance = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = balance * monthlyRate;
    const principalPart = Math.min(balance, monthlyEmi - interest);
    balance = Math.max(0, balance - principalPart);
    yearPrincipal += principalPart;
    yearInterest += interest;

    if (m % 12 === 0 || m === totalMonths) {
      yearlySchedule.push({
        year: Math.ceil(m / 12),
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        endingBalance: balance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  const principalPercent = totalPayment > 0 ? (principal / totalPayment) * 100 : 100;
  const interestPercent = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  return {
    monthlyEmi,
    totalPayment,
    totalInterest,
    totalMonths,
    principalPercent,
    interestPercent,
    yearlySchedule,
  };
}

export type CompoundingFrequency = 1 | 2 | 4 | 12 | 365;

export interface CompoundYearlyRow {
  year: number;
  totalContributed: number;
  interestEarned: number;
  balance: number;
}

export interface CompoundInterestResult {
  finalBalance: number;
  totalPrincipalAndContributions: number;
  totalInterestEarned: number;
  yearlyBreakdown: CompoundYearlyRow[];
}

export function calculateCompoundInterest(
  initialPrincipal: number,
  annualRatePercent: number,
  years: number,
  compoundingPerYear: CompoundingFrequency,
  monthlyContribution = 0
): CompoundInterestResult {
  if (!Number.isFinite(initialPrincipal) || initialPrincipal < 0) {
    throw new Error('Initial investment must be 0 or greater.');
  }
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 200) {
    throw new Error('Enter an annual interest rate between 0% and 200%.');
  }
  if (!Number.isFinite(years) || years <= 0 || years > 100) {
    throw new Error('Investment time period must be between 1 and 100 years.');
  }
  if (!Number.isFinite(monthlyContribution) || monthlyContribution < 0) {
    throw new Error('Monthly contribution cannot be negative.');
  }

  const wholeYears = Math.floor(years);
  const fractionalYear = years - wholeYears;
  const totalMonths = Math.max(1, Math.round(years * 12));
  const r = annualRatePercent / 100;
  // Convert nominal annual rate compounded N times/year into equivalent effective monthly rate for exact monthly simulation with contributions
  const effectiveMonthlyRate =
    r === 0 ? 0 : Math.pow(1 + r / compoundingPerYear, compoundingPerYear / 12) - 1;

  let balance = initialPrincipal;
  let totalContributed = initialPrincipal;
  const yearlyBreakdown: CompoundYearlyRow[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + effectiveMonthlyRate) + monthlyContribution;
    totalContributed += monthlyContribution;

    if (m % 12 === 0 || (m === totalMonths && fractionalYear > 0)) {
      yearlyBreakdown.push({
        year: Math.ceil(m / 12),
        totalContributed,
        interestEarned: Math.max(0, balance - totalContributed),
        balance,
      });
    }
  }

  return {
    finalBalance: balance,
    totalPrincipalAndContributions: totalContributed,
    totalInterestEarned: Math.max(0, balance - totalContributed),
    yearlyBreakdown,
  };
}

export interface GstResult {
  netAmount: number;
  gstAmount: number;
  grossAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  ratePercent: number;
}

export function calculateGst(
  amount: number,
  ratePercent: number,
  mode: 'exclusive' | 'inclusive'
): GstResult {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Enter a valid non-negative amount.');
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new Error('Enter a tax rate between 0% and 100%.');
  }

  let netAmount: number;
  let gstAmount: number;
  let grossAmount: number;

  if (mode === 'exclusive') {
    netAmount = amount;
    gstAmount = (amount * ratePercent) / 100;
    grossAmount = netAmount + gstAmount;
  } else {
    grossAmount = amount;
    netAmount = amount / (1 + ratePercent / 100);
    gstAmount = grossAmount - netAmount;
  }

  return {
    netAmount,
    gstAmount,
    grossAmount,
    cgstAmount: gstAmount / 2,
    sgstAmount: gstAmount / 2,
    ratePercent,
  };
}

export interface DiscountResult {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  discountedPrice: number;
  taxPercent: number;
  taxAmount: number;
  finalPrice: number;
}

export function calculateDiscount(
  originalPrice: number,
  discountPercent: number,
  taxPercent = 0
): DiscountResult {
  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    throw new Error('Enter an original price of 0 or greater.');
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0% and 100%.');
  }
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    throw new Error('Optional sales tax must be between 0% and 100%.');
  }

  const discountAmount = (originalPrice * discountPercent) / 100;
  const discountedPrice = Math.max(0, originalPrice - discountAmount);
  const taxAmount = (discountedPrice * taxPercent) / 100;
  const finalPrice = discountedPrice + taxAmount;

  return {
    originalPrice,
    discountPercent,
    discountAmount,
    discountedPrice,
    taxPercent,
    taxAmount,
    finalPrice,
  };
}

export function parseStrictIsoDate(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Enter a valid date in YYYY-MM-DD format.');
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error(`"${dateStr}" is not a valid calendar date.`);
  }
  return dt;
}

export interface DateDifferenceResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  remainingDays: number;
  weekdaysCount: number;
  direction: 'forward' | 'backward' | 'same';
}

export function calculateDateDifference(startStr: string, endStr: string): DateDifferenceResult {
  const start = parseStrictIsoDate(startStr);
  const end = parseStrictIsoDate(endStr);

  const msPerDay = 24 * 60 * 60 * 1000;
  const rawDiffDays = Math.round((end.getTime() - start.getTime()) / msPerDay);
  const direction: DateDifferenceResult['direction'] =
    rawDiffDays > 0 ? 'forward' : rawDiffDays < 0 ? 'backward' : 'same';

  const earlier = rawDiffDays >= 0 ? start : end;
  const later = rawDiffDays >= 0 ? end : start;

  let years = later.getUTCFullYear() - earlier.getUTCFullYear();
  let months = later.getUTCMonth() - earlier.getUTCMonth();
  let days = later.getUTCDate() - earlier.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), 0)).getUTCDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.abs(rawDiffDays);
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  // Compute weekday count cleanly without huge loops for multi-century spans
  const fullWeeks = Math.floor(totalDays / 7);
  let weekdaysCount = fullWeeks * 5;
  const rem = totalDays % 7;
  const startDow = earlier.getUTCDay();
  for (let i = 0; i < rem; i++) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) weekdaysCount++;
  }

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    remainingDays,
    weekdaysCount,
    direction,
  };
}

export function addOrSubtractDays(
  baseDateStr: string,
  daysOffset: number,
  operation: 'add' | 'subtract'
): { isoDate: string; formattedDate: string; weekday: string; isLeapYear: boolean } {
  const base = parseStrictIsoDate(baseDateStr);
  if (!Number.isFinite(daysOffset) || !Number.isInteger(daysOffset) || daysOffset < 0 || daysOffset > 365000) {
    throw new Error('Enter a whole number of days between 0 and 365,000.');
  }

  const signedDays = operation === 'add' ? daysOffset : -daysOffset;
  const target = new Date(base.getTime());
  target.setUTCDate(target.getUTCDate() + signedDays);

  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, '0');
  const d = String(target.getUTCDate()).padStart(2, '0');

  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(target);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(target);

  const isLeapYear = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  return {
    isoDate: `${y}-${m}-${d}`,
    formattedDate,
    weekday,
    isLeapYear,
  };
}
