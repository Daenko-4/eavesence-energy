import assert from "node:assert/strict";
import test from "node:test";

import { createMobileBackup, readMobileBackup } from "../apps/mobile/src/backup.ts";
import { createCostTile, defaultTiles, moveTile, readTiles } from "../apps/mobile/src/tiles.ts";

const profile = { name: "Mein Zuhause", electricityPrice: 0.3, savingsGoalPercent: 10, createdAt: "2026-09-28T12:00:00.000Z" };

test("mobile backup restores the complete household and rejects partial imports", () => {
  const custom = { ...createCostTile("Versicherungen"), id: "insurance-tile" };
  const backup = createMobileBackup({
    profile,
    devices: [{ id: "router", name: "Router", watts: 12, minutesPerUse: 1440, usesPerWeek: 7, yearlyKwh: 105.12, yearlyCost: 31.54, monthlyCost: 2.63, updatedAt: profile.createdAt }],
    history: [{ month: "2026-09", kwh: 100, cost: 30, updatedAt: profile.createdAt }],
    costs: [{ id: "insurance", name: "Versicherung", category: "insurance", amount: 120, frequency: "yearly", tileId: custom.id, nextDueDate: "2026-11-01", updatedAt: profile.createdAt }],
    tiles: [...defaultTiles(), custom],
    betaInterested: false,
  }, new Date(profile.createdAt));

  assert.deepEqual(readMobileBackup(JSON.stringify(backup)), backup);
  assert.equal(readMobileBackup(JSON.stringify({ ...backup, costs: [...backup.costs, { bad: true }] })), null);
  assert.equal(readMobileBackup(JSON.stringify({ ...backup, tiles: defaultTiles() })), null);
  assert.equal(readMobileBackup(JSON.stringify({ ...backup, devices: [{ ...backup.devices[0], yearlyCost: "bad" }] })), null);
  assert.equal(readMobileBackup(JSON.stringify({ ...backup, format: "other" })), null);
});

test("mobile tiles preserve order, defaults and safe boundaries", () => {
  const tiles = [...defaultTiles(), { id: "insurance", kind: "costs", title: "Versicherung" }];
  assert.deepEqual(moveTile(tiles, "insurance", -1).map((tile) => tile.id), ["insurance", "default-costs"]);
  assert.equal(moveTile(tiles, "default-costs", -1), tiles);
  assert.deepEqual(readTiles(tiles), tiles);
  assert.deepEqual(readTiles([{ id: "bad", kind: "costs", title: "X" }]), defaultTiles());
});

 test("mobile tiles accept an optional energy tile in legacy backups without adding it to new homes", () => {
  assert.equal(defaultTiles().some(tile => tile.kind === "energy"), false);
  const legacy = [{ id: "default-energy", kind: "energy", title: "Strom & Geräte" }, ...defaultTiles()];
  assert.deepEqual(readTiles(legacy), legacy);
});


test("mobile backups preserve unfinished setup and reject unknown steps", () => {
  const backup = createMobileBackup({ profile: { ...profile, setupStep: "cost" }, devices: [], history: [], costs: [], tiles: defaultTiles(), betaInterested: false });
  assert.equal(readMobileBackup(JSON.stringify(backup))?.profile.setupStep, "cost");
  assert.equal(readMobileBackup(JSON.stringify({ ...backup, profile: { ...backup.profile, setupStep: "unknown" } })), null);
});
