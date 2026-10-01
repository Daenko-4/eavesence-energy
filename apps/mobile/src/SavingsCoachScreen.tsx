import { Alert, Pressable, StyleSheet, View } from "react-native";
import { scheduleCostReview } from "./reminders";
import { useSavingsCoach } from "@eavesence/core/useSavingsCoach";
import {
  monthlyCost,
  type HouseholdCost,
} from "@eavesence/core/householdCosts";
import type { PlanningData } from "@eavesence/core/planning";
import type {
  SavingsAction,
  SavingsPlanInput,
} from "@eavesence/core/savingsPlan";
import { shiftPlanningMonth } from "@eavesence/core/planning";
import { LocalizedText as Text, useMobileLocale } from "./i18n";
import { FormInput } from "./FormInput";
export function SavingsCoachScreen({
  input,
  actions,
  data,
  onSave,
  onActions,
  onConfirm,
  onReview,
  currency,
}: {
  input: SavingsPlanInput;
  actions: SavingsAction[];
  data?: PlanningData;
  onSave: (p: PlanningData) => Promise<void>;
  onActions: (a: SavingsAction[]) => Promise<void>;
  onConfirm: (a: SavingsAction) => Promise<void>;
  onReview: (c: HouseholdCost) => void;
  currency: string;
}) {
  const de = useMobileLocale() === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useSavingsCoach(input, actions, data, onSave, onActions, onConfirm, de),
    money = (n: number) =>
      new Intl.NumberFormat(de ? "de-AT" : "en-GB", {
        style: "currency",
        currency,
      }).format(n);
  const button = (label: string, action: () => void) => (
    <Pressable
      accessibilityRole="button"
      disabled={p.busy}
      style={styles.button}
      onPress={action}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  async function remind(c: HouseholdCost) {
    try {
      if (!c.cancellationDeadline) return;
      const permitted = await scheduleCostReview(c, de);
      if (!permitted) {
        Alert.alert(
          t("Erinnerungen erlauben", "Allow reminders"),
          t(
            "Du kannst die Berechtigung in den iPhone-Einstellungen ändern.",
            "You can change permission in iPhone settings.",
          ),
        );
        return;
      }
      Alert.alert(
        t("Erinnerung gesetzt", "Reminder set"),
        t(
          "Drei Tage vor der Frist, bei naher Frist in einer Minute.",
          "Three days before the deadline, or in one minute if it is close.",
        ),
      );
    } catch {
      Alert.alert(
        t("Erinnerung nicht verfügbar", "Reminder unavailable"),
        t(
          "Bitte Kosten vor der Frist manuell prüfen.",
          "Review this cost manually before the deadline.",
        ),
      );
    }
  }
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {t("Dein Sparassistent", "Your savings assistant")}
      </Text>
      <Text style={styles.note}>
        {t(
          "Prüfen → Änderung vormerken → Umsetzung bestätigen. Höchstens drei nächste Aufgaben.",
          "Review → plan a change → confirm it happened. Up to three next tasks.",
        )}
      </Text>
      {actions.some((a) => a.status === "confirmed") && (
        <View style={styles.dark}>
          <Text style={styles.light}>
            {t(
              "Seit deinen bestätigten Änderungen rechnerisch weniger ausgegeben",
              "Estimated lower spending since your confirmed changes",
            )}
          </Text>
          <Text style={styles.amount}>{money(p.totals.total)}</Text>
          <Text style={styles.light}>
            {t(
              "Aus Bestätigungen und Zahlungsterminen berechnet. Ohne Termin anteilig geschätzt. Nicht anhand von Kontobuchungen geprüft.",
              "Calculated from confirmations and payment dates. Prorated without dates. Not verified against bank transactions.",
            )}
          </Text>
        </View>
      )}
      {!p.tasks.length && !actions.length && (
        <Text style={styles.note}>
          {t(
            "Ergänze Abos, Energie- oder Versicherungskosten, damit passende Aufgaben entstehen.",
            "Add subscriptions, energy or insurance costs to get relevant tasks.",
          )}
        </Text>
      )}
      {p.tasks.map((c) => (
        <View key={c.id} style={styles.box}>
          <Text style={styles.title}>{c.name}</Text>
          <Text style={styles.note}>
            {money(monthlyCost(c.amount, c.frequency))}{" "}
            {t("im Monatsdurchschnitt", "monthly average")}
          </Text>
          <Text style={styles.note}>
            {c.cancellationDeadline
              ? t(
                  `Frist: ${c.cancellationDeadline}. Brauchst du die Leistung noch?`,
                  `Deadline: ${c.cancellationDeadline}. Still need this service?`,
                )
              : t(
                  "Prüfe einen günstigeren Tarif oder ob die Ausgabe wegfallen kann.",
                  "Check a lower price or whether you can stop this expense.",
                )}
          </Text>
          <View style={styles.row}>
            {button(t("Angaben prüfen", "Review details"), () => onReview(c))}
            {button(t("Änderung planen", "Plan change"), () => p.choose(c))}
            {c.cancellationDeadline &&
              c.cancellationDeadline >= p.today &&
              button(
                t("Erinnerung setzen", "Set reminder"),
                () => void remind(c),
              )}
            {button(
              t("In 30 Tagen erneut prüfen", "Review again in 30 days"),
              () => p.later(c),
            )}
          </View>
        </View>
      ))}
      {p.selected && (
        <View style={styles.box}>
          <Text style={styles.title}>
            {p.selected.name} · {t("Bisher", "Current")}:{" "}
            {money(p.selected.amount)}
          </Text>
          <FormInput
            label={t(
              "Neuer Betrag je Zahlung (0 = fällt weg)",
              "New amount per payment (0 = ends)",
            )}
            value={p.amount}
            onChangeText={p.setAmount}
            keyboardType="decimal-pad"
          />
          <Text style={styles.note}>
            {t("Wirksam ab Monat", "Effective from month")}: {p.effective}
          </Text>
          <View style={styles.row}>
            {button(t("Vorheriger Monat", "Previous month"), () =>
              p.setEffective(shiftPlanningMonth(p.effective, -1)),
            )}
            {button(t("Nächster Monat", "Next month"), () =>
              p.setEffective(shiftPlanningMonth(p.effective, 1)),
            )}
          </View>
          <Text style={styles.note}>
            {t(
              "Laufende Kosten ändern sich erst nach deiner Bestätigung.",
              "Recurring costs change only after you confirm it happened.",
            )}
          </Text>
          <View style={styles.row}>
            {button(
              t("Änderung vormerken", "Save this plan"),
              () => void p.plan(),
            )}
            {button(t("Abbrechen", "Cancel"), p.cancel)}
          </View>
        </View>
      )}
      {actions.map((a) => (
        <View key={a.costId} style={styles.box}>
          <Text style={styles.title}>{a.name}</Text>
          <Text style={styles.note}>
            {money(a.originalAmount)} → {money(a.newAmount)} · {t("ab", "from")}{" "}
            {a.effectiveMonth} ·{" "}
            {a.status === "confirmed"
              ? t("Bestätigt, Kosten aktualisiert", "Confirmed, costs updated")
              : t(
                  "Vorgemerkt, noch keine Ersparnis",
                  "Planned, no confirmed saving yet",
                )}
          </Text>
          {a.status === "planned" &&
            a.effectiveMonth <= p.today.slice(0, 7) &&
            button(
              t("Umgesetzt – Kosten aktualisieren", "Done — update costs"),
              () =>
                Alert.alert(
                  t(
                    "Änderung wirklich umgesetzt?",
                    "Has this change happened?",
                  ),
                  t(
                    "Die laufende Ausgabe wird angepasst oder bei Betrag 0 entfernt.",
                    "The recurring cost will be updated or removed if the amount is 0.",
                  ),
                  [
                    { text: t("Abbrechen", "Cancel"), style: "cancel" },
                    {
                      text: t("Bestätigen", "Confirm"),
                      onPress: () => void p.confirm(a),
                    },
                  ],
                ),
            )}
        </View>
      ))}
      {p.error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {p.error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 14,
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5dd",
  },
  title: { fontSize: 14, fontWeight: "800", color: "#24272c" },
  note: { fontSize: 12, lineHeight: 18, color: "#52605b" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    minHeight: 38,
    padding: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    backgroundColor: "#dff7e9",
  },
  buttonText: { fontSize: 12, fontWeight: "700", color: "#087a45" },
  box: { padding: 12, gap: 8, borderRadius: 12, backgroundColor: "#f4f6f2" },
  dark: { padding: 14, gap: 8, borderRadius: 12, backgroundColor: "#24272c" },
  light: { fontSize: 12, lineHeight: 18, color: "#d1d7d4" },
  amount: { fontSize: 22, fontWeight: "900", color: "#fff" },
  error: { fontSize: 12, color: "#b91c1c" },
});
