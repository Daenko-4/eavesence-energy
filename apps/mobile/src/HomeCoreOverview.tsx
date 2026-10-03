import { Pressable, StyleSheet, Text, View } from "react-native";
import { monthlyCost, type forecastHouseholdCosts, type HouseholdCost } from "@eavesence/core/householdCosts";

type Props = {
  locale: "de" | "en";
  currency: string;
  income: number;
  costs: HouseholdCost[];
  forecast: ReturnType<typeof forecastHouseholdCosts>;
  upcomingOpen: boolean;
  onUpcoming: () => void;
  onIncome: () => void;
  onCost: () => void;
  onCosts: () => void;
  onReview: (cost: HouseholdCost) => void;
};

export function HomeCoreOverview({ locale, currency, income, costs, forecast, upcomingOpen, onUpcoming, onIncome, onCost, onCosts, onReview }: Props) {
  const de = locale === "de";
  const t = (a: string, b: string) => de ? a : b;
  const money = (n: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(n);
  const fixed = forecast.summary.monthlyTotal;
  const deficit = income > 0 && fixed > income;
  const cards = [
    { label: t("Nettoeinkommen pro Monat", "Net income / month"), value: income > 0 ? money(income) : "—" },
    { label: t("Fixkosten pro Monat", "Recurring costs / month"), value: money(fixed) },
    { label: t("Rest nach Fixkosten", "Left after fixed costs"), value: income > 0 && costs.length > 0 ? money(income - fixed) : "—", emphasis: true },
  ];
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.heading}>{t("Dein Monat auf einen Blick", "Your month at a glance")}</Text>
    {cards.map(card => <View key={card.label} style={[styles.card, card.emphasis && styles.darkCard]}>
      <Text style={[styles.label, card.emphasis && styles.darkLabel]}>{card.label}</Text>
      <Text style={[styles.amount, card.emphasis && styles.darkAmount, card.emphasis && deficit && styles.warningAmount]}>{card.value}</Text>
    </View>)}
    <Text style={styles.note}>{t("Monatsdurchschnitte deiner erfassten Kosten. Lebensmittel, Freizeit und andere Alltagsausgaben gehen vom Rest noch ab. Er ist kein Kontostand und noch kein Sparbetrag.", "Monthly averages of your entered costs. Groceries, leisure and other everyday spending still come out of the remainder. It is not your account balance or a savings amount.")}</Text>
    {deficit && <Text accessibilityRole="alert" style={styles.warning}>{t("Deine erfassten Fixkosten übersteigen dein Einkommen. Alltagsausgaben sind noch nicht berücksichtigt. Prüfe deine Beträge und Zahlungsrhythmen.", "Your entered fixed costs exceed your income, before everyday spending. Check your amounts and payment frequencies.")}</Text>}
    {(income <= 0 || costs.length === 0) && <View style={styles.setup}>
      <Text style={styles.setupTitle}>{income <= 0 ? t("1 · Einkommen eintragen", "1 · Add your income") : t("2 · Erste Kosten hinzufügen", "2 · Add your first cost")}</Text>
      <Text style={styles.note}>{income <= 0 ? t("Ein Betrag reicht. Danach ergänzen wir deine regelmäßigen Kosten.", "One amount is enough. Add your recurring costs next.") : t("Beginne mit Miete, Internet oder einer Versicherung. Weitere Kosten kannst du später ergänzen.", "Start with rent, internet or insurance. Add more costs later.")}</Text>
      <Pressable accessibilityRole="button" onPress={income <= 0 ? onIncome : onCost} style={styles.action}><Text style={styles.actionText}>{income <= 0 ? t("Einkommen eintragen", "Add income") : t("Erste Kosten hinzufügen", "Add first cost")}</Text></Pressable>
    </View>}
    {costs.length > 0 && <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: upcomingOpen }} onPress={onUpcoming} style={styles.disclosure}>
        <View style={styles.flex}><Text style={styles.rowTitle}>{t("Zahlungen im nächsten Monat", "Payments next month")}</Text><Text style={styles.note}>{forecast.next.undatedCount > 0 ? t("Termine fehlen", "Dates missing") : money(forecast.next.total)}</Text></View>
        <Text style={styles.plus}>{upcomingOpen ? "×" : "+"}</Text>
      </Pressable>
      {upcomingOpen && <View style={styles.expanded}>
        <Text style={styles.note}>{forecast.next.undatedCount > 0 ? t(`${forecast.next.undatedCount} Kosten ohne Zahlungstermin fehlen in dieser Vorschau. Der Monatsdurchschnitt oben berücksichtigt sie trotzdem.`, `${forecast.next.undatedCount} costs without a payment date are excluded from this forecast. The monthly average above still includes them.`) : t("Alle erfassten Kosten haben einen Zahlungstermin.", "All recorded costs have a payment date.")}</Text>
        {forecast.next.payments.length === 0 ? <Text style={styles.note}>{t("Keine terminierten Zahlungen im nächsten Monat.", "No scheduled payments next month.")}</Text> : forecast.next.payments.map(({ cost, date }) => <View key={`${cost.id}-${date}`} style={styles.row}><Text style={[styles.note, styles.flex]}>{new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))} · {cost.name}</Text><Text style={styles.rowTitle}>{money(cost.amount)}</Text></View>)}
        <Pressable accessibilityRole="button" onPress={onCosts} style={styles.action}><Text style={styles.actionText}>{t("Kosten bearbeiten", "Edit costs")}</Text></Pressable>
      </View>}
    </View>}
    {costs.length > 0 && <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.rowTitle}>{t("Deine Kosten", "Your costs")}</Text>
      {costs.slice(0, 3).map(cost => <Pressable key={cost.id} accessibilityRole="button" accessibilityLabel={t(`${cost.name} bearbeiten`, `Edit ${cost.name}`)} onPress={() => onReview(cost)} style={styles.costRow}><Text style={[styles.rowTitle, styles.flex]}>{cost.name}</Text><Text style={styles.note}>{money(monthlyCost(cost.amount, cost.frequency))} / {t("Monat", "month")}</Text></Pressable>)}
      <Pressable accessibilityRole="button" onPress={onCosts} style={styles.action}><Text style={styles.actionText}>{t(`Alle ${costs.length} Kosten ansehen`, `View all ${costs.length} costs`)}</Text></Pressable>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 20, gap: 12 },
  heading: { fontSize: 20, fontWeight: "800", color: "#17211f" },
  card: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 16, backgroundColor: "#ffffff", padding: 16, gap: 8 },
  darkCard: { borderColor: "#32363b", backgroundColor: "#24272c" },
  label: { fontSize: 12, fontWeight: "600", color: "#65716d" },
  darkLabel: { color: "#d1d7d4" },
  amount: { fontSize: 26, fontWeight: "800", color: "#17211f", letterSpacing: -0.6 },
  darkAmount: { color: "#72dca3" },
  warningAmount: { color: "#ffd28c" },
  note: { fontSize: 13, lineHeight: 20, color: "#65716d" },
  warning: { borderRadius: 12, backgroundColor: "#fff5df", padding: 14, fontSize: 13, lineHeight: 20, color: "#815900" },
  setup: { borderWidth: 1, borderColor: "#b8efcc", borderRadius: 14, backgroundColor: "#eefbf3", padding: 16, gap: 8 },
  setupTitle: { fontSize: 14, fontWeight: "700", color: "#17211f" },
  action: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 12, justifyContent: "center", borderWidth: 1, borderColor: "#aebbb2", borderRadius: 22 },
  actionText: { fontSize: 12, fontWeight: "700", color: "#24272c" },
  disclosure: { minHeight: 44, flexDirection: "row", gap: 12, alignItems: "center" },
  expanded: { borderTopWidth: 1, borderColor: "#dfe5dd", paddingTop: 12, gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  plus: { fontSize: 22, color: "#087a45" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  rowTitle: { fontSize: 13, fontWeight: "700", color: "#17211f" },
  costRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderColor: "#dfe5dd", paddingVertical: 8 },
});
