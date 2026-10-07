import { parseIncomeAmount } from "./income.ts";
import { paymentIsPaid, type PaidPayment } from './paymentChecklist.ts';
import {
  createHouseholdCost,
  monthlyCost,
  paymentsForMonth,
  type HouseholdCost,
  type HouseholdCostCategory,
  type HouseholdCostFrequency,
} from "./householdCosts.ts";
import { savingsActionKey, type SavingsAction } from "./savingsPlan.ts";

export const validDay = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const parseMoney = (s: string, locale?: "de" | "en") => {
  let v = s.replace(/€|\s|CHF/g, "");
  if (!v) return NaN;
  if (locale) {
    const negative = v.startsWith("-");
    const amount = parseIncomeAmount(negative ? v.slice(1) : v, locale);
    return negative ? -amount : amount;
  }
  if (v.includes(",") && v.includes("."))
    v =
      v.lastIndexOf(",") > v.lastIndexOf(".")
        ? v.replace(/\./g, "").replace(",", ".")
        : v.replace(/,/g, "");
  else v = v.replace(",", ".");
  return /^-?\d+(\.\d{1,2})?$/.test(v) ? Number(v) : NaN;
};
export type CashWindow = {
  needsRefresh?: boolean;
  balance: number;
  asOf: string;
  payday: string;
  protected: number;
  everydayRemaining: number | null;
};
export function readCashWindow(v: unknown): CashWindow | undefined {
  const c = v as CashWindow;
  const safe = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0;
  return c &&
    (c.needsRefresh === undefined || typeof c.needsRefresh === "boolean") &&
    typeof c.balance === "number" && Number.isFinite(c.balance) &&
    safe(c.protected) &&
    validDay(c.asOf) &&
    validDay(c.payday) &&
    (c.everydayRemaining === null || safe(c.everydayRemaining))
    ? c
    : undefined;
}
export function paydayPayments(costs: HouseholdCost[], cash: CashWindow | undefined, today: string) {
  if (!cash || !validDay(today) || !validDay(cash.payday) || cash.payday <= today || (Date.parse(cash.payday)-Date.parse(today))/86400000 > 90) return [];
  const payments: Array<{ cost: HouseholdCost; date: string }> = [];
  let cursor = today.slice(0, 7);
  while (cursor <= cash.payday.slice(0, 7)) {
    payments.push(
      ...paymentsForMonth(costs, cursor).payments.filter(
        (p) => p.date >= `${today.slice(0, 7)}-01` && p.date < cash.payday,
      ),
    );
    const [y, m] = cursor.split("-").map(Number);
    cursor = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  }
  payments.sort((a, b) => a.date.localeCompare(b.date));
  return payments.map(p => ({...p,month:p.date.slice(0,7)}));
}
export function paydayForecast(
  costs: HouseholdCost[],
  cash: CashWindow | undefined,
  variableMonthly: number | null,
  today: string,
  paid: PaidPayment[] = [],
) {
  if (!cash || cash.needsRefresh || !validDay(today) || cash.asOf !== today || cash.payday <= today)
    return null;
  const days = (Date.parse(cash.payday) - Date.parse(today)) / 86400000;
  if (days > 90) return null;
  const payments = paydayPayments(costs,cash,today).filter(p => !paymentIsPaid(p,paid));
  const fixed = payments.reduce((sum, p) => sum + p.cost.amount, 0);
  const everyday =
    cash.everydayRemaining ??
    (variableMonthly === null
      ? null
      : ((variableMonthly * 12) / 365.25) * days);
  const missingDates = costs.filter((c) => !c.nextDueDate).length;
  return {
    days,
    overdue: payments.filter(p => p.date < today).length,
    payments,
    fixed,
    everyday,
    missingDates,
    remaining:
      everyday === null
        ? null
        : cash.balance - fixed - everyday - cash.protected,
    estimated: cash.everydayRemaining === null,
  };
}
export type ImportDraft = {
  name: string;
  amount: string;
  category: HouseholdCostCategory;
  frequency: HouseholdCostFrequency | "";
  nextDueDate: string;
  source: string;
  selected: boolean;
  matchId?: string;
  currency?: string;
};
const inferCategory = (name: string): HouseholdCostCategory =>
  /strom|energy|electric|gas|heiz/i.test(name)
    ? "energy"
    : /versicherung|insurance/i.test(name)
      ? "insurance"
      : /miete|rent|housing/i.test(name)
        ? "housing"
        : /internet|netflix|spotify|abo|subscription|telekom|disney/i.test(name)
          ? "subscriptions"
          : "other";
