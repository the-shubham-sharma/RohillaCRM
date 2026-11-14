import { DimensionUnit, PrintSides } from '../types';

export interface AreaCalculationResult {
  areaPerSideSqFt: number;
  totalAreaSqFt: number;
  areaPerSideSqM: number;
  totalAreaSqM: number;
}

const INCHES_TO_FEET = 12;
const MM_TO_FEET = 304.8;
const METRES_TO_FEET = 3.280839895;
const SQFT_TO_SQM = 10.7639104;

function toFeet(value: number, unit: DimensionUnit): number {
  switch (unit) {
    case 'FEET':
      return value;
    case 'INCHES':
      return value / INCHES_TO_FEET;
    case 'METRES':
      return value * METRES_TO_FEET;
    case 'MILLIMETRES':
      return value / MM_TO_FEET;
    default:
      return value;
  }
}

export function calculateArea(
  width?: number,
  height?: number,
  unit: DimensionUnit = 'FEET',
  printSides: PrintSides = 'SINGLE_SIDED'
): AreaCalculationResult {
  if (!width || !height || width <= 0 || height <= 0) {
    return {
      areaPerSideSqFt: 0,
      totalAreaSqFt: 0,
      areaPerSideSqM: 0,
      totalAreaSqM: 0,
    };
  }

  const widthInFeet = toFeet(width, unit);
  const heightInFeet = toFeet(height, unit);

  const areaPerSideSqFt = Number((widthInFeet * heightInFeet).toFixed(2));
  const sideMultiplier = printSides === 'DOUBLE_SIDED' ? 2 : 1;
  const totalAreaSqFt = Number((areaPerSideSqFt * sideMultiplier).toFixed(2));

  const areaPerSideSqM = Number((areaPerSideSqFt / SQFT_TO_SQM).toFixed(2));
  const totalAreaSqM = Number((totalAreaSqFt / SQFT_TO_SQM).toFixed(2));

  return {
    areaPerSideSqFt,
    totalAreaSqFt,
    areaPerSideSqM,
    totalAreaSqM,
  };
}
