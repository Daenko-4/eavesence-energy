import {
  annualCost,
  createHouseholdCost,
  monthlyCost,
  summarizeHouseholdCosts,
  type HouseholdCost,
  type HouseholdCostCategory,
  type HouseholdCostFrequency,
} from "@eavesence/core/householdCosts";
import { useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, View } from "react-native";

import { costsForTile, destinationTileId } from "./costTiles";
import type { MobileProfile } from "./storage";
import type { MobileTile } from "./tiles";
import { FormInput } from "./FormInput";
import { shareDeadline } from "./deadlineFile";
import { LocalizedText as Text, localize, useMobileLocale } from "./i18n";

const categories: Array<[HouseholdCostCategory, string]> = [
  ["housing", "Wohnen"], ["energy", "Energie"], ["insurance", "Versicherung"],
  ["subscriptions", "Verträge & Abos"], ["mobility", "Mobilität"],
  ["financing", "Finanzierung"], ["leisure", "Freizeit"], ["other", "Sonstiges"],
];
const frequencies: Array<[HouseholdCostFrequency, string]> = [
  ["weekly", "Wöchentlich"], ["monthly", "Monatlich"], ["quarterly", "Quartalsweise"],
  ["half-yearly", "Halbjährlich"], ["yearly", "Jährlich"],
];
const suggestions: Array<[HouseholdCostCategory, string, HouseholdCostFrequency]> = [
  ["housing", "Miete oder Kreditrate", "monthly"],
  ["energy", "Strom oder Heizung", "monthly"],
  ["insurance", "Versicherung", "yearly"],
  ["mobility", "Auto oder Öffis", "monthly"],
  ["subscriptions", "Internet oder Abo", "monthly"],
  ["financing", "Kreditrate", "monthly"],
];

function parseAmount(value: string) {
  return Number(value.trim().replace(",", "."));
}

function displayDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

function isoDate(display: string) {
  if (!display) return "";
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return display;
  return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

function maskDate(text: string, previous: string) {
  let digits = text.replace(/\D/g, "").slice(0, 8);
  if (text.length < previous.length && digits === previous.replace(/\D/g, "")) digits = digits.slice(0, -1);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join(".");
}

function suggestedDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function nextMonthDate(day: number | "last") {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = new Date(year, month + 1, day === "last" ? 0 : day);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function DateField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <View>
    <FormInput label={label} value={value} onChangeText={(text) => onChangeText(maskDate(text, value))} placeholder="TT.MM.JJJJ" keyboardType="number-pad" maxLength={10} />
    <View style={styles.dateSuggestions}>
      <Pressable onPress={() => { onChangeText(suggestedDate(0)); Keyboard.dismiss(); }} style={styles.dateSuggestion}><Text style={styles.dateSuggestionText}>Heute</Text></Pressable>
      <Pressable onPress={() => { onChangeText(suggestedDate(30)); Keyboard.dismiss(); }} style={styles.dateSuggestion}><Text style={styles.dateSuggestionText}>In 30 Tagen</Text></Pressable>
      <Pressable onPress={() => { onChangeText(nextMonthDate(1)); Keyboard.dismiss(); }} style={styles.dateSuggestion}><Text style={styles.dateSuggestionText}>Nächster 1.</Text></Pressable>
      <Pressable onPress={() => { onChangeText(nextMonthDate(15)); Keyboard.dismiss(); }} style={styles.dateSuggestion}><Text style={styles.dateSuggestionText}>Nächster 15.</Text></Pressable>
      <Pressable onPress={() => { onChangeText(nextMonthDate("last")); Keyboard.dismiss(); }} style={styles.dateSuggestion}><Text style={styles.dateSuggestionText}>Monatsende</Text></Pressable>
      {value !== "" && <Pressable onPress={() => onChangeText("")} style={styles.dateSuggestion}><Text style={styles.dateSuggestionText}>Löschen</Text></Pressable>}
    </View>
  </View>;
}

function Choice<T extends string>({ options, value, onChange }: {
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return <View style={styles.choices}>{options.map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: value === key }} onPress={() => onChange(key)} style={[styles.choice, value === key && styles.choiceActive]}><Text style={[styles.choiceText, value === key && styles.choiceTextActive]}>{label}</Text></Pressable>)}</View>;
}

