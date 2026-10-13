import {resolvePayment} from './paymentChecklist.ts';
import { useRef, useState } from "react";
import {
  localToday,
  parseMoney,
  paydayForecast,
  paydayPayments,
  readCashWindow,
  validDay,
} from "./homeValue.ts";
import { readPlanningData, type PlanningData } from "./planning.ts";
import type { SavingsPlanInput } from "./savingsPlan.ts";
export type CashInputField = "balance" | "payday" | "everyday" | "protected";
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
  const [errorField, setErrorField] = useState<CashInputField | null>(null);
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
  async function save(onInvalid?: (field: CashInputField) => void) {
    if(saving.current)return false;
    const invalid = (field: CashInputField, message: string) => {
      setErrorField(field); setError(message); onInvalid?.(field); return false;
    };
    const locale = de ? "de" : "en";
    const parsedBalance = parseMoney(balance, locale);
    if (!Number.isFinite(parsedBalance)) return invalid("balance", de ? "Trage deinen aktuellen Kontostand als gültigen Betrag ein. Auch ein Minus ist möglich." : "Enter your current account balance as a valid amount. Negative balances are allowed.");
    if (!validDay(payday) || payday <= today || (Date.parse(payday) - Date.parse(today)) / 86400000 > 90) return invalid("payday", de ? "Wähle deinen nächsten Gehaltstag: ab morgen und innerhalb der nächsten 90 Tage." : "Choose your next payday: from tomorrow and within the next 90 days.");
    if (!everyday.trim()) {
      return invalid("everyday", de ? "Trage dein Alltagsbudget bis zum Gehalt ein oder übernimm den Vorschlag. 0 ist möglich." : "Enter your everyday budget until payday or use the suggestion. 0 is allowed.");
    }
    const parsedEveryday = parseMoney(everyday, locale);
    if (!Number.isFinite(parsedEveryday) || parsedEveryday < 0) return invalid("everyday", de ? "Trage die Alltagsausgaben bis zum Gehalt als Betrag ab 0 ein." : "Enter everyday spending until payday as an amount of 0 or more.");
    const parsedProtected = protectedAmount.trim() ? parseMoney(protectedAmount, locale) : 0;
    if (!Number.isFinite(parsedProtected) || parsedProtected < 0) return invalid("protected", de ? "Trage die Reserve als Betrag ab 0 ein oder lasse das Feld leer." : "Enter a reserve of 0 or more, or leave the field blank.");
    const next = readCashWindow({
      balance: parsedBalance,
      asOf: today,
      payday,
      protected: parsedProtected,
      everydayRemaining: parsedEveryday,
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
    setErrorField(null);
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
    setBalance: (value: string) => { setBalance(value); setError(""); setErrorField(null); },
    payday,
    setPayday: (value: string) => { setPayday(value); setError(""); setErrorField(null); },
    protectedAmount,
    reserved: parseMoney(protectedAmount, de ? "de" : "en"),
    setProtected: (value: string) => { setProtected(value); setError(""); setErrorField(null); },
    everyday,
    setEveryday: (value: string) => { setEveryday(value); setError(""); setErrorField(null); },
    busy,
    error,
    errorField,
    save,
    forecast,
    today,
    stale: !!cash && (cash.needsRefresh === true || cash.asOf !== today),
    cash,
  };
}
