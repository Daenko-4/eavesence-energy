"use client";

import { useState } from "react";

import type { Locale } from "@/i18n/config";
import {
  createHouseholdCost,
  monthlyCost,
  reorderHouseholdCosts,
  removeHouseholdCost,
  summarizeHouseholdCosts,
  upsertHouseholdCost,
  type HouseholdCost,
  type HouseholdCostCategory,
  type HouseholdCostFrequency,
} from "@/lib/householdCosts";
import type { SavedDeviceCurrency } from "@/lib/savedDevices";

const fieldClass =
  "home-field min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-[#17211f] outline-none transition placeholder:text-slate-400 hover:border-[#b8c4bf] focus:border-[var(--brand-green-mint)] focus:ring-2 focus:ring-[#72dca3]/20";
const pillClass =
  "eavesence-pill-button home-dashboard-action active:scale-[0.98]";
const addCostClass =
  "eavesence-pill-button home-dashboard-action !bg-[var(--brand-green)] !px-3.5 !py-1.5 !text-white shadow-[0_8px_18px_-12px_rgba(8,122,69,0.9)] transition hover:!bg-[var(--brand-green-dark)] active:scale-[0.98]";
const dangerClass =
  "home-danger-action inline-flex min-h-6 items-center justify-center gap-1 rounded-full border-0 bg-red-50 px-3 py-1 text-red-600 transition hover:bg-red-100 hover:text-red-700";

const copy = {
  de: {
    eyebrow: "Haushaltskosten",
    title: "Was kostet dein Zuhause wirklich?",
    intro:
      "Lege regelmäßige Kosten einmal an. Jährliche, halbjährliche und quartalsweise Zahlungen rechnen wir automatisch auf einen echten Monatswert um.",
    add: "Kosten hinzufügen",
    close: "Formular schließen",
    monthly: "Pro Monat",
    yearly: "Pro Jahr",
    suggestions: "Schnell anlegen",
    suggestionsText:
      "Starte mit den größten regelmäßigen Kosten. Details zum Anbieter sind nicht nötig.",
    entries: "Angelegte Kosten",
    empty: "Noch keine Haushaltskosten angelegt.",
    formNew: "Neue Kosten",
    formEdit: "Kosten bearbeiten",
    name: "Bezeichnung",
    amount: "Betrag",
    category: "Kategorie",
    frequency: "Wie oft?",
    due: "Nächste Zahlung (optional)",
    save: "Speichern",
    update: "Aktualisieren",
    cancel: "Abbrechen",
    edit: "Bearbeiten",
    delete: "Löschen",
    removeConfirm: "Diese Haushaltskosten wirklich löschen?",
    invalid: "Bitte Bezeichnung und einen Betrag größer als 0 eingeben.",
    saved: "Haushaltskosten gespeichert.",
    updated: "Haushaltskosten aktualisiert.",
    deleted: "Haushaltskosten gelöscht.",
    reorder: "Ziehen, um die Reihenfolge zu ändern",
    categoryCount: "{count} Einträge",
    categoryCountOne: "1 Eintrag",
    monthlyEquivalent: "{amount} pro Monat",
    categories: {
      housing: "Wohnen",
      energy: "Energie",
      insurance: "Versicherungen",
      mobility: "Mobilität",
      subscriptions: "Verträge & Abos",
      financing: "Finanzierungen",
      leisure: "Freizeit",
      other: "Sonstiges",
    },
    frequencies: {
      weekly: "Wöchentlich",
      monthly: "Monatlich",
      quarterly: "Quartalsweise",
      "half-yearly": "Halbjährlich",
      yearly: "Jährlich",
    },
    templates: {
      housing: "Miete oder Kreditrate",
      energy: "Strom oder Heizung",
      insurance: "Versicherung",
      mobility: "Auto oder Öffis",
      subscriptions: "Internet oder Abo",
      financing: "Kreditrate",
    },
  },
  en: {
    eyebrow: "Household costs",
    title: "What does your home really cost?",
    intro:
      "Add recurring costs once. We automatically turn yearly, half-yearly and quarterly payments into a true monthly amount.",
    add: "Add cost",
    close: "Close form",
    monthly: "Per month",
    yearly: "Per year",
    suggestions: "Quick setup",
    suggestionsText:
      "Start with your largest recurring costs. Provider details are not required.",
    entries: "Recurring costs",
    empty: "No household costs added yet.",
    formNew: "New cost",
    formEdit: "Edit cost",
    name: "Name",
    amount: "Amount",
    category: "Category",
    frequency: "How often?",
    due: "Next payment (optional)",
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    removeConfirm: "Delete this household cost?",
    invalid: "Enter a name and an amount greater than 0.",
    saved: "Household cost saved.",
    updated: "Household cost updated.",
    deleted: "Household cost deleted.",
    reorder: "Drag to reorder",
    categoryCount: "{count} entries",
    categoryCountOne: "1 entry",
    monthlyEquivalent: "{amount} per month",
    categories: {
      housing: "Housing",
      energy: "Energy",
      insurance: "Insurance",
      mobility: "Mobility",
      subscriptions: "Contracts & subscriptions",
      financing: "Financing",
      leisure: "Leisure",
      other: "Other",
    },
    frequencies: {
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      "half-yearly": "Half-yearly",
      yearly: "Yearly",
    },
    templates: {
      housing: "Rent or mortgage payment",
      energy: "Electricity or heating",
      insurance: "Insurance",
      mobility: "Car or public transport",
      subscriptions: "Internet or subscription",
      financing: "Loan payment",
    },
  },
} as const;