export function matchImportedCost(d: ImportDraft, costs: HouseholdCost[]) {
  const normal = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return costs.find((c) => normal(c.name) === normal(d.name))?.id;
}
export function invoiceDraft(text: string, source: string): ImportDraft {
  const lines = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const line = lines.find((s) =>
    /gesamtbetrag|rechnungsbetrag|zu zahlen|total due|amount due|gesamt|total/i.test(
      s,
    ),
  );
  const amount = line?.match(/\d[\d.,]*[.,]\d{2}/g)?.at(-1) ?? "";
  const name =
    lines
      .find(
        (s) => !/^\d|rechnung|invoice|datum|date|iban|kundennummer/i.test(s),
      )
      ?.slice(0, 100) ?? "";
  const frequency: ImportDraft["frequency"] =
    /halbjähr|half.year|six.month/i.test(text)
      ? "half-yearly"
      : /quartal|quarter/i.test(text)
        ? "quarterly"
        : /jährlich|annual|yearly|pro jahr/i.test(text)
          ? "yearly"
          : /monatlich|monthly|pro monat|per month/i.test(text)
            ? "monthly"
            : /wöchentlich|weekly/i.test(text)
              ? "weekly"
              : "";
  const dueLine = lines.find((s) =>
    /fällig|due date|zahlbar bis|payment due/i.test(s),
  );
  const raw = dueLine?.match(/\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4}/)?.[0];
  const date = raw?.includes("-")
    ? raw
    : raw
      ? raw.split(/[./]/).reverse().join("-")
      : "";
  const currency = /\bCHF\b/.test(text)
    ? "CHF"
    : /€|\bEUR\b/.test(text)
      ? "EUR"
      : undefined;
  return {
    name,
    amount,
    category: inferCategory(name),
    frequency,
    nextDueDate: validDay(date) ? date : "",
    source,
    selected: true,
    currency,
  };
}
/** CSV/TSV headers: name/payee/description, amount, date; optional frequency and category. */
export function csvDrafts(text: string, source: string): ImportDraft[] {
  const separator = text.split("\n")[0].includes("\t")
    ? "\t"
    : text.split("\n")[0].includes(";")
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (ch === separator || ch === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (ch === "\n") {
        rows.push(row);
        row = [];
      }
    } else if (ch !== "\r") cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() ?? []).map((s) => s.toLowerCase());
  const index = (pattern: RegExp) => headers.findIndex((h) => pattern.test(h));
  const ni = index(
      /^(name|payee|description|bezeichnung|empfänger|zahlungsempfänger|buchungstext|verwendungszweck)$/,
    ),
    ai = index(/^(amount|betrag|umsatz)$/),
    di = index(/^(date|datum|buchungsdatum|nextduedate|fälligkeit)$/),
    fi = index(/^(frequency|rhythmus|intervall)$/),
    ci = index(/^(currency|währung)$/);
  if (ni < 0 || ai < 0) throw new Error("CSV_HEADERS");
  const groups = new Map<
    string,
    {
      name: string;
      amount: number;
      dates: string[];
      frequency: ImportDraft["frequency"];
      currency?: string;
    }
  >();
  const limitedRows = rows.slice(0, 2000);
  const hasDebits = limitedRows.some((r) => parseMoney(r[ai] ?? "") < 0);
  for (const r of limitedRows) {
    const n = parseMoney(r[ai] ?? "");
    if (!Number.isFinite(n) || n === 0 || !r[ni]) continue;
    // Negative bank transactions are expenses; positive-only cost lists are supported too.
    if (hasDebits && n > 0) continue;
    const raw = r[di] ?? "";
    const date = raw.includes("-")
      ? raw
      : raw.split(/[./]/).reverse().join("-");
    const name = r[ni].slice(0, 100);
    const key = `${name.toLowerCase()}|${Math.abs(n)}`;
    const g = groups.get(key) ?? {
      name,
      amount: Math.abs(n),
      dates: [],
      frequency: "",
      currency: r[ci] || undefined,
    };
    if (validDay(date)) g.dates.push(date);
    if (
      ["weekly", "monthly", "quarterly", "half-yearly", "yearly"].includes(
        r[fi],
      )
    )
      g.frequency = r[fi] as HouseholdCostFrequency;
    groups.set(key, g);
  }
  return [...groups.values()].slice(0, 100).map((g) => {
    const dates = [...new Set(g.dates)].sort();
    let frequency = g.frequency;
    if (!frequency && dates.length >= 2) {
      const gap =
        (Date.parse(dates.at(-1)!) - Date.parse(dates.at(-2)!)) / 86400000;
      frequency =
        gap >= 26 && gap <= 35
          ? "monthly"
          : gap >= 6 && gap <= 8
            ? "weekly"
            : gap >= 80 && gap <= 100
              ? "quarterly"
              : gap >= 170 && gap <= 195
                ? "half-yearly"
                : gap >= 350 && gap <= 380
                  ? "yearly"
                  : "";
    }
    // Historic bank dates are never invented as future payment dates.
    return {
      name: g.name,
      amount: String(g.amount),
      frequency,
      category: inferCategory(g.name),
      nextDueDate: "",
      source,
      selected: !!frequency,
      currency: g.currency,
    };
  });
}
export function importCosts(
  drafts: ImportDraft[],
  existing: HouseholdCost[],
  currency: string,
) {
  let next = [...existing];
  const ids = new Set<string>();
  for (const d of drafts.filter((d) => d.selected)) {
    if (d.currency && d.currency !== currency)
      throw new Error("IMPORT_CURRENCY");
    const match = matchImportedCost(d, next);
    if (match && !d.matchId) throw new Error("IMPORT_DUPLICATE");
    const old = d.matchId
      ? existing.find((c) => c.id === d.matchId)
      : undefined;
    if (d.matchId && !old) throw new Error("IMPORT_STALE");
    if (old && ids.has(old.id)) throw new Error("IMPORT_DUPLICATE");
    const cost = d.frequency
      ? createHouseholdCost({
          id: old?.id,
          name: d.name,
          amount: parseMoney(d.amount),
          category: d.category,
          frequency: d.frequency,
          nextDueDate: d.nextDueDate || old?.nextDueDate || "",
          tileId: old?.tileId,
          cancellationDeadline: old?.cancellationDeadline,
        })
      : null;
    if (!cost) throw new Error("IMPORT_INVALID");
    ids.add(cost.id);
    next = old
      ? next.map((c) => (c.id === old.id ? cost : c))
      : [cost, ...next];
  }
  return next;
}
export function savingsToDate(actions: SavingsAction[], today: string) {
  let scheduled = 0,
    estimated = 0;
  for (const a of actions.filter(
    (a) => a.status === "confirmed" && a.effectiveMonth <= today.slice(0, 7),
  )) {
    if (a.nextDueDate && validDay(a.nextDueDate)) {
      const c = {
        id: a.costId,
        name: a.name,
        amount: a.originalAmount - a.newAmount,
        category: "other" as const,
        frequency: a.frequency,
        nextDueDate: a.nextDueDate,
        updatedAt: a.confirmedAt ?? "",
      };
      let cursor = a.effectiveMonth;
      while (cursor <= today.slice(0, 7)) {
        scheduled += paymentsForMonth([c], cursor)
          .payments.filter((p) => p.date <= today && (!a.endedOn || p.date <= a.endedOn))
          .reduce((sum, p) => sum + p.cost.amount, 0);
        const [y, m] = cursor.split("-").map(Number);
        cursor = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
      }
    } else {
      const start = Date.parse(`${a.effectiveMonth}-01`);
      estimated +=
        ((monthlyCost(a.originalAmount - a.newAmount, a.frequency) * 12) /
          365.25) *
        Math.max(0, (Date.parse(a.endedOn && a.endedOn <= today ? a.endedOn : today) - start) / 86400000 + 1);
    }
  }
  return { scheduled, estimated, total: scheduled + estimated };
}
export function confirmSavingsChange(
  costs: HouseholdCost[],
  actions: SavingsAction[],
  action: SavingsAction,
  today: string,
) {
  if (!actions.some(a=>savingsActionKey(a)===savingsActionKey(action))) throw new Error("ACTION_STALE");
  if (action.status !== "planned" || action.effectiveMonth > today.slice(0, 7))
    throw new Error("ACTION_NOT_DUE");
  const cost = costs.find((c) => c.id === action.costId);
  const applied =
    (cost?.amount === action.newAmount && cost.frequency === action.frequency) || (!cost && action.newAmount === 0);
  if (
    !applied &&
    (!cost ||
      cost.amount !== action.originalAmount ||
      cost.frequency !== action.frequency)
  )
    throw new Error("ACTION_STALE");
  const confirmed = {
    ...action,
    nextDueDate: action.nextDueDate || cost?.nextDueDate,
    status: "confirmed" as const,
    confirmedAt: new Date().toISOString(),
  };
  return {
    costs:
      action.newAmount === 0
        ? costs.filter((c) => c.id !== action.costId)
        : costs.map((c) =>
            c.id === action.costId
              ? {
                  ...c,
                  amount: action.newAmount,
                  updatedAt: confirmed.confirmedAt,
                }
              : c,
          ),
    actions: actions.map((a) => (savingsActionKey(a) === savingsActionKey(action) ? confirmed : a)),
  };
}
export function calendarReview(name: string, date: string, de: boolean) {
  if (!validDay(date)) throw new Error("DATE");
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const end = new Date(Date.parse(date) + 86400000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EAVESENCE//Savings review//EN",
    "BEGIN:VEVENT",
    `UID:review-${date}-${encodeURIComponent(name)}@eavesence.com`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escape(`${de ? "Kosten prüfen" : "Review cost"}: ${name}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${de ? "Kosten rechtzeitig prüfen" : "Review this cost in time"}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Practical review prompts, not assumed savings or market prices. */
export function costReviewTip(category: HouseholdCostCategory, de: boolean, frequency?: HouseholdCostFrequency) {
  const tips: Partial<Record<HouseholdCostCategory, [string, string]>> = {
    subscriptions: ["Prüfe deine letzte Nutzung. Gibt es doppelte Abos oder reicht ein kleinerer Tarif?", "Check when you last used it. Are subscriptions duplicated, or would a smaller plan work?"],
    energy: ["Vergleiche deinen Arbeitspreis und die Grundgebühr mit einem konkreten Angebot. Einmalige Boni sind keine dauerhafte Ersparnis.", "Compare your unit price and standing charge with an actual offer. One-off bonuses are not recurring savings."],
    insurance: ["Vergleiche denselben Schutz und Selbstbehalt. Kündige erst, wenn eine passende Anschlussdeckung gesichert ist.", "Compare the same cover and excess. Arrange suitable replacement cover before cancelling."],
    mobility: ["Prüfe, ob dein Tarif zu deinen tatsächlichen Fahrten passt und ob du Leistungen doppelt bezahlst.", "Check whether your plan fits your actual journeys and whether you pay twice for similar services."],
    financing: ["Prüfe Gesamtkosten, Laufzeit und mögliche Gebühren einer Änderung. Ein kleinerer Monatsbetrag kann insgesamt mehr kosten.", "Review total cost, term and any change fees. A smaller monthly payment can cost more overall."],
  };
  const tip = tips[category] ?? ["Prüfe Nutzung, Vertrag und ein konkretes günstigeres Angebot. Trage nur eine Änderung ein, die du tatsächlich umsetzen kannst.", "Check usage, your contract and a specific lower-priced offer. Enter only a change you can actually make."];
  const annualReview = category === "subscriptions" && frequency === "monthly"
    ? de
      ? " Vergleiche außerdem den Jahrespreis mit 12 Monatszahlungen. Das lohnt sich nur, wenn du das Abo weiter nutzt, die längere Bindung passt und die Einmalzahlung ins Budget passt."
      : " Also compare annual billing with 12 monthly payments. It only makes sense if you will keep using the subscription, the longer commitment suits you and the upfront payment fits your budget."
    : "";
  return tip[de ? 0 : 1] + annualReview;
}
