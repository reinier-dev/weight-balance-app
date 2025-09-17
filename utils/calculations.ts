import { Station, MacConfig, EnvelopeData } from '@/types';

// Constants
export const MOMENT_DIVISOR = 100;
export const IN_TO_M = 0.0254;
export const LB_TO_KG = 0.45359237;

// Core calculation utilities
export class WeightBalanceCalculator {
  static evaluateFormula(formula: string, cgValue: number): number {
    // Replace CG with the actual value
    let expression = formula.replace(/CG/gi, cgValue.toString());

    // Basic security check - only allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      throw new Error('Formula contains invalid characters');
    }

    // Evaluate the expression safely
    try {
      return Function('"use strict"; return (' + expression + ')')();
    } catch (e) {
      throw new Error('Mathematical error in formula');
    }
  }

  static calculateMacPercentage(cg: number, macConfig: MacConfig, isMetric: boolean = false): number {
    try {
      const cgValue = isMetric ? cg / IN_TO_M : cg;
      return this.evaluateFormula(macConfig.formula, cgValue);
    } catch (error) {
      console.error('Error calculating MAC percentage:', error);
      return 0;
    }
  }

  static calculateCGFromMac(macPercent: number, macConfig: MacConfig): number | null {
    try {
      const formula = macConfig.formula;

      // For simple linear formulas like "a + ((CG - b) / c) * d = macPercent"
      // We can solve for CG
      if (formula.includes('((CG') && formula.includes(') /')) {
        const parts = formula.match(/([\d\.]+)\s*\+\s*\(\(CG\s*-\s*([\d\.]+)\)\s*\/\s*([\d\.]+)\)\s*\*\s*([\d\.]+)/);
        if (parts) {
          const a = parseFloat(parts[1]);
          const b = parseFloat(parts[2]);
          const c = parseFloat(parts[3]);
          const d = parseFloat(parts[4]);

          // Solve: a + ((CG - b) / c) * d = macPercent
          // CG = ((macPercent - a) * c / d) + b
          return ((macPercent - a) * c / d) + b;
        }
      }
    } catch (e) {
      console.error('Error calculating CG from MAC:', e);
    }
    return null;
  }

  static getStationData(stations: Station[]): Station[] {
    return stations.map((station, index) => ({
      ...station,
      id: index + 1,
      weight: station.weight || 0,
      moment: (station.weight || 0) * station.arm
    }));
  }

  static calculateSummaries(stations: Station[]) {
    const stationData = this.getStationData(stations);
    let zfwWeight = 0, zfwMoment = 0;
    let fuelWeight = 0, fuelMoment = 0;
    let landingFuelWeight = 0, landingFuelMoment = 0;
    let totalWeight = 0, totalMoment = 0;
    let totalArm = 0;

    stationData.forEach(station => {
      const moment = station.weight * station.arm;

      // Accumulate weights and moments
      if (station.type !== 'landing_fuel') {
        totalWeight += station.weight;
        totalMoment += moment;
      }

      // Calculate total ARM (sum of all arms with weight > 0)
      if (station.weight > 0) {
        totalArm += station.arm;
      }

      if (station.type === 'fuel') {
        fuelWeight += station.weight;
        fuelMoment += moment;
      } else if (station.type === 'landing_fuel') {
        landingFuelWeight = station.weight;
        landingFuelMoment = moment;
      } else {
        zfwWeight += station.weight;
        zfwMoment += moment;
      }
    });

    return {
      zfw: { weight: zfwWeight, moment: zfwMoment },
      tow: { weight: zfwWeight + fuelWeight, moment: zfwMoment + fuelMoment },
      ldw: { weight: zfwWeight + landingFuelWeight, moment: zfwMoment + landingFuelMoment },
      totals: { weight: totalWeight, moment: totalMoment, arm: totalArm }
    };
  }

  static calculateEnvelopeData(stations: Station[], macConfig: MacConfig, isMetric: boolean = false): EnvelopeData {
    const summaries = this.calculateSummaries(stations);

    const calculatePoint = (weight: number, moment: number) => {
      let cg = 0, mac = 0;
      if (weight > 0) {
        cg = moment / weight;
        mac = this.calculateMacPercentage(cg, macConfig, isMetric);
      }
      return { cg, weight, mac };
    };

    return {
      zfw: calculatePoint(summaries.zfw.weight, summaries.zfw.moment),
      tow: calculatePoint(summaries.tow.weight, summaries.tow.moment),
      ldw: calculatePoint(summaries.ldw.weight, summaries.ldw.moment)
    };
  }

  static validateLimits(envelopeData: EnvelopeData, macConfig: MacConfig): {
    zfw: boolean;
    tow: boolean;
    ldw: boolean;
    allInLimits: boolean;
  } {
    const zfwInLimits = envelopeData.zfw.mac >= macConfig.macMin && envelopeData.zfw.mac <= macConfig.macMax;
    const towInLimits = envelopeData.tow.mac >= macConfig.macMin && envelopeData.tow.mac <= macConfig.macMax;
    const ldwInLimits = envelopeData.ldw.mac >= macConfig.macMin && envelopeData.ldw.mac <= macConfig.macMax;

    return {
      zfw: zfwInLimits,
      tow: towInLimits,
      ldw: ldwInLimits,
      allInLimits: zfwInLimits && towInLimits && ldwInLimits
    };
  }

  static convertUnits(value: number, fromUnit: 'imperial' | 'metric', toUnit: 'imperial' | 'metric', type: 'weight' | 'length'): number {
    if (fromUnit === toUnit) return value;

    if (type === 'weight') {
      return fromUnit === 'imperial' ? value * LB_TO_KG : value / LB_TO_KG;
    } else {
      return fromUnit === 'imperial' ? value * IN_TO_M : value / IN_TO_M;
    }
  }

  static formatWeight(weight: number, unit: 'imperial' | 'metric'): string {
    const unitLabel = unit === 'imperial' ? 'lb' : 'kg';
    return `${weight.toFixed(1)} ${unitLabel}`;
  }

  static formatLength(length: number, unit: 'imperial' | 'metric'): string {
    const unitLabel = unit === 'imperial' ? 'in' : 'm';
    const decimals = unit === 'imperial' ? 3 : 4;
    return `${length.toFixed(decimals)} ${unitLabel}`;
  }

  static formatMoment(moment: number): string {
    return (moment / MOMENT_DIVISOR).toFixed(2);
  }
}

