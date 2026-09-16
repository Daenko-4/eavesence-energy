import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateHouseholdSummary,
  createHouseholdProfile,
  readHouseholdProfile,
  readMonthlyEnergyEntries,
  upsertMonthlyEnergyEntry,
} from "../src/lib/household.ts";

test("creates and validates a household profile", () => {
  const profile = createHouseholdProfile({
    name: "  Zuhause  ",
    currency: "EUR",
    electricityPrice: 0.32,
    savingsGoalPercent: 12,
    roomNames: ["Küche", "Bad"],
    now: new Date("2026-09-16T12:00:00.000Z"),
  });

  assert.equal(profile.name, "Zuhause");
  assert.equal(profile.rooms.length, 2);
  assert.equal(profile.rooms[0].id, "kuche-1");
  assert.deepEqual(readHouseholdProfile(JSON.stringify(profile)), profile);
});

test("summarizes saved devices and savings target", () => {
  const profile = createHouseholdProfile({
    name: "Home",
    currency: "EUR",
    electricityPrice: 0.3,
    savingsGoalPercent: 10,
    roomNames: ["Kitchen"],
  });
  profile.deviceRooms = { first: profile.rooms[0].id };
  const base = {
    customDeviceName: "",
    mode: "estimate",
    currency: "EUR",
    price: 0.3,
    watts: 100,
    minutesPerUse: 60,
    usesPerWeek: 7,
    estimatedKwhPerUse: 0.1,
    measuredKwhPerUse: 0,
    monthlyCost: 10,
    updatedAt: "2026-09-16T12:00:00.000Z",
  };
  const summary = calculateHouseholdSummary(
    [
      { ...base, id: "first", device: "Fridge", yearlyKwh: 200, yearlyCost: 60 },
      { ...base, id: "second", device: "TV", yearlyKwh: 100, yearlyCost: 30 },
    ],
    profile,
  );

  assert.equal(summary.deviceCount, 2);
  assert.equal(summary.annualCost, 90);
  assert.equal(summary.targetSavings, 9);
  assert.equal(summary.topDevice?.device, "Fridge");
  assert.equal(summary.roomTotals[0].annualCost, 60);
  assert.equal(summary.unassignedDeviceCount, 1);
});

test("monthly history keeps the latest value per month", () => {
  const earlier = {
    month: "2026-08",
    kwh: 200,
    cost: 60,
    updatedAt: "2026-08-31T12:00:00.000Z",
  };
  const replacement = {
    ...earlier,
    kwh: 190,
    cost: 57,
    updatedAt: "2026-09-01T12:00:00.000Z",
  };
  const entries = upsertMonthlyEnergyEntry([earlier], replacement);

  assert.deepEqual(entries, [replacement]);
  assert.deepEqual(readMonthlyEnergyEntries(JSON.stringify(entries)), entries);
});
