import { test } from "node:test";
import assert from "node:assert/strict";
import {
  invoiceDraft,
  csvDrafts,
  importCosts,
  paydayForecast,
  readCashWindow,
  savingsToDate,
  confirmSavingsChange,
  parseMoney,
} from "../packages/core/src/homeValue.ts";
import { createSavingsAction } from "../packages/core/src/savingsPlan.ts";
const cost = (id, amount, frequency, date) => ({
  id,
  name: id,
  amount,
  frequency,
  nextDueDate: date,
  category: "subscriptions",
  updatedAt: "2026-10-01T00:00:00Z",
});
test("payday window excludes payday income and bills on payday, includes due bills once across months", () => {
  const cash = {
    balance: 1200,
    asOf: "2026-10-25",
    payday: "2026-11-05",
    protected: 200,
    everydayRemaining: 100,
  };
  const rows = [
    cost("Internet", 40, "monthly", "2026-10-28"),
    cost("Rent", 800, "monthly", "2026-11-01"),
    cost("Payday bill", 200, "monthly", "2026-11-05"),
  ];
  const result = paydayForecast(rows, cash, 600, "2026-10-25");
  assert.equal(result.fixed, 840);
  assert.equal(result.remaining, 60);
  assert.equal(result.days, 11);
  assert.equal(paydayForecast(rows, cash, 600, "2026-10-26"), null);
  assert.equal(
    paydayForecast(rows, { ...cash, payday: "2026-10-25" }, 600, "2026-10-25"),
    null,
  );
  assert.equal(readCashWindow({ ...cash, balance: Infinity }), undefined);
});
test("incomplete payday data remains explicitly incomplete and no everyday estimate is invented", () => {
  const result = paydayForecast(
    [cost("missing", 30, "monthly", "")],
    {
      balance: 100,
      asOf: "2026-10-01",
      payday: "2026-10-25",
      protected: 0,
      everydayRemaining: null,
    },
    null,
    "2026-10-01",
  );
  assert.equal(result.remaining, null);
  assert.equal(result.missingDates, 1);
});
test("invoice extraction suggests only an explicit frequency and labelled total/due date", () => {
  const r = invoiceDraft(
    "Internet Provider\nRechnung 129\nGesamtbetrag: 39,90 EUR\nmonatlich\nFällig am 05.11.2026",
    "bill",
  );
  assert.equal(r.amount, "39,90");
  assert.equal(r.frequency, "monthly");
  assert.equal(r.nextDueDate, "2026-11-05");
  assert.equal(r.currency, "EUR");
  assert.equal(invoiceDraft("Shop\nTotal due 99.90", "bill").frequency, "");
  assert.equal(
    invoiceDraft("Provider\nRechnungsnummer 3990\nFällig am 31.02.2026", "bill")
      .amount,
    "",
  );
});
test("bank CSV ignores income, groups repeated expenses and leaves unknown recurrence unselected", () => {
  const csv =
    "Empfänger;Betrag;Buchungsdatum\nInternet;-39,90;05.09.2026\nInternet;-39,90;05.10.2026\nSalary;2400;01.10.2026\nShop;-18,20;08.10.2026";
  const rows = csvDrafts(csv, "bank.csv");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].frequency, "monthly");
  assert.equal(rows[0].selected, true);
  assert.equal(rows[0].nextDueDate, "");
  assert.equal(rows[1].selected, false);
  assert.equal(
    csvDrafts('name,amount,frequency\n"Provider, Inc",39.90,monthly', "x")[0]
      .name,
    "Provider, Inc",
  );
  assert.throws(() => csvDrafts("unknown;column\na;9", "x"));
});
test("import requires explicit duplicate update and preserves tile/deadline, rejects currency and invalid rows atomically", () => {
  const old = {
    ...cost("Internet", 40, "monthly", "2026-11-05"),
    tileId: "custom",
    cancellationDeadline: "2026-12-01",
  };
  const draft = {
    name: "Internet",
    amount: "35",
    frequency: "monthly",
    category: "subscriptions",
    nextDueDate: "",
    source: "bill",
    selected: true,
  };
  assert.throws(() => importCosts([draft], [old], "EUR"));
  const next = importCosts([{ ...draft, matchId: old.id }], [old], "EUR");
  assert.equal(next[0].amount, 35);
  assert.equal(next[0].tileId, "custom");
  assert.equal(next[0].nextDueDate, "2026-11-05");
  assert.equal(next[0].cancellationDeadline, "2026-12-01");
  assert.throws(() =>
    importCosts([{ ...draft, name: "New", currency: "CHF" }], [old], "EUR"),
  );
  assert.throws(() =>
    importCosts([{ ...draft, name: "New", frequency: "" }], [old], "EUR"),
  );
  assert.equal(old.amount, 40);
});
test("confirmation updates the cost or removes cancellation, rejects changed costs and leaves unconfirmed plans uncounted", () => {
  const c = cost("Internet", 40, "monthly", "2026-10-05"),
    action = createSavingsAction(c, 30, "2026-10");
  assert.equal(savingsToDate([action], "2026-11-06").total, 0);
  const next = confirmSavingsChange([c], [action], action, "2026-10-01");
  assert.equal(next.costs[0].amount, 30);
  assert.equal(next.actions[0].status, "confirmed");
  assert.equal(savingsToDate(next.actions, "2026-10-04").total, 0);
  assert.equal(savingsToDate(next.actions, "2026-11-06").scheduled, 20);
  assert.throws(() =>
    confirmSavingsChange(
      [{ ...c, amount: 45 }],
      [action],
      action,
      "2026-10-01",
    ),
  );
  const stop = createSavingsAction(c, 0, "2026-10");
  assert.equal(
    confirmSavingsChange([c], [stop], stop, "2026-10-01").costs.length,
    0,
  );
});
test("localized monetary formats support decimal and grouping separators without accepting invalid input", () => {
  assert.equal(parseMoney("1.234,56 €"), 1234.56);
  assert.equal(parseMoney("1,234.56"), 1234.56);
  assert.ok(Number.isNaN(parseMoney("")));
  assert.ok(Number.isNaN(parseMoney("12 apples")));
});
