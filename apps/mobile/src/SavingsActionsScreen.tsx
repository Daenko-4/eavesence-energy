import { monthlyCost, type HouseholdCostFrequency } from "@eavesence/core/householdCosts";
import { compareSavingsActions, createSavingsAction, savingsActionKey, upsertSavingsPlan, savingsReviewCandidates, type SavingsAction, type SavingsPlanInput } from "@eavesence/core/savingsPlan";
import { useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, View } from "react-native";
import { FormSection } from "./FormSection";
import { FormInput } from "./FormInput";
import { LocalizedText as Text, useMobileLocale } from "./i18n";

export function SavingsActionsScreen({ input, actions, currency, onChange, onConfirm }: {
  input: SavingsPlanInput;
  actions: SavingsAction[];
  currency: string;
  onChange: (actions: SavingsAction[]) => Promise<void>;
  onConfirm: (action: SavingsAction) => Promise<void>;
}) {
  const locale = useMobileLocale();
  const de = locale === "de";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const suggested = savingsReviewCandidates(input.costs, today)[0];
  const [costId, setCostId] = useState(suggested?.id ?? "");
  const [mode, setMode] = useState<"reduce" | "stop">("reduce");
  const [amount, setAmount] = useState("");
  const [offset, setOffset] = useState(0);
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  const selected = input.costs.find((cost) => cost.id === costId) ?? input.costs[0];
  const cadence = (frequency: HouseholdCostFrequency) => (de ? { weekly: "pro Woche", monthly: "pro Monat", quarterly: "alle 3 Monate", "half-yearly": "alle 6 Monate", yearly: "pro Jahr" } : { weekly: "per week", monthly: "per month", quarterly: "every 3 months", "half-yearly": "every 6 months", yearly: "per year" })[frequency];
  const [year, number] = input.startMonth.split("-").map(Number);
  const effectiveMonth = new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
  const monthLabel = (value: string) => new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
  const target = mode === "stop" ? 0 : Number(amount.trim().replace(",", "."));
  const draft = selected && (mode === "stop" || amount.trim()) ? createSavingsAction(selected, target, effectiveMonth) : null;
  const preview = draft ? compareSavingsActions(input, [draft]) : null;
  const combined = compareSavingsActions(input, actions);
  const confirmedAnnual = actions.filter((action) => action.status === "confirmed" &&
    (input.costs.some((cost) => cost.id === action.costId && (cost.amount === action.originalAmount || cost.amount === action.newAmount)) ||
      (action.newAmount === 0 && !input.costs.some((cost) => cost.id === action.costId))))
    .reduce((sum, action) => sum + monthlyCost(action.originalAmount - action.newAmount, action.frequency) * 12, 0);

  async function change(next: SavingsAction[]) {
    try { await onChange(next); Keyboard.dismiss(); }
    catch { Alert.alert(de ? "Speichern fehlgeschlagen" : "Could not save", de ? "Bitte versuche es erneut." : "Please try again."); }
  }
  function save() {
    if (!draft) { Alert.alert(de ? "Betrag prüfen" : "Check amount", de ? "Wähle einen kleineren Betrag als bisher." : "Choose an amount lower than the current cost."); return; }
    void change(upsertSavingsPlan(actions, draft));
    setAmount("");
  }

  return <FormSection onSave={save} saveLabel={de ? "Änderung vormerken" : "Save this plan"} style={styles.container}>
    <Text style={styles.eyebrow}>{de ? "DEIN NÄCHSTER SCHRITT" : "YOUR NEXT STEP"}</Text>
    <Text style={styles.heading}>{de ? "Was wäre, wenn du weniger zahlst?" : "What if you paid less?"}</Text>
    <Text style={styles.note}>{de ? "Teste eine günstigere Ausgabe oder eine Kündigung. Wir zeigen dir die mögliche Ersparnis. Deine eingetragenen Kosten werden dabei nicht geändert." : "Try a lower cost or a cancellation to see the possible saving. Your recorded costs stay the same."}</Text>
    {suggested && <Text style={styles.note}>{de ? "Vorschlag zum Start" : "Suggested starting point"}: {suggested.name}.</Text>}
    {input.costs.length > 0 ? <>
      <Text style={styles.label}>{de ? "1. Welche Ausgabe?" : "1. Which cost?"}</Text>
      <View style={styles.options}>{input.costs.map((cost) => <Pressable key={cost.id} accessibilityRole="button" accessibilityState={{ selected: selected?.id === cost.id }} onPress={() => { setCostId(cost.id); setAmount(""); }} style={[styles.chip, selected?.id === cost.id && styles.chipActive]}><Text style={[styles.chipText, selected?.id === cost.id && styles.chipTextActive]}>{cost.name} · {money(cost.amount)} {cadence(cost.frequency)}</Text></Pressable>)}</View>
      <Text style={styles.label}>{de ? "2. Wie möchtest du sparen?" : "2. How would you save?"}</Text>
      <View style={styles.options}>{(["reduce", "stop"] as const).map((value) => <Pressable key={value} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: mode === value }} onPress={() => setMode(value)} style={[styles.modeChip, mode === value && styles.chipActive]}><Text style={[styles.modeChipText, mode === value && styles.chipTextActive]}>{value === "reduce" ? de ? "Betrag reduzieren" : "Reduce amount" : de ? "Ausgabe streichen" : "Remove expense"}</Text></Pressable>)}</View>
      <Text style={styles.note}>{mode === "reduce" ? de ? "Die Ausgabe bleibt bestehen, aber du planst einen niedrigeren Betrag ein." : "Keep this expense, but plan a lower payment." : de ? "Diese Ausgabe fällt künftig weg, zum Beispiel nach einer Kündigung. Wir rechnen ab dem gewählten Monat mit 0." : "This expense will end, for example after cancellation. We use 0 from the selected month."}</Text>
      {mode === "reduce" && <FormInput label={de ? `Neuer Betrag ${selected ? cadence(selected.frequency) : ""}` : `New amount ${selected ? cadence(selected.frequency) : ""}`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={de ? "z. B. 25" : "e.g. 25"} />}
      <Text style={styles.label}>{de ? "3. Ab welchem Monat zahlst du weniger?" : "3. From which month will you pay less?"}</Text>
      <View style={styles.monthRow}><Pressable accessibilityRole="button" accessibilityLabel={de ? "Vorheriger Monat" : "Previous month"} disabled={offset === 0} onPress={() => setOffset(offset - 1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable><Text style={styles.monthText}>{monthLabel(effectiveMonth)}</Text><Pressable accessibilityRole="button" accessibilityLabel={de ? "Nächster Monat" : "Next month"} disabled={offset === 11} onPress={() => setOffset(offset + 1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable></View>
      <Text style={styles.note}>{de ? "Wähle den Monat, ab dem der neue Preis gilt oder die Kündigung wirksam ist." : "Choose the month when the new price or cancellation takes effect."}</Text>
      {selected?.cancellationDeadline && <Text style={styles.deadline}>{de ? "Eingetragene Kündigungsfrist" : "Saved cancellation deadline"}: {selected.cancellationDeadline.split("-").reverse().join(".")}{selected.cancellationDeadline < today ? de ? " · vorbei – Vertrag prüfen" : " · passed – check contract" : ""}</Text>}
      {preview && selected && <View style={styles.previewCard}>
        <Text style={styles.note}>{de ? "Bisher" : "Before"}: {money(selected.amount)} {cadence(selected.frequency)}</Text>
        <Text style={styles.note}>{de ? "Danach" : "After"}: {money(target)} {cadence(selected.frequency)}</Text>
        <Text style={styles.note}>{de ? "Weniger Ausgaben in den nächsten 12 Monaten" : "Lower spending over the next 12 months"}</Text>
        <Text style={styles.previewAmount}>{money(preview.totalDifference)}</Text>
        <Text style={styles.note}>{preview.firstBenefitMonth ? `${de ? "Erste niedrigere Zahlung" : "First lower payment"}: ${monthLabel(preview.firstBenefitMonth)}.` : de ? "Im angezeigten Zeitraum wird noch keine Zahlung günstiger." : "No payment changes within the period shown."}</Text>
      </View>}
      <Pressable accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>{de ? "Änderung vormerken" : "Save this plan"}</Text></Pressable>
    </> : <Text style={styles.note}>{de ? "Erfasse zuerst eine regelmäßige Ausgabe." : "Add a recurring cost first."}</Text>}
    {actions.length > 0 && <View style={styles.saved}><Text style={styles.heading}>{de ? "Deine Vorhaben" : "Your plans"}</Text>{actions.map((action) => {
      const cost = input.costs.find((item) => item.id === action.costId);
      const applied = cost?.amount === action.newAmount || (!cost && action.newAmount === 0);
      const changed = !applied && (!cost || cost.amount !== action.originalAmount);
      const impact = compareSavingsActions(input, [action]);
      const due = cost?.cancellationDeadline;
      const soon = due && due >= today && due <= new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86_400_000).toISOString().slice(0, 10);
      return <View key={savingsActionKey(action)} style={styles.action}>
        <Text style={styles.actionTitle}>{cost?.name ?? action.name} · {action.newAmount === 0 ? de ? "beenden" : "end" : `${money(action.originalAmount)} → ${money(action.newAmount)}`} · {monthLabel(action.effectiveMonth)}</Text>
        <Text style={styles.note}>{changed ? de ? "Ausgabe geändert: Szenario prüfen oder entfernen." : "Cost changed: review or remove this scenario." : `${applied ? de ? "Änderung bereits in deinen Kosten erfasst" : "Change already reflected in your costs" : `${de ? "Zusätzliche Wirkung in 12 Monaten" : "Additional impact over 12 months"}: ${money(impact?.totalDifference ?? 0)}`} · ${action.status === "confirmed" ? de ? "von dir als umgesetzt bestätigt" : "marked done by you" : action.effectiveMonth <= today.slice(0, 7) ? de ? "Check-in: Hat sich der Betrag wirklich geändert?" : "Check-in: Did the amount actually change?" : de ? "geplant, noch nicht umgesetzt" : "planned, not yet done"}`}{soon ? ` · ${de ? "Frist bald" : "Deadline soon"}: ${due.split("-").reverse().join(".")}` : ""}</Text>
        <View style={styles.options}>
          {!changed && action.status === "planned" && action.effectiveMonth <= today.slice(0, 7) && <Pressable onPress={() => Alert.alert(de ? "Änderung umgesetzt?" : "Change completed?", de ? "Laufende Kosten werden aktualisiert." : "Recurring costs will be updated.", [{text:de?"Abbrechen":"Cancel",style:"cancel"},{text:de?"Bestätigen":"Confirm",onPress:()=>void onConfirm(action).catch(()=>Alert.alert(de?"Kosten prüfen":"Review cost",de?"Angaben inzwischen geändert.":"Entries have changed."))}])} style={styles.link}><Text style={styles.linkText}>{de ? "Als umgesetzt markieren" : "Mark as done"}</Text></Pressable>}
          {action.status === "confirmed" && <Pressable onPress={() => void change(actions.map((item) => savingsActionKey(item) === savingsActionKey(action) ? { ...item, status: "planned", confirmedAt: undefined } : item))} style={styles.link}><Text style={styles.linkText}>{de ? "Status korrigieren" : "Correct status"}</Text></Pressable>}
          <Pressable onPress={() => void change(actions.filter((item) => savingsActionKey(item) !== savingsActionKey(action)))} style={styles.link}><Text style={styles.linkText}>{de ? "Entfernen" : "Remove"}</Text></Pressable>
        </View>
      </View>;
    })}<Text style={styles.note}>{de ? `Mögliche Wirkung aller Vorhaben in 12 Monaten: ${money(combined?.totalDifference ?? 0)}. Von dir bestätigte Änderungen, aufs Jahr gerechnet: ${money(confirmedAnnual)}. Keine Prüfung anhand von Kontobelegen.` : `Possible impact of all plans over 12 months: ${money(combined?.totalDifference ?? 0)}. Changes you marked done, annualized: ${money(confirmedAnnual)}. No bank transaction verification.`}</Text></View>}
  </FormSection>;
}

const styles = StyleSheet.create({
  container: { marginTop: 18, gap: 11, paddingTop: 17, borderTopWidth: 1, borderColor: "#dfe5dd" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1, color: "#087a45" },
  heading: { fontSize: 17, fontWeight: "900", color: "#17211f" },
  note: { fontSize: 12, lineHeight: 18, color: "#52605b" },
  label: { fontSize: 12, fontWeight: "800", color: "#52605b", marginTop: 4 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: "#eefbf3" },
  modeChip: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#eefbf3" },
  modeChipText: { color: "#087a45", fontSize: 11, lineHeight: 14, fontWeight: "600" },
  chipActive: { backgroundColor: "#087a45" },
  chipText: { color: "#087a45", fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: "#ffffff" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, backgroundColor: "#ffffff" },
  monthButton: { minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" },
  monthButtonText: { fontSize: 23, color: "#087a45" },
  monthText: { fontSize: 14, fontWeight: "800", color: "#17211f" },
  deadline: { fontSize: 12, fontWeight: "700", color: "#92400e" },
  previewCard: { borderRadius: 13, padding: 14, backgroundColor: "#eefbf3", gap: 8 },
  previewAmount: { fontSize: 26, fontWeight: "900", color: "#17211f" },
  save: { minHeight: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", backgroundColor: "#087a45" },
  saveText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  saved: { borderTopWidth: 1, borderColor: "#dfe5dd", paddingTop: 14, gap: 9 },
  action: { borderRadius: 14, backgroundColor: "#f4f6f2", padding: 12, gap: 7 },
  actionTitle: { fontSize: 13, fontWeight: "800", color: "#17211f" },
  link: { minHeight: 36, paddingHorizontal: 7, justifyContent: "center" },
  linkText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
});
