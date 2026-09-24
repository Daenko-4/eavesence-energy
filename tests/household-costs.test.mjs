import assert from "node:assert/strict";
import test from "node:test";

import {
  annualCost,
  createHouseholdCost,
  monthlyCost,
  paymentsNextMonth,
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

test("groups every dated payment in the next calendar month and excludes undated estimates", () => {
  const costs = [
    createHouseholdCost({ id: "rent", name: "Rent", category: "housing", amount: 900, frequency: "monthly", nextDueDate: "2026-09-01" }),
    createHouseholdCost({ id: "internet", name: "Internet", category: "subscriptions", amount: 40, frequency: "monthly", nextDueDate: "2026-10-01" }),
    createHouseholdCost({ id: "insurance", name: "Insurance", category: "insurance", amount: 600, frequency: "half-yearly", nextDueDate: "2026-04-15" }),
    createHouseholdCost({ id: "weekly", name: "Weekly", category: "other", amount: 10, frequency: "weekly", nextDueDate: "2026-09-29" }),
    createHouseholdCost({ id: "electricity", name: "Electricity", category: "energy", amount: 60, frequency: "monthly" }),
  ];
  const result = paymentsNextMonth(costs, new Date("2026-09-20T12:00:00Z"));
  assert.equal(result.month, "2026-10");
  assert.equal(result.total, 1580);
  assert.equal(result.undatedCount, 1);
  assert.equal(result.payments.filter(({ date }) => date === "2026-10-01").length, 2);
  assert.equal(result.payments.filter(({ cost }) => cost.id === "weekly").length, 4);
  assert.deepEqual(result.payments.map(({ cost }) => cost.id), ["rent", "insurance", "internet", "weekly", "weekly", "weekly", "weekly"]);
});

test("keeps the last day of month for monthly payments without drifting", () => {
  const endOfMonth = createHouseholdCost({ id: "rent", name: "Rent", category: "housing", amount: 100, frequency: "monthly", nextDueDate: "2026-01-31" });
  assert.deepEqual(paymentsNextMonth([endOfMonth], new Date("2026-01-01T00:00:00Z")).payments.map(({ date }) => date), ["2026-02-28"]);
  assert.deepEqual(paymentsNextMonth([endOfMonth], new Date("2026-02-01T00:00:00Z")).payments.map(({ date }) => date), ["2026-03-31"]);
});
