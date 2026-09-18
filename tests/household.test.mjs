import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateHouseholdSummary,
  createHouseholdBackup,
  createMonthlyEnergyEntry,
  createHouseholdProfile,
  localizeDefaultHouseholdName,
  localizeDefaultRoomName,
  readHouseholdProfile,
  readHouseholdBackup,
  readMonthlyEnergyEntries,
  upsertMonthlyEnergyEntry,
} from "../src/lib/household.ts";

test("localizes stored default home and room names", () => {
  assert.equal(localizeDefaultHouseholdName("Mein Zuhause", "en"), "My home");
  assert.equal(localizeDefaultHouseholdName("My home", "de"), "Mein Zuhause");
  assert.equal(localizeDefaultRoomName("Küche", "en"), "Kitchen");
  assert.equal(localizeDefaultRoomName("Living room", "de"), "Wohnzimmer");
  assert.equal(localizeDefaultRoomName("Neuer Raum 7", "en"), "New room 7");
  assert.equal(localizeDefaultRoomName("Studio", "en"), "Studio");
});

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

test("creates and validates a complete household backup", () => {
  const profile = createHouseholdProfile({
    name: "Home",
    currency: "EUR",
    electricityPrice: 0.3,
    savingsGoalPercent: 10,
    roomNames: ["Kitchen"],
    now: new Date("2026-09-16T12:00:00.000Z"),
  });
  const device = {
    id: "coffee",
    device: "Kaffeemaschine",
    customDeviceName: "",
    mode: "estimate",
    currency: "EUR",
    price: 0.3,
    watts: 1200,
    minutesPerUse: 10,
    usesPerWeek: 7,
    estimatedKwhPerUse: 0.2,
    measuredKwhPerUse: 0,
    yearlyKwh: 72.8,
    yearlyCost: 21.84,
    monthlyCost: 1.82,
    updatedAt: "2026-09-16T12:00:00.000Z",
  };
  profile.deviceRooms = { coffee: profile.rooms[0].id, missing: "missing" };
  const backup = createHouseholdBackup({
    profile,
    devices: [device],
    history: [
      {
        month: "2026-09",
        kwh: 210,
        cost: 63,
        updatedAt: "2026-09-16T12:00:00.000Z",
      },
    ],
    now: new Date("2026-09-17T10:00:00.000Z"),
  });
  const restored = readHouseholdBackup(JSON.stringify(backup));

  assert.equal(restored?.devices.length, 1);
  assert.equal(restored?.history.length, 1);
  assert.deepEqual(restored?.profile.deviceRooms, {
    coffee: profile.rooms[0].id,
  });
});

test("rejects an incomplete household backup", () => {
  assert.equal(
    readHouseholdBackup(
      JSON.stringify({ version: 1, exportedAt: "2026-09-17T10:00:00.000Z" }),
    ),
    null,
  );
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

test("monthly consumption calculates cost from the household electricity price", () => {
  const entry = createMonthlyEnergyEntry({
    month: "2026-09",
    mode: "consumption",
    value: 250,
    electricityPrice: 0.3,
    now: new Date("2026-09-18T12:00:00.000Z"),
  });

  assert.equal(entry?.kwh, 250);
  assert.equal(entry?.cost, 75);
});

test("monthly bill amount estimates consumption from the household price", () => {
  const entry = createMonthlyEnergyEntry({
    month: "2026-09",
    mode: "bill",
    value: 75,
    electricityPrice: 0.3,
  });

  assert.equal(entry?.cost, 75);
  assert.equal(entry?.kwh, 250);
  assert.equal(
    createMonthlyEnergyEntry({
      month: "2026-09",
      mode: "bill",
      value: 75,
      electricityPrice: 0,
    }),
    null,
  );
});
