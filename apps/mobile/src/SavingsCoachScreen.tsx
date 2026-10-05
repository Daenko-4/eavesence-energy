import { DisclosureIcon } from "./BrandMotion";
import { useState } from "react";
import { costReviewTip } from "@eavesence/core/homeValue";
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
import { FormSection, FormSubmitButton } from "./FormSection";
import { FormInput } from "./FormInput";
export function SavingsCoachScreen({
  input,
  actions,
  data,
  onSave,
  onActions,
  onConfirm,
  onReview,
  onNavigate,
  currency,
  mode = "all",
}: {
  input: SavingsPlanInput;
  actions: SavingsAction[];
  data?: PlanningData;
  onSave: (p: PlanningData) => Promise<void>;
  onActions: (a: SavingsAction[]) => Promise<void>;
  onConfirm: (a: SavingsAction) => Promise<void>;
  onReview: (c: HouseholdCost) => void;
  onNavigate?: (question: "savings" | "progress") => void;
  currency: string;
  mode?: "all" | "opportunities" | "progress";
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
  const [costPickerOpen, setCostPickerOpen] = useState(false);
  const [progressDetailsOpen,setProgressDetailsOpen] = useState(false), [taskOptionsOpen,setTaskOptionsOpen] = useState(false);
  const shownActions = actions.filter(a => mode === "all" || (mode === "progress" ? a.status === "confirmed" : a.status !== "confirmed"));
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {mode === "progress" ? t("03 · Was habe ich tatsächlich eingespart?", "03 · What have I actually saved?") : t("02 · Wo kann ich realistisch sparen?", "02 · Where can I realistically save?")}
      </Text>
      <Text style={styles.note}>
        {mode === "progress" ? t("Nur umgesetzte und bestätigte Änderungen zählen. Der Betrag ist aus deinen Angaben berechnet, nicht über ein Bankkonto nachgewiesen.", "Only completed, confirmed changes count. The amount is calculated from your entries, not verified against a bank account.") : t(
          "Wähle einen Kostenposten, prüfe einen günstigeren Betrag und merke die Änderung vor. Erst nach der Umsetzung bestätigen.",
          "Choose one cost, check a lower amount and save the plan. Confirm it only after the change happens.",
        )}
      </Text>
      {mode !== "progress" && p.plannedMonthly > 0 && <View style={styles.box}><Text style={styles.title}>{t("Vorgemerktes Sparpotenzial", "Planned savings potential")}: {money(p.plannedMonthly)} {t("pro Monat", "per month")}</Text><Text style={styles.note}>{t("Noch nicht erreicht. Bestätige jede Änderung erst nach der Umsetzung.", "Not achieved yet. Confirm each change only after it happens.")}</Text></View>}
      {p.notice && <Text accessibilityRole="summary" style={styles.note}>{p.notice}</Text>}
      {mode === "progress" && !shownActions.length && <Text style={styles.note}>{t("Noch keine bestätigte Ersparnis. Plane eine konkrete Kostenänderung und bestätige sie erst nach der Umsetzung.", "No confirmed savings yet. Plan a specific cost change and confirm it after it happens.")}</Text>}
      {p.outdated.some(a => shownActions.includes(a)) && (
        <Text style={styles.error}>
          {t(
            "Kosten erneut geändert. Betroffene Änderungen sind bis zur Prüfung nicht im Ersparniswert enthalten.",
            "Costs changed again. Affected changes are excluded from the savings total until reviewed.",
          )}
        </Text>
      )}
      {mode !== "opportunities" && actions.some((a) => a.status === "confirmed") && (
        <View style={styles.dark}>
          <Text style={styles.light}>
            {t(
              "Bis heute anhand bestätigter Änderungen und Zahlungstermine eingespart",
              "Saved to date from confirmed changes and payment dates",
            )}
          </Text>
          <Text style={styles.amount}>{money(p.totals.scheduled)}</Text>
          <Text style={styles.light}>
            {t(
              "Aus Bestätigungen und Zahlungsterminen berechnet. Nicht anhand von Kontobuchungen geprüft.",
              "Calculated from confirmations and payment dates. Not verified against bank transactions.",
            )}
          </Text>
        </View>
      )}
      {mode !== "progress" && !p.tasks.length && !actions.length && (
        <Text style={styles.note}>
          {t(
            "Ergänze Abos, Energie- oder Versicherungskosten, damit passende Aufgaben entstehen.",
            "Add subscriptions, energy or insurance costs to get relevant tasks.",
          )}
        </Text>
      )}
      {mode !== "progress" && input.costs.length > 0 && <Text style={styles.title}>{t("1 · Kostenposten auswählen", "1 · Choose one cost")}</Text>}
      {mode !== "progress" && input.costs.length > 0 && <>{button(t("Kostenänderung testen · Kosten auswählen", "Test a cost change · choose a cost"), () => setCostPickerOpen(!costPickerOpen))}{costPickerOpen && <View style={styles.row}>{input.costs.map(c => <View key={c.id}>{button(`${c.name} · ${money(c.amount)}`, () => {p.choose(c);setCostPickerOpen(false);})}</View>)}</View>}</>}
      {(mode === "progress" || p.selected ? [] : p.tasks.slice(0,1)).map((c) => (
        <View key={c.id} style={styles.box}>
          <Text style={styles.title}>{c.name}</Text>
          <Text style={styles.note}>
            {money(monthlyCost(c.amount, c.frequency))}{" "}
            {t("im Monatsdurchschnitt", "monthly average")}
          </Text>
          <Text style={styles.note}>
            {c.cancellationDeadline ? `${t("Frist", "Deadline")}: ${c.cancellationDeadline}. ` : ""}{costReviewTip(c.category, de, c.frequency)}
          </Text>
          {button(t("Änderung planen", "Plan change"),()=>p.choose(c))}
          <Pressable accessibilityRole="button" accessibilityState={{expanded:taskOptionsOpen}} onPress={()=>setTaskOptionsOpen(!taskOptionsOpen)} style={styles.disclosure}><Text style={styles.note}>{t("Weitere Optionen", "More options")}</Text><DisclosureIcon open={taskOptionsOpen}/></Pressable>
          {taskOptionsOpen&&<View style={styles.row}>{button(t("Angaben prüfen", "Review details"),()=>onReview(c))}{c.cancellationDeadline&&c.cancellationDeadline>=p.today&&button(t("Erinnerung setzen", "Set reminder"),()=>void remind(c))}{button(t("In 30 Tagen erneut prüfen", "Review again in 30 days"),()=>p.later(c))}</View>}

        </View>
      ))}
      {mode !== "progress" && p.selected && <Text style={styles.title}>{t("2 · Neuen Betrag prüfen und vormerken", "2 · Check a new amount and save the plan")}</Text>}
      {mode !== "progress" && p.selected && (
        <FormSection style={styles.box} onSave={p.plan} saveLabel={t("Änderung vormerken", "Save this plan")}>
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
          {p.preview && <Text accessibilityRole="summary" style={styles.note}>{t("In den nächsten 12 Planungsmonaten voraussichtlich", "Estimated over the next 12 planning months")}: {money(p.preview.totalDifference)} {t("weniger Ausgaben. Zahlungstermine und Startmonat sind berücksichtigt. Noch keine bestätigte Ersparnis.", "lower spending. Payment dates and the start month are included. Not a confirmed saving yet.")}</Text>}
          <View style={styles.row}>
            <FormSubmitButton label={t("Änderung vormerken", "Save this plan")} style={styles.button} textStyle={styles.buttonText}/>
            {button(t("Abbrechen", "Cancel"), p.cancel)}
          </View>
        </FormSection>
      )}
      {mode !== "progress" && shownActions.length > 0 && <Text style={styles.title}>{t("3 · Erst nach der Umsetzung bestätigen", "3 · Confirm only after it happens")}</Text>}
      {mode === "progress" && shownActions.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{expanded:progressDetailsOpen}} onPress={()=>setProgressDetailsOpen(!progressDetailsOpen)} style={styles.disclosure}><Text style={styles.note}>{t("Bestätigte Änderungen & Schätzungen", "Confirmed changes & estimates")} · {shownActions.length}</Text><DisclosureIcon open={progressDetailsOpen}/></Pressable>}
      {(mode !== "progress" || progressDetailsOpen)&&<>
      {shownActions.map((a) => (
        <View key={a.costId} style={styles.box}>
          <Text style={styles.title}>{a.name}</Text>
          <Text style={styles.note}>
            {money(a.originalAmount)} → {money(a.newAmount)} · {t("ab", "from")}{" "}
            {new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${a.effectiveMonth}-01T00:00:00Z`))} ·{" "}
            {p.outdated.includes(a)
              ? t(
                  "Angaben geändert – bitte prüfen",
                  "Entries changed — review needed",
                )
              : a.status === "confirmed"
                ? t(
                    "Bestätigt, Kosten aktualisiert",
                    "Confirmed, costs updated",
                  )
                : t(
                    "Vorgemerkt, noch keine Ersparnis",
                    "Planned, no confirmed saving yet",
                  )}
          </Text>
          {p.outdated.includes(a) && input.costs.some(c => c.id === a.costId) &&
            button(t("Kosten prüfen", "Review cost"), () => {
              const cost = input.costs.find((c) => c.id === a.costId);
              if (cost) onReview(cost);
            })}
          {a.status === "planned" &&
            button(
              t("Vorhaben verwerfen", "Discard plan"),
              () => void p.discard(a),
            )}
          {a.status === "planned" &&
            !p.outdated.includes(a) && a.effectiveMonth <= p.today.slice(0, 7) &&
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
      {mode === "progress" && p.totals.estimated > 0 && <Text style={styles.note}>{t("Zusätzlich ohne Zahlungstermin geschätzt", "Additional estimate without payment dates")}: {money(p.totals.estimated)}. {t("Nicht im Betrag oben enthalten.", "Not included in the amount above.")}</Text>}
      {mode === "progress" && p.confirmedMonthly > 0 && <Text style={styles.note}>{t("Deine bestätigten Änderungen senken die laufenden Kosten durchschnittlich um", "Your confirmed changes reduce recurring costs by an average of")} {money(p.confirmedMonthly)} {t("pro Monat. Das ist kein zusätzlich bereits angesparter Betrag.", "per month. This is not extra money already saved.")}</Text>}
      </>}
      {onNavigate && mode !== "all" && button(mode === "progress" ? t("Eine Sparmöglichkeit prüfen", "Review a savings opportunity") : t("Erreichte Ersparnis ansehen", "View achieved savings"), () => onNavigate(mode === "progress" ? "savings" : "progress"))}
      {p.error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {p.error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  disclosure: {minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},
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
    minHeight: 44,
    padding: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dfe5dd",
  },
  buttonText: { fontSize: 12, fontWeight: "700", color: "#087a45" },
  box: { padding: 12, gap: 8, borderRadius: 12, backgroundColor: "#f4f6f2" },
  dark: { padding: 14, gap: 8, borderRadius: 12, backgroundColor: "#24272c" },
  light: { fontSize: 12, lineHeight: 18, color: "#d1d7d4" },
  amount: { fontSize: 22, fontWeight: "900", color: "#fff" },
  error: { fontSize: 12, color: "#b91c1c" },
});
