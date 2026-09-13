import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEnergyCosts,
  calculateUsageScenario,
} from "../src/lib/energyCalculations.ts";

function closeTo(actual, expected, tolerance = 1e-10) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

const baseInput = {
  mode: "estimate",
  calculationType: "power",
  electricityPrice: 0.35,
  watts: 1200,
  minutesPerUse: 10,
  usesPerWeek: 7,
  estimatedKwhPerUse: 0,
  measuredKwhPerUse: 0,
};

test("calculates the default coffee machine reference values", () => {
  const result = calculateEnergyCosts(baseInput);

  assert.equal(result.isValid, true);
  closeTo(result.kwhPerUse, 0.2);
  closeTo(result.yearlyKwh, 72.8);
  closeTo(result.yearlyCost, 25.48);
  closeTo(result.monthlyCost, 25.48 / 12);
  closeTo(result.weeklyCost, 0.49);
  closeTo(result.costPerUse, 0.07);
});

test("uses stored kWh values for consumption-based devices", () => {
  const result = calculateEnergyCosts({
    ...baseInput,
    calculationType: "consumption",
    estimatedKwhPerUse: 0.65,
    usesPerWeek: 4,
  });

  closeTo(result.kwhPerUse, 0.65);
  closeTo(result.yearlyKwh, 135.2);
  closeTo(result.yearlyCost, 47.32);
});

test("measured mode overrides typical power and consumption values", () => {
  const result = calculateEnergyCosts({
    ...baseInput,
    mode: "exact",
    measuredKwhPerUse: 0.14,
  });

  closeTo(result.kwhPerUse, 0.14);
  closeTo(result.yearlyCost, 17.836);
});

test("returns zero totals when a required input is missing", () => {
  for (const input of [
    { ...baseInput, electricityPrice: 0 },
    { ...baseInput, usesPerWeek: 0 },
    { ...baseInput, watts: 0 },
    { ...baseInput, minutesPerUse: 0 },
    { ...baseInput, mode: "exact", measuredKwhPerUse: 0 },
  ]) {
    const result = calculateEnergyCosts(input);
    assert.equal(result.isValid, false);
    assert.equal(result.yearlyKwh, 0);
    assert.equal(result.yearlyCost, 0);
    assert.equal(result.monthlyCost, 0);
    assert.equal(result.weeklyCost, 0);
  }
});

test("keeps arithmetic stable for small and large currency values", () => {
  const small = calculateEnergyCosts({
    ...baseInput,
    electricityPrice: 0.01,
  });
  const large = calculateEnergyCosts({
    ...baseInput,
    electricityPrice: 400,
  });

  closeTo(small.yearlyCost, 0.728);
  closeTo(large.yearlyCost, 29120);
});

test("what-if scenario clamps usage and reports annual savings", () => {
  const reduced = calculateUsageScenario({
    kwhPerUse: 0.2,
    usesPerWeek: 7,
    scenarioUsesPerWeek: 5,
    electricityPrice: 0.35,
  });
  const excessive = calculateUsageScenario({
    kwhPerUse: 0.2,
    usesPerWeek: 7,
    scenarioUsesPerWeek: 20,
    electricityPrice: 0.35,
  });

  assert.equal(reduced.adjustedUsesPerWeek, 5);
  closeTo(reduced.scenarioYearlyCost, 18.2);
  closeTo(reduced.savings, 7.28);
  assert.equal(excessive.adjustedUsesPerWeek, 7);
  closeTo(excessive.savings, 0);
});
