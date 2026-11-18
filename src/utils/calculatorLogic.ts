export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonthsApprox: number;
  daysUntilNextBirthday: number;
  isBirthdayToday: boolean;
}

export function calculateExactAge(dobString: string, referenceDateString?: string): AgeResult {
  if (!dobString) {
    throw new Error('Select a date of birth.');
  }

  const dobParts = dobString.split('-').map(Number);
  if (dobParts.length !== 3 || dobParts.some(Number.isNaN)) {
    throw new Error('Invalid date of birth format.');
  }

  const dob = new Date(dobParts[0], dobParts[1] - 1, dobParts[2]);
  if (
    dob.getFullYear() !== dobParts[0] ||
    dob.getMonth() !== dobParts[1] - 1 ||
    dob.getDate() !== dobParts[2]
  ) {
    throw new Error('The entered date does not exist on the calendar.');
  }

  let ref: Date;
  if (referenceDateString) {
    const refParts = referenceDateString.split('-').map(Number);
    if (refParts.length !== 3 || refParts.some(Number.isNaN)) {
      throw new Error('Invalid target date.');
    }
    ref = new Date(refParts[0], refParts[1] - 1, refParts[2]);
  } else {
    const now = new Date();
    ref = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (dob.getTime() > ref.getTime()) {
    throw new Error('Date of birth cannot be in the future.');
  }

  let years = ref.getFullYear() - dob.getFullYear();
  let months = ref.getMonth() - dob.getMonth();
  let days = ref.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((ref.getTime() - dob.getTime()) / msPerDay);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonthsApprox = years * 12 + months;

  let nextBirthday = new Date(ref.getFullYear(), dob.getMonth(), dob.getDate());
  if (dob.getMonth() === 1 && dob.getDate() === 29 && nextBirthday.getMonth() !== 1) {
    nextBirthday = new Date(ref.getFullYear(), 1, 28);
  }
  if (nextBirthday.getTime() < ref.getTime()) {
    nextBirthday = new Date(ref.getFullYear() + 1, dob.getMonth(), dob.getDate());
    if (dob.getMonth() === 1 && dob.getDate() === 29 && nextBirthday.getMonth() !== 1) {
      nextBirthday = new Date(ref.getFullYear() + 1, 1, 28);
    }
  }

  const daysUntilNextBirthday = Math.round((nextBirthday.getTime() - ref.getTime()) / msPerDay);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalMonthsApprox,
    daysUntilNextBirthday,
    isBirthdayToday: daysUntilNextBirthday === 0,
  };
}

export type BmiCategory = 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';

export interface BmiResult {
  bmi: number;
  category: BmiCategory;
  healthyMinKg: number;
  healthyMaxKg: number;
  healthyMinLbs: number;
  healthyMaxLbs: number;
}

export function calculateBmiMetric(heightCm: number, weightKg: number): BmiResult {
  if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
    throw new Error('Enter a valid height between 1 and 300 cm.');
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    throw new Error('Enter a valid weight between 1 and 500 kg.');
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return buildBmiResult(bmi, heightM);
}

export function calculateBmiImperial(
  heightFeet: number,
  heightInches: number,
  weightLbs: number
): BmiResult {
  const totalInches = heightFeet * 12 + heightInches;
  if (!Number.isFinite(totalInches) || totalInches <= 0 || totalInches > 120) {
    throw new Error('Enter a valid height.');
  }
  if (!Number.isFinite(weightLbs) || weightLbs <= 0 || weightLbs > 1100) {
    throw new Error('Enter a valid weight in pounds.');
  }

  const heightM = totalInches * 0.0254;
  const weightKg = weightLbs * 0.45359237;
  const bmi = weightKg / (heightM * heightM);
  return buildBmiResult(bmi, heightM);
}

function buildBmiResult(bmi: number, heightM: number): BmiResult {
  let category: BmiCategory;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obesity';

  const healthyMinKg = 18.5 * heightM * heightM;
  const healthyMaxKg = 24.9 * heightM * heightM;
  const kgToLbs = 2.20462262;

  return {
    bmi,
    category,
    healthyMinKg,
    healthyMaxKg,
    healthyMinLbs: healthyMinKg * kgToLbs,
    healthyMaxLbs: healthyMaxKg * kgToLbs,
  };
}

export type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume';

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  toBaseFactor?: number; // linear factor to base SI unit (m, kg, m2, L)
}

