
export interface SimulationParams {
  nominalCapacity: number; // MWh
  operationYears: number;
  dod: number; // 0-1
  systemEfficiency: number; // 0-1
  firstYearDegradation: number; // 0-1
  annualDegradation: number; // 0-1
  replaceThreshold: number; // 0-1
  useActualMonthDays: boolean;
  monthlyCycles: number[]; // Array of 12 numbers (avg cycles per day)
}

export interface YearResult {
  year: number;
  batteryAge: number;
  sohStart: number;
  sohEnd: number;
  sohAvg: number;
  annualCycles: number;
  annualEnergy: number; // MWh
  isReplaced: boolean;
}

export interface SimulationSummary {
  totalEnergyMWh: number;
  totalEnergyBillionKWh: number;
  avgAnnualEnergyMWh: number;
  replacementYears: number[];
}

export interface SimulationOutput {
  params: SimulationParams;
  yearlyResults: YearResult[];
  summary: SimulationSummary;
}
