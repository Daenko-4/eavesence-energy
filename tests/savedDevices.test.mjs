import test from "node:test";
import assert from "node:assert/strict";

import { readSavedDevices } from "../src/lib/savedDevices.ts";

const validDevice = {
  id: "coffee-machine-1",
  device: "Kaffeemaschine",
  customDeviceName: "",
  mode: "estimate",
  currency: "EUR",
  price: 0.35,
  watts: 1200,
  minutesPerUse: 10,
  usesPerWeek: 7,
  estimatedKwhPerUse: 0,
  measuredKwhPerUse: 0,
  yearlyKwh: 72.8,
  yearlyCost: 25.48,
  monthlyCost: 25.48 / 12,
  updatedAt: "2026-09-13T00:00:00.000Z",
};

test("reads a valid locally saved device", () => {
  assert.deepEqual(readSavedDevices(JSON.stringify([validDevice])), [validDevice]);
});

test("rejects malformed backups without throwing", () => {
  assert.deepEqual(readSavedDevices(null), []);
  assert.deepEqual(readSavedDevices("not json"), []);
  assert.deepEqual(readSavedDevices(JSON.stringify({ devices: [] })), []);
});

test("keeps valid entries and removes invalid entries from mixed backups", () => {
  const invalidCurrency = { ...validDevice, id: "bad-currency", currency: "USD" };
  const missingCost = { ...validDevice, id: "missing-cost" };
  delete missingCost.yearlyCost;

  assert.deepEqual(
    readSavedDevices(
      JSON.stringify([invalidCurrency, validDevice, missingCost]),
    ),
    [validDevice],
  );
});
