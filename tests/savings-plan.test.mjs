import assert from "node:assert/strict";
import { test } from "node:test";

import { compareSavingsActions, createSavingsAction, createSavingsPlan, readSavingsActions } from "../packages/core/src/savingsPlan.ts";
import { convertWebBackup } from "../apps/mobile/src/webBackup.ts";

const cost = (id, amount, frequency, nextDueDate, category = "insurance") => ({
  id, name: id, amount, frequency, nextDueDate, category, updatedAt: "2026-09-01T00:00:00Z",
});

test("annual bills appear once in their due month and never get deducted twice", () => {
  const plan = createSavingsPlan({ incomeMonthly: 2800, variableMonthly: 650, bufferMonthly: 150,
    goalMonthly: 200, costs: [cost("rent", 1600, "monthly", "2026-10-01", "housing"), cost("insurance", 480, "yearly", "2026-11-15")], startMonth: "2026-10" });
  assert.equal(plan.averageFixed, 1640);
  assert.equal(plan.averageRoom, 360);
  assert.equal(plan.months[0].fixed, 1600);
  assert.equal(plan.months[1].fixed, 2080);
  assert.equal(plan.months[1].remaining, -80);
  assert.equal(plan.tightMonths.length, 1);
});

test("missing everyday spending and payment dates mark the plan incomplete", () => {
  const plan = createSavingsPlan({ incomeMonthly: 1000, variableMonthly: null, bufferMonthly: 0,
    goalMonthly: 0, costs: [cost("insurance", 120, "yearly", "")], startMonth: "2026-10" });
  assert.equal(plan.complete, false);
  assert.equal(plan.undatedCount, 1);
  assert.equal(plan.months[0].fixed, 10);
});

test("a scenario changes only payments from the chosen month and reports the first actual effect", () => {
  const rent = cost("rent", 1000, "monthly", "2026-10-01", "housing");
  const insurance = cost("insurance", 480, "yearly", "2026-11-15");
  const input = { incomeMonthly: 1800, variableMonthly: 300, bufferMonthly: 100,
    goalMonthly: 100, costs: [rent, insurance], startMonth: "2026-10" };
  const action = createSavingsAction(insurance, 240, "2026-12");
  assert.equal(action.status, "planned");
  const result = compareSavingsActions(input, [action]);
  assert.equal(result.firstBenefitMonth, null); // November's annual bill was already due.
  assert.equal(result.totalDifference, 0);
  const earlier = compareSavingsActions(input, [createSavingsAction(insurance, 240, "2026-11")]);
  assert.equal(earlier.firstBenefitMonth, "2026-11");
  assert.equal(earlier.totalDifference, 240);
  assert.equal(earlier.baselineTightMonths, 1);
  assert.equal(earlier.tightMonths, 0);
});

test("multiple actions combine once, without double counting changed source costs", () => {
  const subscription = cost("subscription", 20, "monthly", "2026-10-01", "subscriptions");
  const input = { incomeMonthly: 1000, variableMonthly: 300, bufferMonthly: 0, goalMonthly: 0,
    costs: [subscription], startMonth: "2026-10" };
  const action = createSavingsAction(subscription, 0, "2026-12");
  const result = compareSavingsActions(input, [action, action]);
  assert.equal(result.months[0].saved, 0);
  assert.equal(result.months[2].saved, 20);
  assert.equal(result.totalDifference, 200);
  assert.equal(compareSavingsActions({ ...input, costs: [{ ...subscription, amount: 15 }] }, [action]).totalDifference, 0);
  assert.deepEqual(readSavingsActions([action, { ...action, newAmount: -1 }]), [action]);
});

test("website backups import with income, CHF, custom tiles and consumption devices", () => {
  const stamp = "2026-09-01T00:00:00Z";
  const file = JSON.stringify({ version: 1, exportedAt: stamp,
    profile: { version: 1, name: "Home", currency: "CHF", electricityPrice: .3, savingsGoalPercent: 10, rooms: [], deviceRooms: {}, createdAt: stamp, updatedAt: stamp, onboardingCompletedAt: stamp, incomeAmount: 3500, variableMonthly: 600,
      savingsActions: [{ costId: "internet", name: "internet", frequency: "monthly", originalAmount: 50, newAmount: 25, effectiveMonth: "2026-11", status: "planned" }] },
    devices: [{ id: "dev1", device: "kuehlschrank", customDeviceName: "", mode: "estimate", currency: "CHF", price: .3, watts: 0, minutesPerUse: 0, usesPerWeek: 1 / 52, estimatedKwhPerUse: 200, measuredKwhPerUse: 0, yearlyKwh: 200, yearlyCost: 60, monthlyCost: 5, updatedAt: stamp }],
    history: [], costs: [cost("internet", 50, "monthly", "2026-10-01", "subscriptions")], tiles: [{ id: "default-energy", kind: "energy", title: null }, { id: "default-costs", kind: "costs", title: null }],
  });
  const backup = convertWebBackup(file);
  assert.equal(backup.profile.currency, "CHF");
  assert.equal(backup.profile.variableMonthly, 600);
  assert.equal(backup.profile.savingsActions[0].newAmount, 25);
  assert.equal(backup.devices[0].name, "Kühlschrank");
  assert.equal(backup.devices[0].calculationType, "consumption");
  assert.equal(backup.costs.length, 1);
  assert.equal(convertWebBackup(file.replace('"currency":"CHF"', '"currency":"GBP"')), null);
});
