import {resolvePayment} from './paymentChecklist.ts';
import { useRef, useState } from "react";
import {
  localToday,
  parseMoney,
  paydayForecast,
  paydayPayments,
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
    p.paidPayments,
    p.actualPayments,
  );
  // Preview dated bills before saving, so the deductions are visible during setup.
  const draftCash = readCashWindow({ balance: 0, asOf: today, payday, protected: 0, everydayRemaining: null });
  const preview = paydayForecast(input.costs, draftCash, input.variableMonthly, today, p.paidPayments, p.actualPayments);
  const suggestedEveryday = preview?.everyday == null ? null : Math.round(preview.everyday * 100) / 100;
  const saving=useRef(false);
  async function save() {
    if(saving.current)return false;
    if (!everyday.trim()) {
      setError(de ? "Trage dein Alltagsbudget bis zum Gehalt ein oder übernimm den Vorschlag. 0 ist möglich." : "Enter your everyday budget until payday or use the suggestion. 0 is allowed.");
      return false;
    }
    const next = readCashWindow({
      balance: parseMoney(balance, de ? "de" : "en"),
      asOf: today,
      payday,
      protected: parseMoney(protectedAmount, de ? "de" : "en"),
      everydayRemaining: everyday.trim() ? parseMoney(everyday, de ? "de" : "en") : null,
    });
    if (
      !next ||
      !paydayForecast(input.costs, next, input.variableMonthly, today, p.paidPayments, p.actualPayments)
    ) {
      setError(
        de
          ? "Guthaben als gültigen Betrag, Ausgaben und Reserve ab 0 und einen Gehaltstermin innerhalb der nächsten 90 Tage eingeben."
          : "Enter a valid balance, non-negative spending and protected amounts, and a payday within the next 90 days.",
      );
      return false;
    }
    saving.current=true;
    setBusy(true);
    setError("");
    try {
      await onSave({ ...p, cash: next });
      return true;
    } catch {
      setError(de ? "Speichern fehlgeschlagen." : "Could not save.");
      return false;
    } finally {
      saving.current=false;
      setBusy(false);
    }
  }
  return {
    bills: paydayPayments(input.costs,cash,today).map(b=>({...resolvePayment(b,p.actualPayments??[]),date:b.date})),
    previewBills: paydayPayments(input.costs,draftCash,today).map(b=>({...resolvePayment(b,p.actualPayments??[]),date:b.date})),
    preview,
    suggestedEveryday,
    balance,
    setBalance: (value: string) => { setBalance(value); setError(""); },
    payday,
    setPayday: (value: string) => { setPayday(value); setError(""); },
    protectedAmount,
    reserved: parseMoney(protectedAmount, de ? "de" : "en"),
    setProtected: (value: string) => { setProtected(value); setError(""); },
    everyday,
    setEveryday: (value: string) => { setEveryday(value); setError(""); },
    busy,
    error,
    save,
    forecast,
    today,
    stale: !!cash && (cash.needsRefresh === true || cash.asOf !== today),
    cash,
  };
}
