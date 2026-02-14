
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
    monthlyCycles,
    forcedReplacementYears = []
  } = params;

  const yearlyResults: YearResult[] = [];
  let currentSohEnd = 1.0;
  let batteryAge = 1;
  let totalEnergyMWh = 0;
  const replacementYears: number[] = [];

  const annualCyclesCount = calculateAnnualCycles(monthlyCycles, useActualMonthDays);

  for (let year = 1; year <= operationYears; year++) {
    // 检查是否是强制更换年份 (年初触发)
    const isForced = forcedReplacementYears.includes(year);
    
    if (isForced) {
      currentSohEnd = 1.0;
      batteryAge = 1;
      if (!replacementYears.includes(year)) {
        replacementYears.push(year);
      }
    }

    const sohStart = currentSohEnd;
    
    // 衰减逻辑：基于电池当前役龄计算
    const cumulativeDeg = firstYearDegradation + annualDegradation * Math.max(0, batteryAge - 1);
    const sohEnd = Math.max(0, 1.0 - cumulativeDeg);
    const sohAvg = (sohStart + sohEnd) / 2;

    const annualEnergy = nominalCapacity * sohAvg * dod * systemEfficiency * annualCyclesCount;
    
    // 检查是否因 SOH 阈值触发更换 (年末判定，影响下一年年初)
    let thresholdReplaced = false;
    if (sohEnd < replaceThreshold) {
      thresholdReplaced = true;
      if (!replacementYears.includes(year)) {
        replacementYears.push(year);
      }
    }

    yearlyResults.push({
      year,
      batteryAge,
      sohStart,
      sohEnd,
      sohAvg,
      annualCycles: annualCyclesCount,
      annualEnergy,
      isReplaced: isForced || thresholdReplaced,
      isForced
    });

    totalEnergyMWh += annualEnergy;

    // 为下一年做准备
    if (thresholdReplaced) {
      // 如果本年末触发了阈值更换，下一年年初 SOH 重置为 1.0
      currentSohEnd = 1.0;
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
    replacementYears: replacementYears.sort((a, b) => a - b)
  };

  return { params, yearlyResults, summary };
};
