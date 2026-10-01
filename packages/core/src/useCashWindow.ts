import { useState } from "react";
import {
  localToday,
  parseMoney,
  paydayForecast,
  readCashWindow,
} from "./homeValue.ts";
import { readPlanningData, type PlanningData } from "./planning.ts";
import type { SavingsPlanInput } from "./savingsPlan.ts";
export function useCashWindow(
  input: SavingsPlanInput,
  data: PlanningData | undefined,
  onSave: (data: PlanningData) => void | Promise<void>,
  de: boolean,
) {
  const p = readPlanningData(data),
    cash = p.cash,
    today = localToday();
  const [balance, setBalance] = useState(cash ? String(cash.balance) : ""),
    [payday, setPayday] = useState(cash?.payday ?? ""),
    [protectedAmount, setProtected] = useState(String(cash?.protected ?? 0)),
    [everyday, setEveryday] = useState(
      cash?.everydayRemaining == null ? "" : String(cash.everydayRemaining),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const forecast = paydayForecast(
    input.costs,
    cash,
    input.variableMonthly,
    today,
  );
  async function save() {
    const next = readCashWindow({
      balance: parseMoney(balance),
      asOf: today,
      payday,
      protected: parseMoney(protectedAmount),
      everydayRemaining: everyday.trim() ? parseMoney(everyday) : null,
    });
    if (
      !next ||
      !paydayForecast(input.costs, next, input.variableMonthly, today)
    ) {
      setError(
        de
          ? "Beträge ab 0 und einen Gehaltstermin innerhalb der nächsten 90 Tage eingeben."
          : "Enter non-negative amounts and a payday within the next 90 days.",
      );
      return false;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({ ...p, cash: next });
      return true;
    } catch {
      setError(de ? "Speichern fehlgeschlagen." : "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    balance,
    setBalance,
    payday,
    setPayday,
    protectedAmount,
    setProtected,
    everyday,
    setEveryday,
    busy,
    error,
    save,
    forecast,
    today,
    stale: !!cash && cash.asOf !== today,
    cash,
  };
}
