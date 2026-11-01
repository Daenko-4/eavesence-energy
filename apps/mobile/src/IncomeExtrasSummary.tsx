import { Pressable, StyleSheet, View } from "react-native";
import { incomeExtraLabel, incomeMonthLabel, summarizeIncome, type IncomeProfile } from "@eavesence/core/income";
import { LocalizedText as Text } from "./i18n";
export function IncomeExtrasSummary({ profile, locale, currency, onManage }: { profile: IncomeProfile; locale: "de" | "en"; currency: string; onManage?:()=>void }) {
  const summary = summarizeIncome(profile), de = locale === "de";
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  if (!summary.extras.length && !summary.additional.length) return null;
  return <View style={styles.card}>
    <View style={styles.row}><View style={styles.flex}><Text style={styles.note}>{de?`Jahreseinnahmen ${summary.year}`:`Annual income · ${summary.year}`}</Text><Text style={styles.amount}>{money(summary.annual)}</Text></View><View style={styles.flex}><Text style={styles.note}>{de?'Monatsdurchschnitt':'Monthly average'}</Text><Text style={styles.amount}>{money(summary.average)}</Text></View></View>
    <Text style={styles.note}>{de?'Jahresplanung inklusive Sonderzahlungen und zusätzlicher Einnahmen. Geplantes Geld steht erst nach Eingang zur Verfügung.':'Annual plan including salary extras and additional income. Planned money becomes available once received.'}</Text>
    {summary.extras.map(extra => <View key={extra.id} style={styles.row}><Text style={[styles.note, styles.flex]}>{incomeExtraLabel(extra.kind, locale)} · {incomeMonthLabel(extra.month, locale)} {extra.year ?? (de ? "jährlich" : "every year")}</Text><Text style={styles.title}>+ {money(extra.amount)}</Text></View>)}
    {summary.additional.filter(entry=>Number(entry.date.slice(0,4))===summary.year).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(entry=><View key={entry.id} style={styles.row}><Text style={[styles.note,styles.flex]}>{entry.name||(de?'Zusätzliche Einnahme':'Additional income')} · {entry.date} · {entry.status==='received'?(de?'Erhalten':'Received'):(de?'Geplant':'Planned')}</Text><Text style={styles.title}>+ {money(entry.amount)}</Text></View>)}
    {!!summary.additional.length&&onManage&&<Pressable accessibilityRole="button" onPress={onManage} style={styles.toggle}><Text style={styles.title}>{de?'Zusätzliche Einnahmen verwalten':'Manage additional income'} ({summary.additional.length})</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 16, backgroundColor: "#fff", padding: 16, gap: 12 },
  warning: { marginTop: 12, backgroundColor: "#fff5df", padding: 14, borderRadius: 12 },
  toggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  amount:{fontSize:22,fontWeight:"800",color:"#17211f",marginTop:4},
  title: { flexShrink: 1, fontSize: 12, fontWeight: "700", color: "#17211f" },
  note: { fontSize: 13, lineHeight: 20, color: "#65716d" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flex: { flex: 1, minWidth: 0 },
});
