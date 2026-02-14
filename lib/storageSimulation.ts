
import { SimulationParams, SimulationOutput, YearResult, SimulationSummary } from '../types';

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const calculateAnnualCycles = (monthlyCycles: number[], useActualDays: boolean): number => {
  return monthlyCycles.reduce((acc, cyclesPerDay, index) => {
    const days = useActualDays ? MONTH_DAYS[index] : 30.4167; // approx 365/12
    return acc + (cyclesPerDay * days);
  }, 0);
};

export const simulateStoragePlant = (params: SimulationParams): SimulationOutput => {
  const {
    nominalCapacity,
    operationYears,
    dod,
    systemEfficiency,
    firstYearDegradation,
    annualDegradation,
    replaceThreshold,
    useActualMonthDays,
    monthlyCycles
  } = params;

  const yearlyResults: YearResult[] = [];
  let currentSohEnd = 1.0;
  let batteryAge = 1;
  let totalEnergyMWh = 0;
  const replacementYears: number[] = [];

  const annualCyclesCount = calculateAnnualCycles(monthlyCycles, useActualMonthDays);

  for (let year = 1; year <= operation_years_internal(operationYears); year++) {
    const sohStart = currentSohEnd;
    
    // Degradation logic: Relative to 100% linear degradation
    // deg_end(i) = first_year + annual * max(0, i-1)
    const cumulativeDeg = firstYearDegradation + annualDegradation * Math.max(0, batteryAge - 1);
    const sohEnd = Math.max(0, 1.0 - cumulativeDeg);
    const sohAvg = (sohStart + sohEnd) / 2;

    const annualEnergy = nominalCapacity * sohAvg * dod * systemEfficiency * annualCyclesCount;
    
    let isReplaced = false;
    if (sohEnd < replaceThreshold) {
      isReplaced = true;
      replacementYears.push(year);
    }

    yearlyResults.push({
      year,
      batteryAge,
      sohStart,
      sohEnd,
      sohAvg,
      annualCycles: annualCyclesCount,
      annualEnergy,
      isReplaced
    });

    totalEnergyMWh += annualEnergy;

    // Preparation for next year
    if (isReplaced) {
      currentSohEnd = 1.0; // Reset for next year start
      batteryAge = 1;
    } else {
      currentSohEnd = sohEnd;
      batteryAge += 1;
    }
  }

  const summary: SimulationSummary = {
    totalEnergyMWh,
    totalEnergyBillionKWh: totalEnergyMWh / 1000000,
    avgAnnualEnergyMWh: totalEnergyMWh / operationYears,
    replacementYears
  };

  return { params, yearlyResults, summary };
};

// Helper to handle loop range properly
function operation_years_internal(years: number) {
  return years;
}