// Predefined aircraft templates
export const AIRCRAFT_TEMPLATES = {
  cessna172: {
    name: 'Cessna 172N',
    description: 'Standard Cessna 172N configuration',
    macConfig: {
      formula: "((CG - 35.0) / 14.9) * 100",
      macMin: 15,
      macMax: 38
    },
    stations: [
      { id: 1, description: "Empty Weight", arm: 39.0, type: "basic" as const, weight: 1500 },
      { id: 2, description: "Pilot", arm: 37.0, type: "basic" as const, weight: 0 },
      { id: 3, description: "Passenger", arm: 37.0, type: "basic" as const, weight: 0 },
      { id: 4, description: "Rear Passenger", arm: 73.0, type: "basic" as const, weight: 0 },
      { id: 5, description: "Baggage Area 1", arm: 95.0, type: "basic" as const, weight: 0 },
      { id: 6, description: "Baggage Area 2", arm: 123.0, type: "basic" as const, weight: 0 },
      { id: 7, description: "Fuel", arm: 48.0, type: "fuel" as const, weight: 0 },
      { id: 8, description: "Oil", arm: 32.0, type: "basic" as const, weight: 0 }
    ]
  },
  piper28: {
    name: 'Piper PA-28',
    description: 'Standard Piper PA-28 Cherokee configuration',
    macConfig: {
      formula: "((CG - 86.0) / 13.2) * 100",
      macMin: 17,
      macMax: 35
    },
    stations: [
      { id: 1, description: "Empty Weight", arm: 88.8, type: "basic" as const, weight: 1340 },
      { id: 2, description: "Front Seats", arm: 85.5, type: "basic" as const, weight: 0 },
      { id: 3, description: "Rear Seats", arm: 118.1, type: "basic" as const, weight: 0 },
      { id: 4, description: "Baggage", arm: 142.8, type: "basic" as const, weight: 0 },
      { id: 5, description: "Fuel", arm: 95.0, type: "fuel" as const, weight: 0 },
      { id: 6, description: "Oil", arm: 75.0, type: "basic" as const, weight: 0 }
    ]
  },
  airbus319: {
    name: 'Airbus A319',
    description: 'Standard Airbus A319 configuration',
    macConfig: {
      formula: "20 + ((CG - 232.28) / 86.22) * 100",
      macMin: 16,
      macMax: 30
    },
    stations: [
      { id: 1, description: "Basic Aircraft", arm: 236.6, type: "basic" as const, weight: 0 },
      { id: 2, description: "Crew (2)", arm: 80.7, type: "basic" as const, weight: 0 },
      { id: 3, description: "Crew's Baggage", arm: 140.0, type: "basic" as const, weight: 0 },
      { id: 4, description: "Steward's Equipment", arm: 140.0, type: "basic" as const, weight: 0 },
      { id: 5, description: "Emergency Equipment", arm: 150.0, type: "basic" as const, weight: 0 },
      { id: 6, description: "Extra Equipment", arm: 150.0, type: "basic" as const, weight: 0 },
      { id: 7, description: "Potable Water", arm: 240.0, type: "basic" as const, weight: 0 },
      { id: 8, description: "Cargo", arm: 460.0, type: "cargo" as const, weight: 0 },
      { id: 9, description: "Other", arm: 0.0, type: "basic" as const, weight: 0 },
      { id: 10, description: "Other", arm: 0.0, type: "basic" as const, weight: 0 },
      { id: 11, description: "Fuel Tank InBoard", arm: 246.5, type: "fuel" as const, weight: 0 },
      { id: 12, description: "Fuel Tank OutBoard", arm: 246.5, type: "fuel" as const, weight: 0 },
      { id: 13, description: "Landing Fuel (Est.)", arm: 246.5, type: "landing_fuel" as const, weight: 0 }
    ]
  }
};

// Validation utilities
export class ValidationUtils {
  static validateFormula(formula: string): { isValid: boolean; error?: string } {
    try {
      // Test the formula with a sample CG value
      const testCG = 240;
      const testResult = WeightBalanceCalculator.evaluateFormula(formula, testCG);

      if (isNaN(testResult) || !isFinite(testResult)) {
        return { isValid: false, error: 'Formula produces invalid result' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static validateWeight(weight: number, maxWeight: number = 20000): { isValid: boolean; error?: string } {
    if (weight < 0) {
      return { isValid: false, error: 'Weight cannot be negative' };
    }
    if (weight > maxWeight) {
      return { isValid: false, error: `Weight exceeds maximum allowed (${maxWeight})` };
    }
    return { isValid: true };
  }

  static validateStations(stations: Station[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    stations.forEach((station, index) => {
      if (!station.description || station.description.trim() === '') {
        errors.push(`Station ${index + 1}: Description is required`);
      }
      if (typeof station.arm !== 'number' || isNaN(station.arm)) {
        errors.push(`Station ${index + 1}: Valid arm value is required`);
      }
      if (station.weight && station.weight < 0) {
        errors.push(`Station ${index + 1}: Weight cannot be negative`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}