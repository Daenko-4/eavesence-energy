import assert from "node:assert/strict";
import test from "node:test";

import {
  annualCost,
  createHouseholdCost,
  monthlyCost,
  readHouseholdCosts,
  reorderHouseholdCosts,
  removeHouseholdCost,
  summarizeHouseholdCosts,
  upsertHouseholdCost,
} from "../src/lib/householdCosts.ts";

test("normalizes recurring costs to monthly and yearly values", () => {
  assert.equal(monthlyCost(120, "yearly"), 10);
  assert.equal(monthlyCost(90, "quarterly"), 30);
  assert.equal(monthlyCost(600, "half-yearly"), 100);
  assert.equal(monthlyCost(10, "weekly"), 520 / 12);
  assert.equal(annualCost(50, "monthly"), 600);
});

test("creates, reads and updates a household cost", () => {
  const cost = createHouseholdCost({
    id: "insurance",
    name: "  Home insurance  ",
    category: "insurance",
    amount: 600,
    frequency: "yearly",
    tileId: "insurance-tile",
    nextDueDate: "2026-11-15",
    now: new Date("2026-09-20T12:00:00.000Z"),
  });

  assert.equal(cost?.name, "Home insurance");
  assert.equal(cost?.tileId, "insurance-tile");
  assert.deepEqual(readHouseholdCosts(JSON.stringify([cost])), [cost]);
  assert.equal(
    createHouseholdCost({
      name: "Invalid",
      category: "other",
      amount: 0,
      frequency: "monthly",
    }),
    null,
  );

  const updated = { ...cost, amount: 720 };
  assert.deepEqual(upsertHouseholdCost([cost], updated), [updated]);
  assert.deepEqual(removeHouseholdCost([updated], "insurance"), []);
});

test("summarizes categories and finds the next payment", () => {
  const costs = [
    createHouseholdCost({
      id: "rent",
      name: "Rent",
      category: "housing",
      amount: 1000,
      frequency: "monthly",
      nextDueDate: "2026-10-01",
    }),
    createHouseholdCost({
      id: "insurance",
      name: "Insurance",
      category: "insurance",
      amount: 600,
      frequency: "yearly",
      nextDueDate: "2026-09-28",
    }),
  ].filter(Boolean);

  const summary = summarizeHouseholdCosts(
    costs,
    new Date("2026-09-20T12:00:00.000Z"),
  );

  assert.equal(summary.monthlyTotal, 1050);
  assert.equal(summary.annualTotal, 12600);
  assert.equal(summary.largestCategory, "housing");
  assert.equal(summary.nextDueCost?.id, "insurance");
});

test("drops malformed stored costs without throwing", () => {
  const valid = createHouseholdCost({
    id: "internet",
    name: "Internet",
    category: "subscriptions",
    amount: 35,
    frequency: "monthly",
  });
  const parsed = readHouseholdCosts(
    JSON.stringify([valid, { id: "bad", amount: "35" }]),
  );

  assert.deepEqual(parsed, [valid]);
  assert.deepEqual(readHouseholdCosts("not-json"), []);
});

test("reorders costs without moving an edited item", () => {
  const first = createHouseholdCost({ id: "rent", name: "Rent", category: "housing", amount: 900, frequency: "monthly" });
  const second = createHouseholdCost({ id: "insurance", name: "Insurance", category: "insurance", amount: 600, frequency: "yearly" });
  const reordered = reorderHouseholdCosts([first, second], "insurance", "rent");

  assert.deepEqual(reordered.map((cost) => cost.id), ["insurance", "rent"]);
  const edited = { ...reordered[1], amount: 950 };
  assert.deepEqual(upsertHouseholdCost(reordered, edited).map((cost) => cost.id), ["insurance", "rent"]);
});
