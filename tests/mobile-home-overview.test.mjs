import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { forecastHouseholdCosts } from "../packages/core/src/householdCosts.ts";

const require = createRequire(import.meta.url);
// Render the production overview with native primitives substituted for Node.
// Native layout, keyboard and touch behavior still require an iPhone test.
const primitive = tag => function NativePrimitive({ children, accessibilityRole, accessibilityLabel, accessibilityState }) {
  return React.createElement(tag, { "aria-label": accessibilityLabel, "aria-expanded": accessibilityState?.expanded, role: accessibilityRole === "alert" ? "alert" : undefined }, children);
};
const native = { View: primitive("div"), Text: primitive("span"), Pressable: primitive("button"), StyleSheet: { create: styles => styles } };
const compiled = ts.transpileModule(readFileSync(new URL("../apps/mobile/src/HomeCoreOverview.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const overviewModule = { exports: {} };
runInNewContext(compiled, { module: overviewModule, exports: overviewModule.exports, require: name => name === "react-native" ? native : require(name) });
const { HomeCoreOverview } = overviewModule.exports;
const cost = (overrides = {}) => ({ id: "insurance", name: "Insurance", category: "insurance", amount: 600, frequency: "yearly", nextDueDate: "2026-11-15", updatedAt: "2026-10-03T00:00:00Z", ...overrides });
const money = (amount, locale = "en") => new Intl.NumberFormat(locale === "de" ? "de-AT" : "en-GB", { style: "currency", currency: "EUR" }).format(amount);
function render({ costs = [cost()], income = 2500, locale = "en", upcomingOpen = false } = {}) {
  const noop = () => {};
  return renderToStaticMarkup(React.createElement(HomeCoreOverview, {
    costs, income, locale, currency: "EUR", upcomingOpen,
    forecast: forecastHouseholdCosts(costs, new Date("2026-10-03T00:00:00Z")),
    onUpcoming: noop, onIncome: noop, onCost: noop, onCosts: noop, onReview: noop,
  }));
}
test("native overview separates annual monthly average from dated payment and remainder", () => {
  const html = render({ upcomingOpen: true });
  assert.ok(html.includes(money(50)));
  assert.ok(html.includes(money(2450)));
  assert.ok(html.includes(money(600)));
  assert.ok(html.includes("not your account balance or a savings amount"));
  assert.ok(html.includes("Edit Insurance"));
});
test("undated costs remain in monthly figures with an explicit forecast gap in both languages", () => {
  for (const locale of ["de", "en"]) {
    const html = render({ locale, costs: [cost({ nextDueDate: "" })], upcomingOpen: true });
    assert.ok(html.includes(money(2450, locale)));
    assert.ok(html.includes(locale === "de" ? "Der Monatsdurchschnitt oben berücksichtigt sie trotzdem." : "The monthly average above still includes them."));
    assert.ok(html.includes(locale === "de" ? "Keine terminierten Zahlungen" : "No scheduled payments"));
  }
});
test("missing inputs give one next step and never treat the whole salary as available", () => {
  const first = render({ income: 0, costs: [] });
  assert.ok(first.includes("1 · Add your income"));
  assert.ok(!first.includes("2 · Add your first cost"));
  const second = render({ costs: [] });
  assert.ok(second.includes("2 · Add your first cost"));
  assert.ok(!second.includes("1 · Add your income"));
  assert.match(second, /Left after fixed costs<\/span><span>—<\/span>/);
  assert.ok(!second.includes("Payments next month"));
});
test("fixed costs exceeding income trigger an accessible warning before everyday spending", () => {
  const html = render({ income: 40 });
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes(money(-10)));
  assert.ok(html.includes("before everyday spending"));
});