export default function CostsScreen({ profile, costs, tiles, tileId, tileTitle, initialAction = "none", onSaveCost, onDeleteCost, onSaveIncome }: {
  profile: MobileProfile;
  costs: HouseholdCost[];
  tiles: MobileTile[];
  tileId: string;
  tileTitle: string;
  initialAction?: "none" | "income" | "cost";
  onSaveCost: (cost: HouseholdCost) => Promise<void>;
  onDeleteCost: (id: string) => Promise<void>;
  onSaveIncome: (amount: number, frequency: "monthly" | "yearly") => Promise<void>;
}) {
  const locale = useMobileLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [formOpen, setFormOpen] = useState(initialAction === "cost");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<HouseholdCostCategory>("housing");
  const [frequency, setFrequency] = useState<HouseholdCostFrequency>("monthly");
  const [dueDate, setDueDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [income, setIncome] = useState(profile.incomeAmount ? String(profile.incomeAmount) : "");
  const [incomeFrequency, setIncomeFrequency] = useState<"monthly" | "yearly">(profile.incomeFrequency ?? "monthly");
  const money = new Intl.NumberFormat(locale === "de" ? "de-AT" : "en-GB", { style: "currency", currency: profile.currency ?? "EUR" });
  const visibleCosts = costsForTile(costs, tileId);
  const summary = summarizeHouseholdCosts(visibleCosts);

  function openNew(suggestion?: [HouseholdCostCategory, string, HouseholdCostFrequency]) {
    setEditingId(null);
    setMoreOpen(false);
    setName(suggestion?.[1] ?? "");
    setAmount("");
    setCategory(suggestion?.[0] ?? "housing");
    setFrequency(suggestion?.[2] ?? "monthly");
    setDueDate("");
    setDeadline("");
    setFormOpen(true);
  }

  function edit(cost: HouseholdCost) {
    setEditingId(cost.id);
    setMoreOpen(true);
    setName(cost.name);
    setAmount(String(cost.amount));
    setCategory(cost.category);
    setFrequency(cost.frequency);
    setDueDate(displayDate(cost.nextDueDate));
    setDeadline(displayDate(cost.cancellationDeadline ?? ""));
    setFormOpen(true);
  }

  async function save() {
    const cost = createHouseholdCost({ id: editingId ?? undefined, name, amount: parseAmount(amount), category, frequency, tileId: destinationTileId(costs, editingId, tileId), nextDueDate: isoDate(dueDate), cancellationDeadline: isoDate(deadline) });
    if (!cost) {
      Alert.alert((locale === "de" ? "Angaben prüfen" : "Check your entries"), (locale === "de" ? "Gib eine Bezeichnung, einen Betrag über 0 und gültige Termine im Format TT.MM.JJJJ ein." : "Enter a name, a positive amount and valid dates in DD.MM.YYYY format."));
      return;
    }
    await onSaveCost(cost);
    setFeedback(locale === "de" ? "Kosten gespeichert." : "Cost saved.");
    Keyboard.dismiss();
    setFormOpen(false);
    setEditingId(null);
  }

  function confirmDelete(cost: HouseholdCost) {
    Alert.alert((locale === "de" ? "Kosten entfernen?" : "Remove cost?"), cost.name, [
      { text: locale === "de" ? "Abbrechen" : "Cancel", style: "cancel" },
      { text: locale === "de" ? "Entfernen" : "Remove", style: "destructive", onPress: () => { void onDeleteCost(cost.id); } },
    ]);
  }

  async function saveIncome() {
    const parsed = income.trim() === "" ? 0 : parseAmount(income);
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert((locale === "de" ? "Betrag prüfen" : "Check amount"), (locale === "de" ? "Gib einen Betrag ab 0 ein." : "Enter an amount of 0 or more."));
      return;
    }
    await onSaveIncome(parsed, incomeFrequency);
    Keyboard.dismiss();
    Alert.alert((locale === "de" ? "Gespeichert" : "Saved"), (locale === "de" ? "Dein Einkommen wurde aktualisiert." : "Your income was updated."));
  }

  return <>
    <Text style={styles.eyebrow}>HAUSHALTSKOSTEN</Text>
    <Text style={styles.title}>{tileId === "default-costs" ? localize(locale, "Was kostet dein Zuhause?") : tileTitle}</Text>
    <Text style={styles.explanation}>{localize(locale, tileId === "default-costs" ? "Alle regelmäßigen Kosten aus deinen Kacheln an einem Ort. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um." : "Die regelmäßigen Kosten in dieser Kachel. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um.")}</Text>
    <View style={styles.metrics}>
      <View style={styles.metric}><Text style={styles.label}>PRO MONAT</Text><Text style={styles.value}>{money.format(summary.monthlyTotal)}</Text></View>
      <View style={styles.metric}><Text style={styles.label}>PRO JAHR</Text><Text style={styles.value}>{money.format(summary.annualTotal)}</Text></View>
    </View>

    {tileId === "default-costs" && !formOpen && <View style={styles.panel}>
      <Text style={styles.panelTitle}>Nettoeinkommen</Text>
      <Text style={styles.help}>Das Budget zieht nur deine erfassten regelmäßigen Kosten ab; variable Ausgaben bleiben außen vor.</Text>
      <FormInput label="Nettoeinkommen" value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder="0,00" />
      <Choice options={[["monthly", "Monatlich"], ["yearly", "Jährlich"]]} value={incomeFrequency} onChange={setIncomeFrequency} />
      <Pressable onPress={() => { void saveIncome(); }} style={styles.secondary}><Text style={styles.secondaryText}>Einkommen speichern</Text></Pressable>
    </View>}

    {visibleCosts.length < 3 && !formOpen && <View style={styles.panel}>
      <Text style={styles.panelTitle}>{locale === "de" ? `Schnell starten · ${visibleCosts.length} von 3` : `Quick start · ${visibleCosts.length} of 3`}</Text>
      <Text style={styles.help}>Beginne mit Wohnen, Energie oder einem Vertrag. Anbieterangaben sind nicht nötig.</Text>
      <View style={styles.choices}>{suggestions.map((suggestion) => <Pressable key={suggestion[0]} onPress={() => openNew(suggestion)} style={styles.choice}><Text style={styles.choiceText}>{suggestion[1]}</Text></Pressable>)}</View>
    </View>}

    {formOpen ? <View style={styles.panel}>
      <Text style={styles.panelTitle}>{editingId ? "Kosten bearbeiten" : "Neue Kosten"}</Text>
      <FormInput label="Bezeichnung" value={name} onChangeText={setName} onBlur={() => { if (!editingId && category === "housing") { const text = name.toLowerCase(); if (/internet|abo|stream|telefon/.test(text)) setCategory("subscriptions"); else if (/strom|heiz|electric|gas/.test(text)) setCategory("energy"); else if (/versicherung|insurance/.test(text)) setCategory("insurance"); } }} placeholder="z. B. Internet" />
      <FormInput label="Betrag" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
      <Text style={styles.label}>WIE OFT?</Text><Choice options={frequencies} value={frequency} onChange={setFrequency} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen(!moreOpen)} style={styles.secondary}><Text style={styles.secondaryText}>{locale === "de" ? "Weitere Angaben: Kategorie und Termine" : "More details: category and dates"}</Text></Pressable>
      {moreOpen && <>
      <Text style={styles.label}>KATEGORIE</Text><Choice options={categories} value={category} onChange={setCategory} />
      <DateField label="Nächste Zahlung (optional)" value={dueDate} onChangeText={setDueDate} />
      <DateField label="Kündigungsfrist (optional)" value={deadline} onChangeText={setDeadline} />
      <Text style={styles.help}>Mit Zahlungstermin können wir den nächsten Monat genau berechnen. Ohne Termin fließt der Posten nur in den Monatsdurchschnitt ein.</Text>
      </>}
      <Pressable onPress={() => { void save(); }} style={styles.primary}><Text style={styles.primaryText}>{editingId ? "Aktualisieren" : "Speichern"}</Text></Pressable>
      <Pressable onPress={() => setFormOpen(false)} style={styles.secondary}><Text style={styles.secondaryText}>Abbrechen</Text></Pressable>
    </View> : <Pressable onPress={() => openNew()} style={styles.primary}><Text style={styles.primaryText}>Kosten hinzufügen</Text></Pressable>}

    {visibleCosts.length > 0 && !formOpen && <>
      <Text style={styles.sectionTitle}>Kosten nach Kategorie</Text>
      <View style={styles.categoryGrid}>{summary.categoryTotals.filter((item) => item.entryCount > 0).map((item) => <View key={item.category} style={styles.categoryCard}>
        <Text style={styles.categoryLabel}>{categories.find(([key]) => key === item.category)?.[1]}</Text>
        <Text style={styles.categoryAmount}>{money.format(item.monthlyTotal)} / {locale === "de" ? "Monat" : "month"}</Text>
        <Text style={styles.costDetail}>{item.entryCount} {locale === "de" ? item.entryCount === 1 ? "Eintrag" : "Einträge" : item.entryCount === 1 ? "entry" : "entries"}</Text>
      </View>)}</View>
    </>}
    {!!feedback && <Text accessibilityRole="alert" style={styles.help}>{feedback}</Text>}
    <Text style={styles.sectionTitle}>Angelegte Kosten</Text>
    {visibleCosts.length === 0 ? <Text style={styles.help}>Noch keine Kosten angelegt.</Text> : visibleCosts.map((cost) => <View key={cost.id} style={styles.costRow}>
      <Text style={styles.costName}>{cost.name}</Text>
      {tileId === "default-costs" && cost.tileId && cost.tileId !== "default-costs" && <Text style={styles.costArea}>{tiles.find((tile) => tile.id === cost.tileId)?.title ?? "Eigene Kachel"}</Text>}
      <Text style={styles.costDetail}>{categories.find(([key]) => key === cost.category)?.[1]} · {frequencies.find(([key]) => key === cost.frequency)?.[1]}</Text>
      <Text style={styles.costDetail}>{money.format(cost.amount)} {locale === "de" ? "je Zahlung" : "per payment"} · {money.format(monthlyCost(cost.amount, cost.frequency))} / {locale === "de" ? "Monat" : "month"} · {money.format(annualCost(cost.amount, cost.frequency))} / {locale === "de" ? "Jahr" : "year"}</Text>
      <Text style={styles.costDetail}>{cost.nextDueDate ? `${locale === "de" ? "Nächste Zahlung" : "Next payment"}: ${displayDate(cost.nextDueDate)}` : "Ohne Zahlungstermin"}</Text>
      {cost.cancellationDeadline && <Text style={styles.costDetail}>{locale === "de" ? "Kündigungsfrist" : "Cancellation deadline"}: {displayDate(cost.cancellationDeadline)}</Text>}
      <View style={styles.actions}><Pressable onPress={() => edit(cost)} style={styles.choice}><Text style={styles.choiceText}>Bearbeiten</Text></Pressable>{cost.cancellationDeadline && <Pressable onPress={() => void shareDeadline(cost.name, cost.cancellationDeadline!).catch(() => Alert.alert(locale === "de" ? "Kalender nicht verfügbar" : "Calendar unavailable", locale === "de" ? "Die Frist konnte nicht geteilt werden." : "Could not share this deadline."))} style={styles.choice}><Text style={styles.choiceText}>{locale === "de" ? "Frist vormerken" : "Add to calendar"}</Text></Pressable>}<Pressable onPress={() => confirmDelete(cost)} style={styles.choice}><Text style={styles.deleteText}>Entfernen</Text></Pressable></View>
    </View>)}
  </>;
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, color: "#087a45" },
  title: { marginTop: 8, marginBottom: 12, fontSize: 29, fontWeight: "900", letterSpacing: -1, color: "#17211f" },
  explanation: { fontSize: 13, lineHeight: 20, color: "#65716d" },
  metrics: { flexDirection: "row", gap: 10, marginTop: 18, padding: 10, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 22, backgroundColor: "#f4f6f2" },
  metric: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 12 },
  value: { marginTop: 8, fontSize: 18, fontWeight: "900", letterSpacing: -0.4, color: "#17211f" },
  label: { marginTop: 12, fontSize: 11, fontWeight: "800", color: "#52605b" },
  panel: { marginTop: 18, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 22, backgroundColor: "#f6f6f0", padding: 16, gap: 12 },
  panelTitle: { fontSize: 17, fontWeight: "900", color: "#17211f" },
  help: { fontSize: 12, lineHeight: 18, color: "#65716d" },
  dateSuggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  dateSuggestion: { borderRadius: 16, backgroundColor: "#eef1ed", paddingHorizontal: 11, paddingVertical: 7 },
  dateSuggestionText: { fontSize: 12, fontWeight: "700", color: "#087a45" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 5 },
  choice: { borderRadius: 20, backgroundColor: "#ddf8e9", paddingHorizontal: 12, paddingVertical: 8 },
  choiceActive: { backgroundColor: "#087a45" },
  choiceText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  choiceTextActive: { color: "#ffffff" },
  primary: { minHeight: 48, marginTop: 12, borderRadius: 24, backgroundColor: "#087a45", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { fontSize: 14, fontWeight: "900", color: "#ffffff" },
  secondary: { minHeight: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  sectionTitle: { marginTop: 28, fontSize: 20, fontWeight: "900", color: "#07111f" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  categoryCard: { width: "48%", minHeight: 88, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 12 },
  categoryLabel: { fontSize: 12, fontWeight: "700", color: "#52605b" },
  categoryAmount: { marginTop: 7, fontSize: 14, fontWeight: "900", color: "#17211f" },
  costRow: { marginTop: 10, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 14 },
  costName: { fontSize: 14, fontWeight: "900", color: "#17211f" },
  costArea: { marginTop: 5, fontSize: 11, fontWeight: "800", color: "#087a45" },
  costDetail: { marginTop: 5, fontSize: 12, lineHeight: 18, color: "#65716d" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  deleteText: { fontSize: 12, fontWeight: "800", color: "#b42318" },
});
