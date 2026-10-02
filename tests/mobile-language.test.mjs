import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
// Exercise the production translator without loading React Native's platform runtime in Node.
const compiled = ts.transpileModule(readFileSync(new URL("../apps/mobile/src/i18n.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const translatorModule = { exports: {} };
runInNewContext(compiled, { module: translatorModule, exports: translatorModule.exports, require: name => name === "react-native" ? { Alert: {}, Text: "span" } : require(name) });
const { localize } = translatorModule.exports;

test("English covers default home, energy, settings and keyboard actions", () => {
  for (const [de, en] of [["Mein Zuhause", "My home"], ["Haushaltskosten", "Household costs"], ["Einstellungen", "Settings"], ["Stromrechner", "Energy"], ["Tastatur schließen", "Hide keyboard"], ["Einkommen speichern", "Save income"], ["Jetzt starten", "Get started"]]) {
    assert.equal(localize("en", de), en);
    assert.equal(localize("de", de), de);
  }
});
test("translated text fragments retain surrounding spaces around numbers and dates", () => {
  assert.equal(localize("en", " pro Jahr · "), " per year · ");
  assert.equal(localize("en", "ZAHLUNGEN IM NÄCHSTEN MONAT · "), "PAYMENTS NEXT MONTH · ");
  assert.equal(localize("en", " % der erfassten Gerätekosten"), " % of recorded device costs");
  assert.equal(localize("en", "Danko’s home"), "Danko’s home");
});
