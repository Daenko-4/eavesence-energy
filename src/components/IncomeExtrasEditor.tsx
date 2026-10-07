"use client";
import { incomeExtraLabel, incomeMonthLabel, newIncomeExtraDraft, type IncomeExtraDraft, type IncomeExtra } from "@eavesence/core/income";

type Props = { locale: "de" | "en"; frequency: "monthly" | "yearly"; drafts: IncomeExtraDraft[]; onChange: (rows: IncomeExtraDraft[]) => void; open: boolean; onToggle: (open: boolean) => void };
export default function IncomeExtrasEditor({ locale, frequency, drafts, onChange, open, onToggle }: Props) {
  const de = locale === "de";
  const t = (a: string, b: string) => de ? a : b;
  const field = "home-field min-h-11 min-w-0 w-full rounded-xl border border-[#cddbd0] bg-white px-3 text-[16px]";
  const update = (id: string, values: Partial<IncomeExtraDraft>) => onChange(drafts.map(row => row.id === id ? { ...row, ...values } : row));
  return <details className="home-disclosure rounded-xl border border-[#dfe5dd] p-3" open={open} onToggle={event => onToggle(event.currentTarget.open)}>
    <summary className="home-single-line-summary text-[13px] font-semibold">{t("Sonderzahlungen ergänzen (optional)", "Add extra income (optional)")}</summary>
    {frequency === "yearly" ? <p className="mt-3 text-[13px] leading-5 text-[#65716d]">{t("Das Jahresnetto kann Sonderzahlungen bereits enthalten. Wähle zuerst reguläres Monatsnetto und trage den tatsächlichen Monatsbetrag ein. Bestehende Sonderzahlungen bleiben gespeichert und werden hier nicht zusätzlich gerechnet.", "Annual net income may already include extra payments. Choose regular monthly net income and enter your actual monthly amount first. Existing extras stay saved and are not added again here.")}</p> : <>
      <p className="mt-3 text-[13px] leading-5 text-[#65716d]">{t("Nur den zusätzlichen Nettobetrag eintragen, ohne normales Monatsgehalt. Auszahlungsmonat prüfen. Wir planen ihn nur in diesem Monat ein – nicht als regelmäßigen Spielraum. Alle Angaben werden mit dem Einkommen gespeichert.", "Enter only the extra net amount, excluding your regular salary. Check the payment month. It is planned in that month only, not as regular spending room. All entries are saved with your income.")}</p>
      <div className="mt-3 grid gap-3">{drafts.map(row => <fieldset key={row.id} className="min-w-0 rounded-xl border border-[#dfe5dd] p-3">
        <legend className="px-1 text-[13px] font-bold">{incomeExtraLabel(row.kind, locale)}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px] font-semibold">{t("Zusätzlicher Nettobetrag", "Extra net amount")}<input inputMode="decimal" value={row.amount} onChange={event => update(row.id, { amount: event.target.value })} placeholder={t("z. B. 2400", "e.g. 2400")} className={field} /></label>
          <label className="grid gap-1 text-[13px] font-semibold">{t("Auszahlungsmonat", "Payment month")}<select value={row.month} onChange={event => update(row.id, { month: event.target.value })} className={field}><option value="">{t("Monat auswählen", "Choose a month")}</option>{Array.from({ length: 12 }, (_, index) => <option key={index} value={String(index + 1)}>{incomeMonthLabel(index + 1, locale)}</option>)}</select></label>
          <label className="flex min-h-11 items-center gap-2 text-[13px]"><input type="checkbox" checked={row.yearly} onChange={event => update(row.id, { yearly: event.target.checked })} />{t("Jedes Jahr", "Every year")}</label>
          {!row.yearly && <label className="grid gap-1 text-[13px] font-semibold">{t("Nur im Jahr", "Only in year")}<input inputMode="numeric" maxLength={4} value={row.year} onChange={event => update(row.id, { year: event.target.value.replace(/\D/g, "") })} className={field} /></label>}
        </div>
        <button type="button" aria-label={t(`${incomeExtraLabel(row.kind, locale)} entfernen`, `Remove ${incomeExtraLabel(row.kind, locale)}`)} onClick={() => onChange(drafts.filter(item => item.id !== row.id))} className="eavesence-pill-button mt-3">{t("Entfernen", "Remove")}</button>
      </fieldset>)}</div>
      <div className="mt-3 flex flex-wrap gap-2">{(["salary13", "salary14", "bonus"] as IncomeExtra["kind"][]).map(kind => <button type="button" disabled={drafts.length >= 50} key={kind} onClick={() => onChange([...drafts, newIncomeExtraDraft(kind)])} className="eavesence-pill-button">+ {incomeExtraLabel(kind, locale)}</button>)}</div>
    </>}
  </details>;
}
