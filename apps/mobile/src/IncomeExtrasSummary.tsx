import { DisclosureIcon } from "./BrandMotion";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { incomeExtraLabel, incomeMonthLabel, summarizeIncome, type IncomeProfile } from "@eavesence/core/income";
import { LocalizedText as Text } from "./i18n";
export function IncomeExtrasSummary({ profile, locale, currency }: { profile: IncomeProfile; locale: "de" | "en"; currency: string }) {
  const [open, setOpen] = useState(false);
  const summary = summarizeIncome(profile), de = locale === "de";
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  if (summary.annualAverage && summary.monthly <= 0) return null;
  if (summary.annualAverage) return <View style={styles.warning}><Text style={styles.note}>{de ? "Dein Jahresnetto wird durch 12 geteilt. Das ist ein Monatsdurchschnitt, nicht dein tatsächliches Monatsgehalt. Für Monatsplanung trage reguläres Monatsnetto und Sonderzahlungen getrennt ein." : "Your annual net income is divided by 12. This is a monthly average, not your actual monthly salary. For monthly planning, enter regular monthly net income and extra payments separately."}</Text></View>;
  if (!summary.extras.length) return null;
  return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.toggle}><Text style={styles.title}>{de ? "Sonderzahlungen & Jahresüberblick" : "Extra income & annual overview"}</Text><DisclosureIcon open={open} /></Pressable>
    {open && <>
      <Text style={styles.note}>{de ? `Jahresnetto ${summary.year} inklusive geplanter Extras: ${money(summary.annual)}. Monatsdurchschnitt: ${money(summary.average)}.` : `Net income in ${summary.year}, including planned extras: ${money(summary.annual)}. Monthly average: ${money(summary.average)}.`}</Text>
      <Text style={styles.note}>{de ? "Die Übersicht rechnet mit regulärem Monatsnetto. Extras sind geplant, kein heute verfügbares Geld. Nach Eingang sind sie Teil deines Kontostands für „Bis zum Gehalt“." : "The overview uses regular monthly net income. Extras are planned, not money available today. Once received, they are part of the balance you enter for ‘To payday’."}</Text>
      {[...summary.extras].sort((a,b) => (a.year ?? summary.year)-(b.year ?? summary.year) || a.month-b.month).map(extra => <View key={extra.id} style={styles.row}><Text style={[styles.note, styles.flex]}>{incomeExtraLabel(extra.kind, locale)} · {incomeMonthLabel(extra.month, locale)} {extra.year ?? (de ? "jährlich" : "every year")}</Text><Text style={styles.title}>+ {money(extra.amount)}</Text></View>)}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { marginTop: 12, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 16, backgroundColor: "#fff", padding: 16, gap: 12 },
  warning: { marginTop: 12, backgroundColor: "#fff5df", padding: 14, borderRadius: 12 },
  toggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { flexShrink: 1, fontSize: 12, fontWeight: "700", color: "#17211f" },
  note: { fontSize: 13, lineHeight: 20, color: "#65716d" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flex: { flex: 1, minWidth: 0 },
});
