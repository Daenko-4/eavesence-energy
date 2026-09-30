import { createSavingsPlan, type SavingsPlanInput } from "@eavesence/core/savingsPlan";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LocalizedText as Text, useMobileLocale } from "./i18n";

export function SavingsBudgetSummary({ input, currency }: { input: SavingsPlanInput; currency: string }) {
  const de = useMobileLocale() === "de";
  const [monthsOpen, setMonthsOpen] = useState(false);
  const result = createSavingsPlan(input);
  if (!result) return null;
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  const hasIncome = input.incomeMonthly > 0;
  const missingEveryday = input.variableMonthly == null;
  return <View style={styles.container}>
    <Text style={styles.heading}>{de ? "So rechnen wir pro Monat" : "Your monthly calculation"}</Text>
    <Row label={de ? "Nettoeinkommen" : "Net income"} value={hasIncome ? money(input.incomeMonthly) : de ? "Noch offen" : "Not entered yet"} />
    <Row label={de ? "− Fixkosten (Durchschnitt)" : "− Fixed costs (average)"} value={money(result.averageFixed)} />
    <Row label={de ? "− Alltag (deine Schätzung)" : "− Everyday spending (estimate)"} value={missingEveryday ? de ? "Noch offen" : "Not estimated yet" : money(input.variableMonthly!)} />
    {input.bufferMonthly > 0 && <Row label={de ? "− Freiwillige Reserve" : "− Optional reserve"} value={money(input.bufferMonthly)} />}
    <View style={styles.total}><Text style={styles.note}>{missingEveryday ? input.bufferMonthly > 0 ? de ? "Rest nach Fixkosten und Reserve" : "Left after fixed costs and reserve" : de ? "Rest nach Fixkosten" : "Left after fixed costs" : de ? "Verbleibender Spielraum (geschätzt)" : "Estimated amount left"}</Text><Text style={styles.amount}>{hasIncome ? money(result.averageRoom) : "—"}</Text></View>
    <Text style={styles.note}>{!hasIncome ? de ? "Trage dein Einkommen in My Home ein, damit wir den Spielraum berechnen können." : "Add income in My Home to calculate what is left." : missingEveryday ? de ? "Davon gehen deine Alltagsausgaben noch ab. Dieser Rest ist noch kein Sparbetrag." : "Everyday spending still comes out of this amount. It is not a savings amount yet." : de ? "Deine Schätzung kann von den tatsächlichen Ausgaben abweichen." : "Your estimate may differ from actual spending."}</Text>
    {hasIncome && !missingEveryday && input.goalMonthly > 0 && <Text style={styles.goal}>{de ? `Du möchtest pro Monat ${money(input.goalMonthly)} zurücklegen. Nach dem Zurücklegen bleiben ${money(result.averageRoom - input.goalMonthly)}.` : `You want to set aside ${money(input.goalMonthly)} each month. After setting it aside, you have ${money(result.averageRoom - input.goalMonthly)}.`}</Text>}
    <Text style={styles.note}>{de ? "Jahresrechnungen sind im Fixkosten-Durchschnitt enthalten. Im Zahlungsmonat kann der Rest niedriger sein." : "Annual bills are included in the fixed-cost average. The amount left may be lower when a bill is due."}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: monthsOpen }} onPress={() => setMonthsOpen(!monthsOpen)} style={styles.toggle}><Text style={styles.toggleText}>{monthsOpen ? de ? "Monate schließen" : "Hide months" : de ? "12 Monate ansehen" : "View 12 months"}</Text></Pressable>
    {monthsOpen && <View style={styles.months}>{result.months.map((item) => <View key={item.month} style={styles.row}><Text style={styles.label}>{new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${item.month}-01T00:00:00Z`))}</Text><Text style={[styles.value, item.afterGoal < 0 && styles.warning]}>{hasIncome ? money(item.remaining) : "—"}</Text></View>)}<Text style={styles.note}>{de ? `${result.undatedCount} Kosten ohne Termin werden monatlich gemittelt. Das Sparziel ist im angezeigten Rest noch enthalten.` : `${result.undatedCount} undated costs use a monthly average. The savings goal is not yet deducted from the amount shown.`}</Text></View>}
  </View>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { marginTop: 10, borderRadius: 15, padding: 14, backgroundColor: "#ffffff", gap: 10 },
  heading: { fontSize: 15, fontWeight: "900", color: "#17211f" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  label: { flex: 1, fontSize: 12, lineHeight: 18, color: "#52605b" },
  value: { flexShrink: 1, textAlign: "right", fontSize: 13, lineHeight: 18, fontWeight: "700", color: "#17211f" },
  total: { borderTopWidth: 1, borderColor: "#dfe5dd", paddingTop: 12, gap: 3 },
  amount: { fontSize: 27, fontWeight: "900", color: "#17211f" },
  note: { fontSize: 12, lineHeight: 18, color: "#52605b" },
  goal: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#17211f" },
  toggle: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  toggleText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  months: { gap: 10 },
  warning: { color: "#92400e" },
});
