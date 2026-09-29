import assert from "node:assert/strict";
import { test } from "node:test";

import { createSavingsPlan } from "../packages/core/src/savingsPlan.ts";
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

test("website backups import with income, CHF, custom tiles and consumption devices", () => {
  const stamp = "2026-09-01T00:00:00Z";
  const file = JSON.stringify({ version: 1, exportedAt: stamp,
    profile: { version: 1, name: "Home", currency: "CHF", electricityPrice: .3, savingsGoalPercent: 10, rooms: [], deviceRooms: {}, createdAt: stamp, updatedAt: stamp, onboardingCompletedAt: stamp, incomeAmount: 3500, variableMonthly: 600 },
    devices: [{ id: "dev1", device: "kuehlschrank", customDeviceName: "", mode: "estimate", currency: "CHF", price: .3, watts: 0, minutesPerUse: 0, usesPerWeek: 1 / 52, estimatedKwhPerUse: 200, measuredKwhPerUse: 0, yearlyKwh: 200, yearlyCost: 60, monthlyCost: 5, updatedAt: stamp }],
    history: [], costs: [cost("internet", 50, "monthly", "2026-10-01", "subscriptions")], tiles: [{ id: "default-energy", kind: "energy", title: null }, { id: "default-costs", kind: "costs", title: null }],
  });
  const backup = convertWebBackup(file);
  assert.equal(backup.profile.currency, "CHF");
  assert.equal(backup.profile.variableMonthly, 600);
  assert.equal(backup.devices[0].name, "Kühlschrank");
  assert.equal(backup.devices[0].calculationType, "consumption");
  assert.equal(backup.costs.length, 1);
  assert.equal(convertWebBackup(file.replace('"currency":"CHF"', '"currency":"GBP"')), null);
});
