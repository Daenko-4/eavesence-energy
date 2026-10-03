import { DisclosureIcon } from "./BrandMotion";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { useState } from "react";
import { incomeExtraLabel, incomeMonthLabel, newIncomeExtraDraft, type IncomeExtraDraft, type IncomeExtra } from "@eavesence/core/income";
import { FormInput } from "./FormInput";
import { LocalizedText as Text, useMobileLocale } from "./i18n";

type Props = { frequency: "monthly" | "yearly"; drafts: IncomeExtraDraft[]; onChange: (rows: IncomeExtraDraft[]) => void; open: boolean; onToggle: () => void };
export function IncomeExtrasEditor({ frequency, drafts, onChange, open, onToggle }: Props) {
  const locale = useMobileLocale(), de = locale === "de";
  const t = (a: string, b: string) => de ? a : b;
  const [monthPicker, setMonthPicker] = useState<string | null>(null);
  const update = (id: string, values: Partial<IncomeExtraDraft>) => onChange(drafts.map(row => row.id === id ? { ...row, ...values } : row));
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.toggle}><Text style={styles.title}>{t("Sonderzahlungen ergänzen (optional)", "Add extra income (optional)")}</Text><DisclosureIcon open={open} /></Pressable>
    {open && (frequency === "yearly" ? <Text style={styles.note}>{t("Das Jahresnetto kann Extras bereits enthalten. Wähle reguläres Monatsnetto und trage dein tatsächliches Monatsgehalt ein. Bestehende Extras bleiben gespeichert und werden nicht zusätzlich gerechnet.", "Annual net income may already include extras. Choose regular monthly net income and enter your actual monthly salary. Existing extras stay saved and are not added again.")}</Text> : <>
      <Text style={styles.note}>{t("Nur den zusätzlichen Nettobetrag eintragen, ohne normales Gehalt. Den Monat selbst auswählen. Alle Angaben werden mit dem Einkommen gespeichert.", "Enter only the extra net amount, excluding regular salary. Choose the payment month. All entries are saved with your income.")}</Text>
      {drafts.map(row => <View key={row.id} style={styles.card}>
        <Text style={styles.title}>{incomeExtraLabel(row.kind, locale)}</Text>
        <FormInput label={t("Zusätzlicher Nettobetrag", "Extra net amount")} value={row.amount} onChangeText={amount => update(row.id, { amount })} keyboardType="decimal-pad" placeholder={t("z. B. 2400", "e.g. 2400")} />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: monthPicker === row.id }} accessibilityLabel={t("Auszahlungsmonat", "Payment month")} style={styles.monthButton} onPress={() => { Keyboard.dismiss(); setMonthPicker(monthPicker === row.id ? null : row.id); }}><Text style={styles.title}>{t("Auszahlungsmonat", "Payment month")}: {row.month ? incomeMonthLabel(Number(row.month), locale) : t("Auswählen", "Choose")}</Text></Pressable>
        {monthPicker === row.id && <View style={styles.months}>{Array.from({ length: 12 }, (_, index) => <Pressable key={index} accessibilityRole="button" accessibilityState={{ selected: Number(row.month) === index + 1 }} style={[styles.month, Number(row.month) === index + 1 && styles.selected]} onPress={() => { update(row.id, { month: String(index + 1) }); setMonthPicker(null); }}><Text style={styles.monthText}>{incomeMonthLabel(index + 1, locale)}</Text></Pressable>)}</View>}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: row.yearly }} onPress={() => update(row.id, { yearly: !row.yearly })} style={styles.monthButton}><Text>{row.yearly ? "☑" : "☐"} {t("Jedes Jahr", "Every year")}</Text></Pressable>
        {!row.yearly && <FormInput label={t("Nur im Jahr", "Only in year")} value={row.year} onChangeText={year => update(row.id, { year: year.replace(/\D/g, "") })} keyboardType="number-pad" maxLength={4} />}
        <Pressable accessibilityRole="button" accessibilityLabel={t(`${incomeExtraLabel(row.kind, locale)} entfernen`, `Remove ${incomeExtraLabel(row.kind, locale)}`)} onPress={() => onChange(drafts.filter(item => item.id !== row.id))} style={styles.remove}><Text style={styles.removeText}>{t("Entfernen", "Remove")}</Text></Pressable>
      </View>)}
      <View style={styles.months}>{(["salary13", "salary14", "bonus"] as IncomeExtra["kind"][]).map(kind => <Pressable key={kind} disabled={drafts.length >= 50} accessibilityRole="button" style={styles.add} onPress={() => { Keyboard.dismiss(); onChange([...drafts, newIncomeExtraDraft(kind)]); }}><Text style={styles.monthText}>+ {incomeExtraLabel(kind, locale)}</Text></Pressable>)}</View>
    </>)}
  </View>;
}
const styles = StyleSheet.create({
  section: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, padding: 12, gap: 12 },
  toggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { flexShrink: 1, fontSize: 12, fontWeight: "700", color: "#17211f" },
  note: { fontSize: 13, lineHeight: 20, color: "#65716d" },
  card: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, padding: 12, gap: 12, backgroundColor: "#fff" },
  monthButton: { minHeight: 44, justifyContent: "center" },
  months: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  month: { width: "31%", minHeight: 44, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, alignItems: "center", justifyContent: "center", padding: 4 },
  selected: { backgroundColor: "#ddf8e9", borderColor: "#087a45" },
  monthText: { fontSize: 12, fontWeight: "600", color: "#314866" },
  add: { minHeight: 44, borderWidth: 1, borderColor: "#b8c4d6", backgroundColor: "#edf2f8", borderRadius: 22, paddingHorizontal: 12, justifyContent: "center" },
  remove: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", paddingHorizontal: 12 },
  removeText: { fontSize: 12, color: "#b42318" },
});
