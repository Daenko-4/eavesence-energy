import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useCashWindow } from "@eavesence/core/useCashWindow";
import type { PlanningData } from "@eavesence/core/planning";
import {
  type SavingsPlanInput,
} from "@eavesence/core/savingsPlan";
import { FormSection } from "./FormSection";
import { FormInput } from "./FormInput";
import { LocalizedText as Text, useMobileLocale } from "./i18n";
export function PaydayScreen({
  input,
  data,
  onSave,
  currency,
  onReviewCost,
}: {
  input: SavingsPlanInput;
  data?: PlanningData;
  onSave: (p: PlanningData) => Promise<void>;
  onReviewCost?: (cost: SavingsPlanInput["costs"][number]) => void;
  currency: string;
}) {
  const de = useMobileLocale() === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useCashWindow(input, data, onSave, de),
    [open, setOpen] = useState(false);
  const money = (n: number) =>
      new Intl.NumberFormat(de ? "de-AT" : "en-GB", {
        style: "currency",
        currency,
      }).format(n),
    complete =
      !!p.forecast &&
      p.forecast.remaining !== null &&
      p.forecast.missingDates === 0;
  const day = (s: string) =>
    new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${s}T00:00:00Z`));
  const dateInput = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 8);
    return d.length === 8
      ? `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}`
      : value;
  };
  const display = p.payday.match(/^\d{4}-\d{2}-\d{2}$/)
    ? p.payday.split("-").reverse().join(".")
    : p.payday;
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
  return (
    <View style={styles.card}>
      <View style={styles.dark}>
        <Text style={styles.eyebrow}>
          {complete
            ? t("01 · BIS ZUM NÄCHSTEN GEHALT", "01 · UNTIL YOUR NEXT PAYDAY")
            : t("01 · BIS ZUM NÄCHSTEN GEHALT", "01 · UNTIL YOUR NEXT PAYDAY")}
        </Text>
        <Text style={styles.title}>
          {complete
            ? t(
                `Was bleibt bis ${day(p.cash!.payday)}?`,
                `What is left until ${day(p.cash!.payday)}?`,
              )
            : t("Was kann ich bis zum nächsten Gehalt ausgeben?", "What can I spend until my next payday?")}
        </Text>
        <Text style={styles.amount}>
          {complete
            ? money(p.forecast!.remaining!)
            : "—"}
        </Text>
        <Text style={styles.light}>
          {complete
            ? t(
                "Nach anstehenden Zahlungen, Alltag und dem Geld, das unberührt bleiben soll.",
                "After upcoming payments, everyday spending and money to keep untouched.",
              )
            : t(
                p.forecast ? "Dein Guthaben ist erfasst. Ergänze fehlende Zahlungstermine und eine Alltagsschätzung, bevor wir einen vollständigen Spielraum anzeigen." : "Trage dein heutiges Guthaben, den nächsten Gehaltstermin und deine erwarteten Alltagsausgaben ein. Bestehende Angaben kannst du aktualisieren.",
                p.forecast ? "Your balance is recorded. Add missing payment dates and an everyday-spending estimate before we show a complete available budget." : "Enter today’s balance, your next payday and expected everyday spending. You can update existing entries.",
              )}
        </Text>
        {p.forecast && input.costs.filter(c => !c.nextDueDate).map(c => <Pressable key={c.id} accessibilityRole="button" style={styles.mintButton} onPress={() => onReviewCost?.(c)}><Text style={styles.mintText}>{c.name} · {t("Termin ergänzen", "Add date")}</Text></Pressable>)}
        {p.forecast?.everyday === null && <Text style={styles.warning}>{t("Noch offen: Alltag bis zum Gehalt. Öffne die Rechnung und ergänze den Betrag; 0 ist möglich.", "Still missing: everyday spending until payday. Open the calculation and add an amount; 0 is allowed.")}</Text>}
        {p.stale && (
          <Text style={styles.warning}>
            {t(
              "Guthaben ist von einem früheren Tag. Bitte aktualisieren.",
              "Balance is from an earlier day. Please update it.",
            )}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={styles.mintButton}
          onPress={() => setOpen(!open)}
        >
          <Text style={styles.mintText}>
            {open
              ? t("Einklappen", "Collapse")
              : p.cash
                ? t(
                    "Guthaben aktualisieren / Rechnung ansehen",
                    "Update balance / see calculation",
                  )
                : t("Bis zum nächsten Gehalt planen", "Plan until next payday")}
          </Text>
        </Pressable>
      </View>
      {open && (
        <FormSection style={styles.form} onSave={p.save} saveLabel={t("Guthaben bestätigen & berechnen", "Confirm balance & calculate")}>
          <Text style={styles.note}>
            {t(
              "Guthaben nach bereits bezahlten Rechnungen eintragen. Zahlungen für heute zählen als offen; passe deren nächste Fälligkeit an, falls bezahlt. Das nächste Gehalt wird noch nicht dazugezählt.",
              "Enter your balance after bills already paid. Today’s payments count as pending; update their next due date if paid. Your next salary is not added yet.",
            )}
          </Text>
          <FormInput
            label={t("Heute verfügbares Guthaben", "Balance available today")}
            keyboardType="decimal-pad"
            value={p.balance}
            onChangeText={p.setBalance}
          />
          <Text style={styles.note}>
            {t(
              "Geld auf den Konten, aus denen du die nächsten Ausgaben bezahlst.",
              "Money in the accounts used to pay your upcoming expenses.",
            )}
          </Text>
          <FormInput
            label={t(
              "Nächstes Gehalt am (TT.MM.JJJJ)",
              "Next payday (DD.MM.YYYY)",
            )}
            keyboardType="number-pad"
            placeholder="25.10.2026"
            value={display}
            onChangeText={(v) => p.setPayday(dateInput(v))}
          />
          <View style={styles.row}>
            {[7, 14, 28].map((n) =>
              button(t(`In ${n} Tagen`, `In ${n} days`), () =>
                p.setPayday(
                  new Date(Date.parse(p.today) + n * 86400000)
                    .toISOString()
                    .slice(0, 10),
                ),
              ),
            )}
          </View>
          <FormInput
            label={t(
              "Davon unberührt lassen",
              "Keep untouched from this balance",
            )}
            keyboardType="decimal-pad"
            value={p.protectedAmount}
            onChangeText={p.setProtected}
          />
          <Text style={styles.note}>
            {t(
              "Zum Beispiel Notgroschen. Geld für unten aufgeführte Rechnungen nicht erneut eintragen. Sparziele und Rücklagen werden nicht automatisch abgezogen.",
              "For example emergency savings. Do not include money for bills below again. Goals and reserves are not automatically deducted.",
            )}
          </Text>
          <FormInput
            label={t(
              "Alltag bis zum Gehalt (optional)",
              "Everyday spending until payday (optional)",
            )}
            value={p.everyday}
            onChangeText={p.setEveryday}
            keyboardType="decimal-pad"
            placeholder={t(
              "Leer = aus Monatsschätzung",
              "Blank = use monthly estimate",
            )}
          />
          {button(
            t("Guthaben bestätigen & berechnen", "Confirm balance & calculate"),
            () => void p.save(),
          )}
          {p.error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {p.error}
            </Text>
          )}
          {p.forecast && (
            <View style={styles.box}>
              {[
                [t("Heutiges Guthaben", "Today’s balance"), p.cash!.balance],
                [
                  t("− Zahlungen bis zum Gehalt", "− Payments until payday"),
                  p.forecast.fixed,
                ],
                [
                  p.forecast.estimated
                    ? t(
                        "− Alltag (anteilig geschätzt)",
                        "− Everyday spending (estimated share)",
                      )
                    : t(
                        "− Alltag (deine Eingabe)",
                        "− Everyday spending (your entry)",
                      ),
                  p.forecast.everyday,
                ],
                [
                  t("− Unberührt lassen", "− Keep untouched"),
                  p.cash!.protected,
                ],
              ].map(([label, n]) => (
                <Text key={String(label)} style={styles.note}>
                  {label}: {n === null ? "—" : money(Number(n))}
                </Text>
              ))}
              {p.forecast.missingDates > 0 && (
                <Text style={styles.error}>
                  {t(
                    `${p.forecast.missingDates} Kosten ohne Zahlungstermin fehlen. Noch kein vollständiger Spielraum.`,
                    `${p.forecast.missingDates} undated costs are missing. Available budget is incomplete.`,
                  )}
                </Text>
              )}
              {p.forecast.everyday === null && (
                <Text style={styles.note}>
                  {t("Alltagsschätzung fehlt.", "Everyday estimate missing.")}
                </Text>
              )}
              <Text style={styles.subTitle}>
                {t("Anstehende Zahlungen", "Upcoming payments")}
              </Text>
              {p.forecast.payments.map((pay, i) => (
                <Text key={i} style={styles.note}>
                  {day(pay.date)} · {pay.cost.name} · {money(pay.cost.amount)}
                </Text>
              ))}
              {!p.forecast.payments.length && (
                <Text style={styles.note}>
                  {t(
                    "Keine datierten Zahlungen im Zeitraum.",
                    "No dated payments in this period.",
                  )}
                </Text>
              )}
            </View>
          )}
        </FormSection>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    marginVertical: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#32363b",
  },
  dark: { padding: 18, gap: 9, backgroundColor: "#24272c" },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#72dca3",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  amount: { fontSize: 28, fontWeight: "900", color: "#fff" },
  light: { fontSize: 12, lineHeight: 18, color: "#d1d7d4" },
  warning: { fontSize: 12, color: "#ffe1a8" },
  mintButton: {
    alignSelf: "flex-start",
    backgroundColor: "#72dca3",
    padding: 12,
    borderRadius: 22,
  },
  mintText: { fontSize: 12, fontWeight: "800", color: "#17211f" },
  form: { padding: 14, gap: 12, backgroundColor: "#fff" },
  note: { fontSize: 12, lineHeight: 18, color: "#52605b" },
  subTitle: { fontSize: 14, fontWeight: "800", color: "#24272c" },
  button: {
    minHeight: 44,
    borderRadius: 20,
    padding: 10,
    alignSelf: "flex-start",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dfe5dd",
  },
  buttonText: { fontSize: 12, fontWeight: "700", color: "#087a45" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  error: { fontSize: 12, lineHeight: 18, color: "#b91c1c" },
  box: { padding: 12, gap: 8, borderRadius: 12, backgroundColor: "#f4f6f2" },
});