const categories: HouseholdCostCategory[] = [
  "housing",
  "energy",
  "insurance",
  "mobility",
  "subscriptions",
  "financing",
  "leisure",
  "other",
];
const frequencies: HouseholdCostFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "half-yearly",
  "yearly",
];
const templateCategories: HouseholdCostCategory[] = [
  "housing",
  "energy",
  "insurance",
  "mobility",
  "subscriptions",
  "financing",
];

function money(
  value: number,
  locale: Locale,
  currency: SavedDeviceCurrency,
) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function localDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function parseAmount(value: string) {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

export default function HouseholdCostsPanel({
  locale,
  currency,
  costs,
  embedded = false,
  onChange,
}: {
  locale: Locale;
  currency: SavedDeviceCurrency;
  costs: HouseholdCost[];
  embedded?: boolean;
  onChange: (costs: HouseholdCost[]) => void;
}) {
  const text = copy[locale];
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] =
    useState<HouseholdCostCategory>("housing");
  const [frequency, setFrequency] =
    useState<HouseholdCostFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [feedback, setFeedback] = useState("");
  const [draggedCostId, setDraggedCostId] = useState<string | null>(null);
  const summary = summarizeHouseholdCosts(costs);

  function resetForm() {
    setEditingId(null);
    setName("");
    setAmount("");
    setCategory("housing");
    setFrequency("monthly");
    setNextDueDate("");
  }

  function openNewCost(template?: HouseholdCostCategory) {
    resetForm();
    if (template) {
      setCategory(template);
      setName(text.templates[template as keyof typeof text.templates] ?? "");
      setFrequency(template === "insurance" ? "yearly" : "monthly");
    }
    setFeedback("");
    setFormOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("household-cost-name")?.focus();
    });
  }

  function editCost(cost: HouseholdCost) {
    setEditingId(cost.id);
    setName(cost.name);
    setAmount(String(cost.amount));
    setCategory(cost.category);
    setFrequency(cost.frequency);
    setNextDueDate(cost.nextDueDate);
    setFeedback("");
    setFormOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("household-cost-name")?.focus();
    });
  }

  function saveCost() {
    const next = createHouseholdCost({
      id: editingId ?? undefined,
      name,
      category,
      amount: parseAmount(amount),
      frequency,
      nextDueDate,
    });
    if (!next) {
      setFeedback(text.invalid);
      return;
    }
    onChange(upsertHouseholdCost(costs, next));
    setFeedback(editingId ? text.updated : text.saved);
    resetForm();
    setFormOpen(false);
  }

  function deleteCost(cost: HouseholdCost) {
    if (!window.confirm(text.removeConfirm)) return;
    onChange(removeHouseholdCost(costs, cost.id));
    if (editingId === cost.id) {
      resetForm();
      setFormOpen(false);
    }
    setFeedback(text.deleted);
  }


  return (
    <section
      id="household-costs"
      className={`${embedded ? "" : "mt-8 "}rounded-[1.45rem] border border-[#dde2d8] bg-[#eef0ec] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_12px_30px_-28px_rgba(35,48,44,0.32)] sm:p-6`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">
            {text.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">
            {text.title}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#65716d]">
            {text.intro}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (formOpen ? setFormOpen(false) : openNewCost())}
          className={formOpen ? pillClass : addCostClass}
        >
          {formOpen ? text.close : <><span aria-hidden="true">+</span>{text.add}</>}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          [text.monthly, money(summary.monthlyTotal, locale, currency)],
          [text.yearly, money(summary.annualTotal, locale, currency)],
        ].map(([label, value], index) => (
          <article
            key={label}
            className={`rounded-xl border p-4 ${
              index === 0
                ? "border-[#b8efcc] bg-[#dcfce8]"
                : "border-[#d8ded8] bg-[#fbfcf8]"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#65716d]">
              {label}
            </p>
            <p className="mt-2 text-xl font-extrabold tracking-[-0.035em]">
              {value}
            </p>
          </article>
        ))}
      </div>

      {feedback && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-[13px] font-bold text-[var(--brand-green)]">
          {feedback}
        </p>
      )}

      {formOpen && (
        <div className="mt-5 rounded-xl border border-[#d8ded8] bg-[#fbfcf8] p-4">
          <h3 className="text-[14px] font-bold">
            {editingId ? text.formEdit : text.formNew}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605b] lg:col-span-2">
              {text.name}
              <input id="household-cost-name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605b]">
              {text.amount}
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605b]">
              {text.category}
              <select value={category} onChange={(event) => setCategory(event.target.value as HouseholdCostCategory)} className={fieldClass}>
                {categories.map((item) => <option key={item} value={item}>{text.categories[item]}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605b]">
              {text.frequency}
              <select value={frequency} onChange={(event) => setFrequency(event.target.value as HouseholdCostFrequency)} className={fieldClass}>
                {frequencies.map((item) => <option key={item} value={item}>{text.frequencies[item]}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#52605b] sm:col-span-2">
              {text.due}
              <input type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} className={fieldClass} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={saveCost} className={pillClass}>
              {editingId ? text.update : text.save}
            </button>
            <button type="button" onClick={() => { resetForm(); setFormOpen(false); }} className="eavesence-pill-button home-compact-action bg-[#eef0ec] text-[#65716d]">
              {text.cancel}
            </button>
          </div>
        </div>
      )}

      {costs.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#cdd6cf] bg-white/60 p-4">
          <h3 className="text-[14px] font-bold">{text.suggestions}</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#65716d]">{text.suggestionsText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {templateCategories.map((item) => (
              <button key={item} type="button" onClick={() => openNewCost(item)} className={pillClass}>
                {text.templates[item as keyof typeof text.templates]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {costs.length > 0 ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.categoryTotals.map((item) => (
              <article key={item.category} className="rounded-xl border border-[#d8ded8] bg-[#fbfcf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-bold">{text.categories[item.category]}</p>
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-green-mint)]" />
                </div>
                <p className="mt-3 text-lg font-extrabold tracking-[-0.03em]">{money(item.monthlyTotal, locale, currency)}</p>
                <p className="mt-1 text-[11px] text-[#65716d]">
                  {item.entryCount === 1 ? text.categoryCountOne : text.categoryCount.replace("{count}", String(item.entryCount))}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-[#d8ded8] bg-[#fbfcf8] p-4">
            <h3 className="text-[14px] font-bold">{text.entries}</h3>
            <div className="mt-3 divide-y divide-[#e2e6df]">
              {costs.map((cost) => (
                <div
                  key={cost.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedCostId(cost.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedCostId) {
                      onChange(reorderHouseholdCosts(costs, draggedCostId, cost.id));
                    }
                    setDraggedCostId(null);
                  }}
                  onDragEnd={() => setDraggedCostId(null)}
                  className={`flex items-start gap-2 py-3 transition ${draggedCostId === cost.id ? "opacity-50" : ""}`}
                >
                  <span
                    title={text.reorder}
                    aria-label={text.reorder}
                    className="mt-1 flex h-6 w-5 shrink-0 cursor-grab items-center justify-center text-[#94a09b] active:cursor-grabbing"
                  >
                    <svg viewBox="0 0 10 16" className="h-4 w-2.5" fill="currentColor" aria-hidden="true">
                      <circle cx="2" cy="3" r="1" /><circle cx="8" cy="3" r="1" />
                      <circle cx="2" cy="8" r="1" /><circle cx="8" cy="8" r="1" />
                      <circle cx="2" cy="13" r="1" /><circle cx="8" cy="13" r="1" />
                    </svg>
                  </span>
                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">{cost.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#65716d]">
                        {text.categories[cost.category]} · {text.frequencies[cost.frequency]}
                        {cost.nextDueDate ? ` · ${localDate(cost.nextDueDate, locale)}` : ""}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[13px] font-bold">{money(cost.amount, locale, currency)}</p>
                      <p className="text-[11px] text-[#65716d]">
                        {text.monthlyEquivalent.replace("{amount}", money(monthlyCost(cost.amount, cost.frequency), locale, currency))}
                      </p>
                    </div>
                    <div className="flex gap-1.5 sm:justify-end">
                      <button type="button" onClick={() => editCost(cost)} className="eavesence-pill-button home-compact-action">{text.edit}</button>
                      <button type="button" onClick={() => deleteCost(cost)} className={dangerClass}><span aria-hidden="true">×</span>{text.delete}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {costs.length > 0 && !formOpen && (
              <div className="mt-3 flex justify-end border-t border-[#e2e6df] pt-3">
                <button type="button" onClick={() => openNewCost()} className={addCostClass}>
                  <span aria-hidden="true">+</span>{text.add}
                </button>
              </div>
            )}
          </div>

        </>
      ) : null}
    </section>
  );
}
