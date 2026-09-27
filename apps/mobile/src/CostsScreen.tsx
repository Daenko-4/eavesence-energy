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
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { MobileProfile } from "./storage";

const money = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
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
  ["subscriptions", "Internet oder Abo", "monthly"],
  ["insurance", "Versicherung", "yearly"],
];

function parseAmount(value: string) {
  return Number(value.trim().replace(",", "."));
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "decimal-pad" | "number-pad";
}) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} style={styles.input} placeholderTextColor="#8a9591" /></View>;
}

function Choice<T extends string>({ options, value, onChange }: {
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return <View style={styles.choices}>{options.map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: value === key }} onPress={() => onChange(key)} style={[styles.choice, value === key && styles.choiceActive]}><Text style={[styles.choiceText, value === key && styles.choiceTextActive]}>{label}</Text></Pressable>)}</View>;
}

export default function CostsScreen({ profile, costs, onSaveCost, onDeleteCost, onSaveIncome }: {
  profile: MobileProfile;
  costs: HouseholdCost[];
  onSaveCost: (cost: HouseholdCost) => Promise<void>;
  onDeleteCost: (id: string) => Promise<void>;
  onSaveIncome: (amount: number, frequency: "monthly" | "yearly") => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<HouseholdCostCategory>("housing");
  const [frequency, setFrequency] = useState<HouseholdCostFrequency>("monthly");
  const [dueDate, setDueDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [income, setIncome] = useState(profile.incomeAmount ? String(profile.incomeAmount) : "");
  const [incomeFrequency, setIncomeFrequency] = useState<"monthly" | "yearly">(profile.incomeFrequency ?? "monthly");
  const summary = summarizeHouseholdCosts(costs);

  function openNew(suggestion?: [HouseholdCostCategory, string, HouseholdCostFrequency]) {
    setEditingId(null);
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
    setName(cost.name);
    setAmount(String(cost.amount));
    setCategory(cost.category);
    setFrequency(cost.frequency);
    setDueDate(cost.nextDueDate);
    setDeadline(cost.cancellationDeadline ?? "");
    setFormOpen(true);
  }

  async function save() {
    const cost = createHouseholdCost({ id: editingId ?? undefined, name, amount: parseAmount(amount), category, frequency, nextDueDate: dueDate.trim(), cancellationDeadline: deadline.trim() });
    if (!cost) {
      Alert.alert("Angaben prüfen", "Gib eine Bezeichnung, einen Betrag über 0 und gültige Termine im Format JJJJ-MM-TT ein.");
      return;
    }
    await onSaveCost(cost);
    setFormOpen(false);
    setEditingId(null);
  }

  function confirmDelete(cost: HouseholdCost) {
    Alert.alert("Kosten entfernen?", cost.name, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => { void onDeleteCost(cost.id); } },
    ]);
  }

  async function saveIncome() {
    const parsed = income.trim() === "" ? 0 : parseAmount(income);
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert("Betrag prüfen", "Gib einen Betrag ab 0 ein.");
      return;
    }
    await onSaveIncome(parsed, incomeFrequency);
    Alert.alert("Gespeichert", "Dein Einkommen wurde aktualisiert.");
  }

  return <>
    <Text style={styles.eyebrow}>HAUSHALTSKOSTEN</Text>
    <Text style={styles.title}>Was kostet dein Zuhause?</Text>
    <Text style={styles.explanation}>Regelmäßige Kosten einmal erfassen. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um.</Text>
    <View style={styles.metrics}>
      <View style={styles.metric}><Text style={styles.label}>PRO MONAT</Text><Text style={styles.value}>{money.format(summary.monthlyTotal)}</Text></View>
      <View style={styles.metric}><Text style={styles.label}>PRO JAHR</Text><Text style={styles.value}>{money.format(summary.annualTotal)}</Text></View>
    </View>

    {costs.length < 3 && !formOpen && <View style={styles.panel}>
      <Text style={styles.panelTitle}>Schnell starten · {costs.length} von 3</Text>
      <Text style={styles.help}>Beginne mit Wohnen, Energie oder einem Vertrag. Anbieterangaben sind nicht nötig.</Text>
      <View style={styles.choices}>{suggestions.map((suggestion) => <Pressable key={suggestion[0]} onPress={() => openNew(suggestion)} style={styles.choice}><Text style={styles.choiceText}>{suggestion[1]}</Text></Pressable>)}</View>
    </View>}

    {formOpen ? <View style={styles.panel}>
      <Text style={styles.panelTitle}>{editingId ? "Kosten bearbeiten" : "Neue Kosten"}</Text>
      <Field label="Bezeichnung" value={name} onChangeText={setName} placeholder="z. B. Internet" />
      <Field label="Betrag" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
      <Text style={styles.label}>KATEGORIE</Text><Choice options={categories} value={category} onChange={setCategory} />
      <Text style={styles.label}>WIE OFT?</Text><Choice options={frequencies} value={frequency} onChange={setFrequency} />
      <Field label="Nächste Zahlung (optional)" value={dueDate} onChangeText={setDueDate} placeholder="JJJJ-MM-TT" />
      <Field label="Kündigungsfrist (optional, selbst eintragen)" value={deadline} onChangeText={setDeadline} placeholder="JJJJ-MM-TT" />
      <Text style={styles.help}>Ohne Zahlungstermin bleibt der Posten im Monatsdurchschnitt, fehlt aber in der Vorschau.</Text>
      <Pressable onPress={() => { void save(); }} style={styles.primary}><Text style={styles.primaryText}>{editingId ? "Aktualisieren" : "Speichern"}</Text></Pressable>
      <Pressable onPress={() => setFormOpen(false)} style={styles.secondary}><Text style={styles.secondaryText}>Abbrechen</Text></Pressable>
    </View> : <Pressable onPress={() => openNew()} style={styles.primary}><Text style={styles.primaryText}>Kosten hinzufügen</Text></Pressable>}

    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Nettoeinkommen</Text>
      <Text style={styles.help}>Das Budget zieht nur deine erfassten regelmäßigen Kosten ab; variable Ausgaben bleiben außen vor.</Text>
      <Field label="Nettoeinkommen" value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder="0,00" />
      <Choice options={[["monthly", "Monatlich"], ["yearly", "Jährlich"]]} value={incomeFrequency} onChange={setIncomeFrequency} />
      <Pressable onPress={() => { void saveIncome(); }} style={styles.secondary}><Text style={styles.secondaryText}>Einkommen speichern</Text></Pressable>
    </View>

    <Text style={styles.sectionTitle}>Angelegte Kosten</Text>
    {costs.length === 0 ? <Text style={styles.help}>Noch keine Kosten angelegt.</Text> : costs.map((cost) => <View key={cost.id} style={styles.costRow}>
      <Text style={styles.costName}>{cost.name}</Text>
      <Text style={styles.costDetail}>{categories.find(([key]) => key === cost.category)?.[1]} · {frequencies.find(([key]) => key === cost.frequency)?.[1]}</Text>
      <Text style={styles.costDetail}>{money.format(cost.amount)} je Zahlung · {money.format(monthlyCost(cost.amount, cost.frequency))} pro Monat · {money.format(annualCost(cost.amount, cost.frequency))} pro Jahr</Text>
      <Text style={styles.costDetail}>{cost.nextDueDate ? `Nächste Zahlung: ${cost.nextDueDate}` : "Ohne Zahlungstermin"}</Text>
      <View style={styles.actions}><Pressable onPress={() => edit(cost)} style={styles.choice}><Text style={styles.choiceText}>Bearbeiten</Text></Pressable><Pressable onPress={() => confirmDelete(cost)} style={styles.choice}><Text style={styles.deleteText}>Entfernen</Text></Pressable></View>
    </View>)}
  </>;
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, color: "#087a45" },
  title: { marginTop: 8, marginBottom: 12, fontSize: 30, fontWeight: "900", color: "#07111f" },
  explanation: { fontSize: 13, lineHeight: 20, color: "#52605b" },
  metrics: { flexDirection: "row", gap: 10, marginTop: 18 },
  metric: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: "#b8efcc", borderRadius: 16, backgroundColor: "#eefbf3", padding: 14 },
  value: { marginTop: 8, fontSize: 18, fontWeight: "900", color: "#07111f" },
  label: { marginTop: 12, fontSize: 11, fontWeight: "800", color: "#52605b" },
  panel: { marginTop: 18, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 18, backgroundColor: "#ffffff", padding: 16, gap: 10 },
  panelTitle: { fontSize: 16, fontWeight: "900", color: "#07111f" },
  help: { fontSize: 12, lineHeight: 18, color: "#64748b" },
  field: { gap: 6, marginTop: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 12, backgroundColor: "#fff", paddingHorizontal: 14, fontSize: 16, color: "#07111f" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 5 },
  choice: { borderRadius: 20, backgroundColor: "#eef1ed", paddingHorizontal: 12, paddingVertical: 8 },
  choiceActive: { backgroundColor: "#087a45" },
  choiceText: { fontSize: 12, fontWeight: "800", color: "#52605b" },
  choiceTextActive: { color: "#ffffff" },
  primary: { minHeight: 48, marginTop: 12, borderRadius: 24, backgroundColor: "#087a45", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { fontSize: 14, fontWeight: "900", color: "#ffffff" },
  secondary: { minHeight: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  sectionTitle: { marginTop: 28, fontSize: 20, fontWeight: "900", color: "#07111f" },
  costRow: { marginTop: 10, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 14, backgroundColor: "#ffffff", padding: 14 },
  costName: { fontSize: 14, fontWeight: "900", color: "#07111f" },
  costDetail: { marginTop: 5, fontSize: 12, lineHeight: 18, color: "#64748b" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  deleteText: { fontSize: 12, fontWeight: "800", color: "#b42318" },
});
