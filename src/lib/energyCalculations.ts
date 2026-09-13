export type EnergyCalculationMode = "estimate" | "exact";
export type EnergyCalculationType = "power" | "consumption";

export type EnergyCalculationInput = {
  mode: EnergyCalculationMode;
  calculationType: EnergyCalculationType;
  electricityPrice: number;
  watts: number;
  minutesPerUse: number;
  usesPerWeek: number;
  estimatedKwhPerUse: number;
  measuredKwhPerUse: number;
};

export type EnergyCalculationResult = {
  isValid: boolean;
  kwhPerUse: number;
  yearlyKwh: number;
  yearlyCost: number;
  monthlyCost: number;
  weeklyCost: number;
  costPerUse: number;
};

export function calculateEnergyCosts({
  mode,
  calculationType,
  electricityPrice,
  watts,
  minutesPerUse,
  usesPerWeek,
  estimatedKwhPerUse,
  measuredKwhPerUse,
}: EnergyCalculationInput): EnergyCalculationResult {
  const powerKwhPerUse = (watts / 1000) * (minutesPerUse / 60);
  const estimatedConsumption =
    calculationType === "consumption"
      ? estimatedKwhPerUse
      : powerKwhPerUse;
  const kwhPerUse =
    mode === "estimate" ? estimatedConsumption : measuredKwhPerUse;

  const hasValidConsumption =
    mode === "exact"
      ? measuredKwhPerUse > 0
      : calculationType === "consumption"
        ? estimatedKwhPerUse > 0
        : watts > 0 && minutesPerUse > 0;
  const isValid =
    electricityPrice > 0 && usesPerWeek > 0 && hasValidConsumption;
  const yearlyKwh = isValid ? kwhPerUse * usesPerWeek * 52 : 0;
  const yearlyCost = yearlyKwh * electricityPrice;

  return {
    isValid,
    kwhPerUse,
    yearlyKwh,
    yearlyCost,
    monthlyCost: yearlyCost / 12,
    weeklyCost: yearlyCost / 52,
    costPerUse: kwhPerUse * electricityPrice,
  };
}

export function calculateUsageScenario({
  kwhPerUse,
  usesPerWeek,
  scenarioUsesPerWeek,
  electricityPrice,
}: {
  kwhPerUse: number;
  usesPerWeek: number;
  scenarioUsesPerWeek: number;
  electricityPrice: number;
}) {
  const adjustedUsesPerWeek = Math.min(
    Math.max(0, scenarioUsesPerWeek),
    Math.max(0, usesPerWeek),
  );
  const yearlyCost = kwhPerUse * usesPerWeek * 52 * electricityPrice;
  const scenarioYearlyCost =
    kwhPerUse * adjustedUsesPerWeek * 52 * electricityPrice;

  return {
    adjustedUsesPerWeek,
    scenarioYearlyCost,
    savings: yearlyCost - scenarioYearlyCost,
  };
}
