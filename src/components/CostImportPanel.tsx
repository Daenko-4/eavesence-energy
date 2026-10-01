"use client";
import { useRef, useState } from "react";
import {
  csvDrafts,
  importCosts,
  invoiceDraft,
  matchImportedCost,
  type ImportDraft,
} from "@eavesence/core/homeValue";
import type { HouseholdCost } from "@eavesence/core/householdCosts";
import { extractDocument } from "@/lib/documentImport";
const field =
  "home-planning-field min-h-11 min-w-0 w-full rounded-xl border border-[#cddbd0] bg-white px-3 text-[#17211f]";
export default function CostImportPanel({
  costs,
  currency,
  locale,
  onSave,
}: {
  costs: HouseholdCost[];
  currency: string;
  locale: "de" | "en";
  onSave: (costs: HouseholdCost[]) => void | Promise<void>;
}) {
  const de = locale === "de",
    fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false),
    [paste, setPaste] = useState(""),
    [rows, setRows] = useState<ImportDraft[]>([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const t = (a: string, b: string) => (de ? a : b);
  const patch = (i: number, next: Partial<ImportDraft>) =>
    setRows(rows.map((r, n) => (n === i ? { ...r, ...next } : r)));
  function parse(text: string, source: string, csv = false) {
    const next = csv ? csvDrafts(text, source) : [invoiceDraft(text, source)];
    setRows((previous) => [...previous, ...next].slice(0, 100));
    setStatus(t("Bitte Vorschläge prüfen.", "Review the suggested entries."));
  }
  async function files(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    try {
      if (list.length > 10) throw new Error("FILES");
      for (const file of Array.from(list)) {
        setStatus(file.name);
        const text = await extractDocument(file, (p) =>
          setStatus(`${file.name} · ${p}`),
        );
        parse(text, file.name, /\.(csv|tsv)$/i.test(file.name));
      }
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(
        code === "CSV_HEADERS"
          ? t(
              "CSV braucht Spalten für Bezeichnung und Betrag (name/amount oder Bezeichnung/Betrag).",
              "CSV needs name and amount columns (or Bezeichnung/Betrag).",
            )
          : t(
              "Datei nicht lesbar. Maximal 10 Dateien, je 10 MB und 10 PDF-Seiten. Du kannst den Rechnungstext unten einfügen.",
              "Could not read the file. Maximum 10 files, 10 MB each and 10 PDF pages. You can paste invoice text below.",
            ),
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await onSave(importCosts(rows, costs, currency));
      setRows([]);
      setStatus(t("Kosten übernommen.", "Costs imported."));
    } catch {
      setError(
        t(
          "Prüfe Betrag, Rhythmus, Datum, Währung und bestehende Einträge. Markiere nur Kosten, die übernommen werden sollen.",
          "Check amount, frequency, date, currency and existing entries. Select only costs you want to import.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-3 min-w-0 rounded-xl border border-[#dfe5dd] bg-white p-4"
      aria-label={t("Kosten übernehmen", "Import costs")}
    >
      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="site-card-title">
          {t(
            "Kosten übernehmen statt abtippen",
            "Import costs instead of typing",
          )}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-[12px] text-[#52605b]">
            {t(
              "Rechnung als Foto/PDF, Umsatzdatei (CSV/TSV) oder Rechnungstext. Vor dem Speichern prüfst du alles. Einmalige Buchungen werden nicht automatisch zu Fixkosten.",
              "Use an invoice photo/PDF, bank file (CSV/TSV) or invoice text. Review everything before saving. One-off transactions do not automatically become recurring costs.",
            )}
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.csv,.tsv,.txt"
            className="sr-only"
            aria-label={t("Dateien auswählen", "Choose files")}
            onChange={(e) => void files(e.target.files)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="eavesence-pill-button home-primary-action"
          >
            {t("Foto / Datei auswählen", "Choose photo / file")}
          </button>
          <p className="text-[11px] text-[#52605b]">
            {t(
              "Die Verarbeitung läuft auf diesem Gerät. Für Texterkennung werden beim ersten Mal Sprachdateien geladen. Dokumente werden nicht hochgeladen.",
              "Processing runs on this device. Text recognition downloads language files on first use. Documents are not uploaded.",
            )}
          </p>
          <details>
            <summary className="cursor-pointer text-[12px] font-semibold">
              {t("Text einfügen / CSV-Beispiel", "Paste text / CSV example")}
            </summary>
            <label className="mt-2 grid gap-1 text-[12px]">
              {t("Rechnungstext", "Invoice text")}
              <textarea
                className={`${field} p-3`}
                rows={4}
                maxLength={100000}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={busy || !paste.trim()}
              className="eavesence-pill-button home-dashboard-action mt-2"
              onClick={() => {
                setError("");
                try {
                  parse(paste, t("Eingefügter Text", "Pasted text"));
                  setPaste("");
                } catch {
                  setError(t("Text prüfen.", "Check text."));
                }
              }}
            >
              {t("Vorschlag erstellen", "Create suggestion")}
            </button>
            <p className="mt-2 break-words text-[11px]">
              CSV: name;amount;date;frequency;currency
              <br />
              Internet;-39,90;2026-09-05;monthly;EUR
            </p>
          </details>
          {!!rows.length && (
            <>
              <p className="text-[12px] font-bold">
                {t("Vorschläge prüfen", "Review suggestions")} · {rows.length}
              </p>
              {rows.map((r, i) => {
                const match = matchImportedCost(r, costs);
                return (
                  <article
                    key={i}
                    className="rounded-xl border border-[#dfe5dd] bg-[#f7f8f6] p-3"
                  >
                    <label className="flex items-start gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={r.selected}
                        onChange={(e) =>
                          patch(i, { selected: e.target.checked })
                        }
                      />
                      <span className="min-w-0 break-words">{r.source}</span>
                    </label>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1 text-[12px]">
                        {t("Bezeichnung", "Name")}
                        <input
                          className={field}
                          value={r.name}
                          maxLength={100}
                          onChange={(e) =>
                            patch(i, {
                              name: e.target.value,
                              matchId: undefined,
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-[12px]">
                        {t("Betrag", "Amount")}
                        <input
                          className={field}
                          inputMode="decimal"
                          value={r.amount}
                          onChange={(e) => patch(i, { amount: e.target.value })}
                        />
                      </label>
                      <label className="grid gap-1 text-[12px]">
                        {t("Wie oft? Bitte bestätigen", "Frequency — confirm")}
                        <select
                          className={field}
                          value={r.frequency}
                          onChange={(e) =>
                            patch(i, {
                              frequency: e.target
                                .value as ImportDraft["frequency"],
                            })
                          }
                        >
                          <option value="">
                            {t("Rhythmus wählen", "Choose frequency")}
                          </option>
                          {[
                            ["weekly", t("Wöchentlich", "Weekly")],
                            ["monthly", t("Monatlich", "Monthly")],
                            ["quarterly", t("Quartalsweise", "Quarterly")],
                            ["half-yearly", t("Halbjährlich", "Half-yearly")],
                            ["yearly", t("Jährlich", "Yearly")],
                          ].map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-[12px]">
                        {t("Kategorie", "Category")}
                        <select
                          className={field}
                          value={r.category}
                          onChange={(e) =>
                            patch(i, {
                              category: e.target
                                .value as ImportDraft["category"],
                            })
                          }
                        >
                          {[
                            ["housing", t("Wohnen", "Housing")],
                            ["energy", t("Energie", "Energy")],
                            ["insurance", t("Versicherung", "Insurance")],
                            ["mobility", t("Mobilität", "Mobility")],
                            [
                              "subscriptions",
                              t("Verträge & Abos", "Subscriptions"),
                            ],
                            ["financing", t("Finanzierung", "Financing")],
                            ["leisure", t("Freizeit", "Leisure")],
                            ["other", t("Sonstiges", "Other")],
                          ].map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-[12px]">
                        {t(
                          "Nächste Zahlung (optional)",
                          "Next payment (optional)",
                        )}
                        <input
                          type="date"
                          className={field}
                          value={r.nextDueDate}
                          onChange={(e) =>
                            patch(i, { nextDueDate: e.target.value })
                          }
                        />
                      </label>
                      {r.currency && r.currency !== currency && (
                        <p role="alert" className="text-[12px] text-amber-800">
                          {t(
                            "Abweichende Währung. Hier nur",
                            "Different currency. This home uses",
                          )}{" "}
                          {currency}.{" "}
                          {t("Bitte Eintrag abwählen.", "Deselect this entry.")}
                        </p>
                      )}
                    </div>
                    {match && (
                      <label className="mt-3 flex gap-2 text-[12px] font-semibold">
                        <input
                          type="checkbox"
                          checked={r.matchId === match}
                          onChange={(e) =>
                            patch(i, {
                              matchId: e.target.checked ? match : undefined,
                            })
                          }
                        />
                        {t(
                          "Bestehende Kosten aktualisieren statt doppelt anlegen",
                          "Update existing cost instead of adding a duplicate",
                        )}
                      </label>
                    )}
                    {match && (
                      <p className="mt-1 text-[11px] text-[#52605b]">
                        {t(
                          "Ohne neuen Zahlungstermin bleibt der bisherige Termin erhalten.",
                          "Without a new payment date, the existing date is kept.",
                        )}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      className="mt-2 text-[12px] font-semibold"
                      onClick={() => setRows(rows.filter((_, n) => n !== i))}
                    >
                      {t("Vorschlag entfernen", "Remove suggestion")}
                    </button>
                  </article>
                );
              })}
              <button
                type="button"
                disabled={busy || !rows.some((r) => r.selected)}
                className="eavesence-pill-button home-primary-action"
                onClick={() => void save()}
              >
                {t("Geprüfte Kosten übernehmen", "Import reviewed costs")}
              </button>
            </>
          )}
          {status && (
            <p role="status" className="text-[12px]">
              {busy ? t("Wird gelesen: ", "Reading: ") : ""}
              {status}
            </p>
          )}
          {error && (
            <p role="alert" className="text-[12px] text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