export const UNIT_DEFINITIONS: Record<UnitCategory, UnitDefinition[]> = {
  length: [
    { id: 'mm', label: 'Millimeters', symbol: 'mm', toBaseFactor: 0.001 },
    { id: 'cm', label: 'Centimeters', symbol: 'cm', toBaseFactor: 0.01 },
    { id: 'm', label: 'Meters', symbol: 'm', toBaseFactor: 1 },
    { id: 'km', label: 'Kilometers', symbol: 'km', toBaseFactor: 1000 },
    { id: 'in', label: 'Inches', symbol: 'in', toBaseFactor: 0.0254 },
    { id: 'ft', label: 'Feet', symbol: 'ft', toBaseFactor: 0.3048 },
    { id: 'yd', label: 'Yards', symbol: 'yd', toBaseFactor: 0.9144 },
    { id: 'mi', label: 'Miles', symbol: 'mi', toBaseFactor: 1609.344 },
  ],
  weight: [
    { id: 'mg', label: 'Milligrams', symbol: 'mg', toBaseFactor: 0.000001 },
    { id: 'g', label: 'Grams', symbol: 'g', toBaseFactor: 0.001 },
    { id: 'kg', label: 'Kilograms', symbol: 'kg', toBaseFactor: 1 },
    { id: 't', label: 'Metric Tons', symbol: 't', toBaseFactor: 1000 },
    { id: 'oz', label: 'Ounces', symbol: 'oz', toBaseFactor: 0.028349523125 },
    { id: 'lb', label: 'Pounds', symbol: 'lb', toBaseFactor: 0.45359237 },
    { id: 'st', label: 'Stones', symbol: 'st', toBaseFactor: 6.35029318 },
  ],
  temperature: [
    { id: 'c', label: 'Celsius', symbol: '°C' },
    { id: 'f', label: 'Fahrenheit', symbol: '°F' },
    { id: 'k', label: 'Kelvin', symbol: 'K' },
  ],
  area: [
    { id: 'mm2', label: 'Square Millimeters', symbol: 'mm²', toBaseFactor: 0.000001 },
    { id: 'cm2', label: 'Square Centimeters', symbol: 'cm²', toBaseFactor: 0.0001 },
    { id: 'm2', label: 'Square Meters', symbol: 'm²', toBaseFactor: 1 },
    { id: 'ha', label: 'Hectares', symbol: 'ha', toBaseFactor: 10000 },
    { id: 'km2', label: 'Square Kilometers', symbol: 'km²', toBaseFactor: 1000000 },
    { id: 'in2', label: 'Square Inches', symbol: 'in²', toBaseFactor: 0.00064516 },
    { id: 'ft2', label: 'Square Feet', symbol: 'ft²', toBaseFactor: 0.09290304 },
    { id: 'yd2', label: 'Square Yards', symbol: 'yd²', toBaseFactor: 0.83612736 },
    { id: 'ac', label: 'Acres', symbol: 'ac', toBaseFactor: 4046.8564224 },
    { id: 'mi2', label: 'Square Miles', symbol: 'mi²', toBaseFactor: 2589988.110336 },
  ],
  volume: [
    { id: 'ml', label: 'Milliliters', symbol: 'mL', toBaseFactor: 0.001 },
    { id: 'l', label: 'Liters', symbol: 'L', toBaseFactor: 1 },
    { id: 'm3', label: 'Cubic Meters', symbol: 'm³', toBaseFactor: 1000 },
    { id: 'tsp', label: 'US Teaspoons', symbol: 'tsp', toBaseFactor: 0.00492892159375 },
    { id: 'tbsp', label: 'US Tablespoons', symbol: 'tbsp', toBaseFactor: 0.01478676478125 },
    { id: 'floz', label: 'US Fluid Ounces', symbol: 'fl oz', toBaseFactor: 0.0295735295625 },
    { id: 'cup', label: 'US Cups', symbol: 'cup', toBaseFactor: 0.2365882365 },
    { id: 'pt', label: 'US Pints', symbol: 'pt', toBaseFactor: 0.473176473 },
    { id: 'qt', label: 'US Quarts', symbol: 'qt', toBaseFactor: 0.946352946 },
    { id: 'gal', label: 'US Gallons', symbol: 'gal', toBaseFactor: 3.785411784 },
  ],
};

export function convertUnitValue(
  category: UnitCategory,
  value: number,
  fromId: string,
  toId: string
): number {
  if (!Number.isFinite(value)) return NaN;
  if (fromId === toId) return value;

  if (category === 'temperature') {
    let celsius: number;
    if (fromId === 'c') celsius = value;
    else if (fromId === 'f') celsius = ((value - 32) * 5) / 9;
    else if (fromId === 'k') celsius = value - 273.15;
    else throw new Error('Unknown temperature unit.');

    if (toId === 'c') return celsius;
    if (toId === 'f') return (celsius * 9) / 5 + 32;
    if (toId === 'k') return celsius + 273.15;
    throw new Error('Unknown temperature unit.');
  }

  const units = UNIT_DEFINITIONS[category];
  const fromDef = units.find((u) => u.id === fromId);
  const toDef = units.find((u) => u.id === toId);
  if (!fromDef?.toBaseFactor || !toDef?.toBaseFactor) {
    throw new Error('Invalid conversion units.');
  }

  const baseValue = value * fromDef.toBaseFactor;
  return baseValue / toDef.toBaseFactor;
}
