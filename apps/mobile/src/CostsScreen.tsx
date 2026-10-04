import { incomeExtraDrafts, incomeExtrasFromDraft, parseIncomeAmount, type IncomeExtra } from "@eavesence/core/income";
import { IncomeExtrasSummary } from "./IncomeExtrasSummary";
import { IncomeExtrasEditor } from "./IncomeExtrasEditor";
import {
  createHouseholdCost,
  monthlyCost,
  summarizeHouseholdCosts,
  type HouseholdCost,
  type HouseholdCostCategory,
  type HouseholdCostFrequency,
} from "@eavesence/core/householdCosts";
import { homeRelease } from "../../../src/lib/homeRelease";
import { useEffect, useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, View } from "react-native";

import { costsForTile, destinationTileId } from "./costTiles";
import type { MobileProfile } from "./storage";
import type { MobileTile } from "./tiles";
import { FormSection, FormSubmitButton, FormActionButton } from "./FormSection";
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

function inferSetupCategory(name: string): HouseholdCostCategory {
  if (/internet|abo|stream|telefon|phone|subscription/i.test(name)) return "subscriptions";
  if (/strom|heiz|electric|gas|energy/i.test(name)) return "energy";
  if (/versicherung|insurance/i.test(name)) return "insurance";
  if (/miet|rent|wohn|mortgage/i.test(name)) return "housing";
  return "other";
}

function nextMonthDate(day: number | "last") {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = new Date(year, month + 1, day === "last" ? 0 : day);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function DateField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const locale = useMobileLocale();
  return <View>
    <FormInput label={label} value={value} onChangeText={(text) => onChangeText(maskDate(text, value))} placeholder={locale === "de" ? "TT.MM.JJJJ" : "DD.MM.YYYY"} keyboardType="number-pad" maxLength={10} />
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

export default function CostsScreen({ profile, costs, tiles, tileId, tileTitle, initialAction = "none", initialCostId, setup, onSkip, onBack, onSaveCost, onDeleteCost, onSaveIncome, onEditingChange, onOverview }: {
  onEditingChange?: (editing: boolean) => void;
  onOverview?: () => void;
  setup?: "income" | "cost";
  onSkip?: () => Promise<void>;
  onBack?: () => Promise<void>;
  profile: MobileProfile;
  costs: HouseholdCost[];
  tiles: MobileTile[];
  tileId: string;
  tileTitle: string;
  initialCostId?: string;
  initialAction?: "none" | "income" | "cost";
  onSaveCost: (cost: HouseholdCost) => Promise<void>;
  onDeleteCost: (id: string) => Promise<void>;
  onSaveIncome: (amount: number, frequency: "monthly" | "yearly", extras: IncomeExtra[]) => Promise<void>;
}) {
  const locale = useMobileLocale();
  const initialCost=costs.find(c=>c.id===initialCostId);
  const [editingId, setEditingId] = useState<string | null>(initialCost?.id??null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(initialAction === "income");
  const [feedback, setFeedback] = useState("");
  const [formOpen, setFormOpen] = useState(initialAction === "cost"||!!initialCost);
  useEffect(() => { onEditingChange?.(formOpen || incomeOpen || !!setup); }, [formOpen, incomeOpen, setup, onEditingChange]);
  const [name, setName] = useState(initialCost?.name??"");
  const [amount, setAmount] = useState(initialCost?String(initialCost.amount):"");
  const [category, setCategory] = useState<HouseholdCostCategory>(initialCost?.category??"housing");
  const [frequency, setFrequency] = useState<HouseholdCostFrequency>(initialCost?.frequency??"monthly");
  const [dueDate, setDueDate] = useState(displayDate(initialCost?.nextDueDate??""));
  const [deadline, setDeadline] = useState(displayDate(initialCost?.cancellationDeadline??""));
  const [income, setIncome] = useState(profile.incomeAmount ? String(profile.incomeAmount) : "");
  const [incomeExtras, setIncomeExtras] = useState(() => incomeExtraDrafts(profile.incomeExtras));
  const [incomeExtrasOpen, setIncomeExtrasOpen] = useState(false);
  const [incomeFrequency, setIncomeFrequency] = useState<"monthly" | "yearly">(profile.incomeFrequency ?? "monthly");
  const money = new Intl.NumberFormat(locale === "de" ? "de-AT" : "en-GB", { style: "currency", currency: profile.currency ?? "EUR" });
  const visibleCosts = costsForTile(costs, tileId);
  const summary = summarizeHouseholdCosts(visibleCosts);

  function openNew(suggestion?: [HouseholdCostCategory, string, HouseholdCostFrequency]) {
    setEditingId(null);
    setMoreOpen(false);
    setName(suggestion ? localize(locale, suggestion[1]) : "");
    setAmount("");
    setCategory(suggestion?.[0] ?? "housing");
    setFrequency(suggestion?.[2] ?? "monthly");
    setDueDate("");
    setDeadline("");
    setFormOpen(true);
  }

  function edit(cost: HouseholdCost) {
    setEditingId(cost.id);
    setMoreOpen(false);
    setName(cost.name);
    setAmount(String(cost.amount));
    setCategory(cost.category);
    setFrequency(cost.frequency);
    setDueDate(displayDate(cost.nextDueDate));
    setDeadline(displayDate(cost.cancellationDeadline ?? ""));
    setFormOpen(true);
  }

  async function save() {
    const cost = createHouseholdCost({ id: editingId ?? undefined, name, amount: parseIncomeAmount(amount, locale), category: setup ? inferSetupCategory(name) : category, frequency, tileId: destinationTileId(costs, editingId, tileId), nextDueDate: isoDate(dueDate), cancellationDeadline: isoDate(deadline) });
    if (!cost) {
      Alert.alert((locale === "de" ? "Angaben prüfen" : "Check your entries"), (locale === "de" ? "Gib eine Bezeichnung, einen Betrag über 0 und gültige Termine im Format TT.MM.JJJJ ein." : "Enter a name, a positive amount and valid dates in DD.MM.YYYY format."));
      return;
    }
    await onSaveCost(cost);
    if (setup) { Keyboard.dismiss(); return; }
    setFeedback(locale === "de" ? "Kosten gespeichert." : "Cost saved.");
    Keyboard.dismiss();
    setFormOpen(false);
    setEditingId(null);
  }

  function confirmDelete(cost: HouseholdCost) {
    Alert.alert((locale === "de" ? "Kosten entfernen?" : "Remove cost?"), cost.name, [
      { text: locale === "de" ? "Abbrechen" : "Cancel", style: "cancel" },
      { text: locale === "de" ? "Entfernen" : "Remove", style: "destructive", onPress: () => { void onDeleteCost(cost.id).catch(() => Alert.alert(locale === "de" ? "Speichern fehlgeschlagen" : "Could not save", locale === "de" ? "Bitte versuche es erneut." : "Please try again.")); } },
    ]);
  }

  async function saveIncome() {
    if (setup === "income" && !income.trim()) {
      Alert.alert(locale === "de" ? "Nettoeinkommen eintragen" : "Enter net income", locale === "de" ? "Trage deinen Nettobetrag ein. Wenn du derzeit kein Einkommen hast, gib 0 ein." : "Enter your net amount. If you currently have no income, enter 0.");
      return;
    }
    if (profile.incomeFrequency === "yearly" && incomeFrequency === "monthly" && !income.trim()) {
      Alert.alert(locale === "de" ? "Monatsnetto ergänzen" : "Add monthly net income", locale === "de" ? "Trage den tatsächlichen Monatsbetrag ein. Wir leiten ihn nicht aus dem Jahresnetto ab." : "Enter your actual monthly amount. We do not infer it from annual income.");
      return;
    }
    const parsed = income.trim() === "" ? 0 : parseIncomeAmount(income, locale);
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert((locale === "de" ? "Betrag prüfen" : "Check amount"), (locale === "de" ? "Gib einen Betrag ab 0 ein." : "Enter an amount of 0 or more."));
      return;
    }
    const extras = incomeFrequency === "yearly" ? profile.incomeExtras ?? [] : incomeExtrasFromDraft(incomeExtras, locale);
    if (!extras) {
      setIncomeExtrasOpen(true);
      Alert.alert(locale === "de" ? "Sonderzahlungen prüfen" : "Check extra payments", locale === "de" ? "Prüfe Nettobetrag, Monat und gegebenenfalls Jahr." : "Check the net amount, month and year (if applicable).");
      return;
    }
    await onSaveIncome(parsed, incomeFrequency, extras);
    if (setup) { Keyboard.dismiss(); return; }
    Keyboard.dismiss();
    setIncomeOpen(false);
    setFeedback(locale === "de" ? "Einkommen gespeichert." : "Income saved.");
  }

  if (setup === "income") return <FormSection style={styles.panel} onSave={saveIncome} saveLabel={locale === "de" ? "Einkommen speichern & weiter" : "Save income & continue"}>
    <Text style={styles.title}>{locale === "de" ? "1 · Nettoeinkommen eintragen" : "1 · Add net income"}</Text>
    <Text style={styles.help}>{locale === "de" ? "Wie viel kommt nach Steuern auf dein Konto? Ein Betrag reicht für den Start. Du kannst ihn später ändern." : "How much reaches your account after tax? One amount is enough to start. You can change it later."}</Text>
    <FormInput label={incomeFrequency === "monthly" ? locale === "de" ? "Reguläres Monatsnetto (ohne Extras)" : "Regular monthly net income (excluding extras)" : locale === "de" ? "Jahresnetto insgesamt" : "Total annual net income"} value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder={locale === "de" ? "z. B. 2400" : "e.g. 2400"} />
    {incomeFrequency === "yearly" && <Choice options={[["monthly", locale === "de" ? "Reguläres Monatsnetto" : "Regular monthly net"], ["yearly", locale === "de" ? "Jahresnetto · Durchschnitt" : "Annual net · average"]]} value={incomeFrequency} onChange={next => { if (next === "monthly") setIncome(""); setIncomeFrequency(next); }} />}
    {profile.incomeFrequency === "yearly" && <IncomeExtrasSummary profile={profile} locale={locale} currency={profile.currency ?? "EUR"} />}
    <Text style={styles.help}>{locale === "de" ? "Ohne 13./14. Gehalt oder Bonus. Sonderzahlungen kannst du später ergänzen. Kein Einkommen? Trage 0 ein." : "Exclude extra salaries or bonuses. Add them later. No income? Enter 0."}</Text>
    <FormSubmitButton label={locale === "de" ? "Einkommen speichern & weiter" : "Save income & continue"} style={styles.primary} textStyle={styles.primaryText} />
    {onSkip && <FormActionButton label={locale === "de" ? "Einkommen später ergänzen" : "Add income later"} onPress={onSkip} style={styles.secondary} textStyle={styles.secondaryText} />}
  </FormSection>;
  if (setup === "cost") return <FormSection style={styles.panel} onSave={save} saveLabel={locale === "de" ? "Kosten speichern & weiter" : "Save cost & continue"}>
    <Text style={styles.title}>{locale === "de" ? "2 · Erste Kosten hinzufügen" : "2 · Add your first cost"}</Text>
    <Text style={styles.help}>{locale === "de" ? "Beginne mit einer regelmäßigen Ausgabe, etwa Miete oder Internet. Weitere Kosten ergänzt du danach in deiner Übersicht." : "Start with one recurring expense, such as rent or internet. Add more later in your overview."}</Text>
    <FormInput label="Bezeichnung" value={name} onChangeText={setName} placeholder={locale === "de" ? "z. B. Miete" : "e.g. Rent"} />
    <FormInput label="Betrag" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
    <Text style={styles.label}>WIE OFT?</Text><Choice options={moreOpen ? frequencies : [["monthly", "Monatlich"], ["yearly", "Jährlich"]]} value={frequency} onChange={setFrequency} />
    <Pressable accessibilityRole="button" accessibilityState={{expanded:moreOpen}} style={styles.secondary} onPress={() => setMoreOpen(!moreOpen)}><Text style={styles.secondaryText}>{locale === "de" ? "Optional: Zahlungstermin & weitere Intervalle" : "Optional: payment date & more intervals"}</Text></Pressable>
    {moreOpen && <><DateField label="Nächste Zahlung (optional)" value={dueDate} onChangeText={setDueDate} /><Text style={styles.help}>Mit Zahlungstermin können wir den nächsten Monat genau berechnen. Ohne Termin fließt der Posten nur in den Monatsdurchschnitt ein.</Text></>}
    <FormSubmitButton label={locale === "de" ? "Kosten speichern & weiter" : "Save cost & continue"} style={styles.primary} textStyle={styles.primaryText} />
    {onBack && <FormActionButton label={locale === "de" ? "Zurück zum Einkommen" : "Back to income"} onPress={onBack} style={styles.secondary} textStyle={styles.secondaryText} />}
    {onSkip && <FormActionButton label={locale === "de" ? "Kosten später ergänzen" : "Add costs later"} onPress={onSkip} style={styles.secondary} textStyle={styles.secondaryText} />}
  </FormSection>;

  if (incomeOpen && !formOpen) return <FormSection style={styles.panel} onSave={saveIncome} saveLabel="Einkommen speichern">
    <Text style={styles.title}>{locale === "de" ? "Dein Einkommen" : "Your income"}</Text>
    <Text style={styles.help}>{locale === "de" ? "Trage dein reguläres Monatsnetto ohne Extras ein. Sonderzahlungen kannst du optional ergänzen. Jahresnetto zeigt nur einen Durchschnitt." : "Enter regular monthly net income without extras. Add extra payments optionally. Annual net income shows an average only."}</Text>
    <FormInput label={incomeFrequency === "monthly" ? locale === "de" ? "Reguläres Monatsnetto (ohne Extras)" : "Regular monthly net income (excluding extras)" : locale === "de" ? "Jahresnetto insgesamt" : "Total annual net income"} value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder={locale === "de" ? "z. B. 2400" : "e.g. 2400"} />
    <Choice options={[["monthly", locale === "de" ? "Reguläres Monatsnetto" : "Regular monthly net"], ["yearly", locale === "de" ? "Jahresnetto · Durchschnitt" : "Annual net · average"]]} value={incomeFrequency} onChange={next => { if (incomeFrequency === "yearly" && next === "monthly") setIncome(""); setIncomeFrequency(next); }} />
    {profile.incomeFrequency === "yearly" && <IncomeExtrasSummary profile={profile} locale={locale} currency={profile.currency ?? "EUR"} />}
    <IncomeExtrasEditor frequency={incomeFrequency} drafts={incomeExtras} onChange={setIncomeExtras} open={incomeExtrasOpen} onToggle={() => setIncomeExtrasOpen(!incomeExtrasOpen)} />
    <FormSubmitButton label="Einkommen speichern" style={styles.primary} textStyle={styles.primaryText} />
    <Pressable accessibilityRole="button" onPress={() => setIncomeOpen(false)} style={styles.secondary}><Text style={styles.secondaryText}>{locale === "de" ? "Zur Kostenliste" : "Back to costs"}</Text></Pressable>
  </FormSection>;

  return <>
    <Text style={styles.title}>{tileId === "default-costs" ? localize(locale, "Haushaltskosten") : tileTitle}</Text>
    <Text style={styles.explanation}>{localize(locale, tileId === "default-costs" ? "Alle regelmäßigen Kosten aus deinen Kacheln an einem Ort. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um." : "Die regelmäßigen Kosten in dieser Kachel. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um.")}</Text>
    {!formOpen && <View style={styles.metrics}>
      <View style={styles.metric}><Text style={styles.label}>PRO MONAT</Text><Text style={styles.value}>{money.format(summary.monthlyTotal)}</Text></View>
    </View>}



    {visibleCosts.length === 0 && !formOpen && <View style={styles.panel}>
      <Text style={styles.panelTitle}>{locale === "de" ? "Schnell starten" : "Quick setup"}</Text>
      <Text style={styles.help}>Beginne mit Wohnen, Energie oder einem Vertrag. Anbieterangaben sind nicht nötig.</Text>
      <View style={styles.choices}>{suggestions.map((suggestion) => <Pressable key={suggestion[0]} onPress={() => openNew(suggestion)} style={styles.choice}><Text style={styles.choiceText}>{suggestion[1]}</Text></Pressable>)}</View>
    </View>}

    {formOpen ? <FormSection style={styles.panel} onSave={save} saveLabel={editingId ? "Aktualisieren" : "Speichern"}>
      <Text style={styles.panelTitle}>{editingId ? "Kosten bearbeiten" : "Neue Kosten"}</Text>
      <FormInput label="Bezeichnung" value={name} onChangeText={setName} onBlur={() => { if (!editingId && category === "housing") { const text = name.toLowerCase(); if (/internet|abo|stream|telefon/.test(text)) setCategory("subscriptions"); else if (/strom|heiz|electric|gas/.test(text)) setCategory("energy"); else if (/versicherung|insurance/.test(text)) setCategory("insurance"); } }} placeholder="z. B. Internet" />
      <FormInput label="Betrag" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
      <Text style={styles.label}>WIE OFT?</Text><Choice options={frequencies.filter(([key]) => moreOpen || key === "monthly" || key === "yearly" || key === frequency)} value={frequency} onChange={setFrequency} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen(!moreOpen)} style={styles.secondary}><Text style={styles.secondaryText}>{locale === "de" ? "Weitere Intervalle, Kategorie und Termine" : "More intervals, category and dates"}</Text></Pressable>
      {moreOpen && <>
      <Text style={styles.label}>KATEGORIE</Text><Choice options={categories} value={category} onChange={setCategory} />
      <DateField label="Nächste Zahlung (optional)" value={dueDate} onChangeText={setDueDate} />
      <DateField label="Kündigungsfrist (optional)" value={deadline} onChangeText={setDeadline} />
      <Text style={styles.help}>Mit Zahlungstermin können wir den nächsten Monat genau berechnen. Ohne Termin fließt der Posten nur in den Monatsdurchschnitt ein.</Text>
      </>}
      <FormSubmitButton label={editingId ? "Aktualisieren" : "Speichern"} style={styles.primary} textStyle={styles.primaryText} />
      <Pressable onPress={() => setFormOpen(false)} style={styles.secondary}><Text style={styles.secondaryText}>Abbrechen</Text></Pressable>
    </FormSection> : <Pressable onPress={() => openNew()} style={styles.primary}><Text style={styles.primaryText}>Kosten hinzufügen</Text></Pressable>}

    {homeRelease.detailedInsights && visibleCosts.length > 0 && !formOpen && <>
      <Text style={styles.sectionTitle}>Kosten nach Kategorie</Text>
      <View style={styles.categoryGrid}>{summary.categoryTotals.filter((item) => item.entryCount > 0).map((item) => <View key={item.category} style={styles.categoryCard}>
        <Text style={styles.categoryLabel}>{categories.find(([key]) => key === item.category)?.[1]}</Text>
        <Text style={styles.categoryAmount}>{money.format(item.monthlyTotal)} / {locale === "de" ? "Monat" : "month"}</Text>
        <Text style={styles.costDetail}>{item.entryCount} {locale === "de" ? item.entryCount === 1 ? "Eintrag" : "Einträge" : item.entryCount === 1 ? "entry" : "entries"}</Text>
      </View>)}</View>
    </>}
    {!!feedback && <View style={styles.panel}><Text style={styles.help}>{feedback}</Text>{onOverview && <Pressable accessibilityRole="button" onPress={onOverview} style={styles.secondary}><Text style={styles.secondaryText}>{locale === "de" ? "Monatsübersicht ansehen" : "View monthly overview"}</Text></Pressable>}</View>}
    {!formOpen && <><Text style={styles.sectionTitle}>Angelegte Kosten</Text>
    {visibleCosts.length === 0 ? <Text style={styles.help}>Noch keine Kosten angelegt.</Text> : visibleCosts.map((cost) => <View key={cost.id} style={styles.costRow}>
      <Text style={styles.costName}>{cost.name}</Text>
      {tileId === "default-costs" && cost.tileId && cost.tileId !== "default-costs" && <Text style={styles.costArea}>{tiles.find((tile) => tile.id === cost.tileId)?.title ?? "Eigene Kachel"}</Text>}
      <Text style={styles.costDetail}>{categories.find(([key]) => key === cost.category)?.[1]} · {frequencies.find(([key]) => key === cost.frequency)?.[1]}</Text>
      <Text style={styles.costDetail}>{money.format(cost.amount)} {locale === "de" ? "je Zahlung" : "per payment"}{cost.frequency !== "monthly" ? ` · ${money.format(monthlyCost(cost.amount, cost.frequency))} ${locale === "de" ? "pro Monat im Durchschnitt" : "per month on average"}` : ""}</Text>
      <Text style={styles.costDetail}>{cost.nextDueDate ? `${locale === "de" ? "Nächste Zahlung" : "Next payment"}: ${displayDate(cost.nextDueDate)}` : "Ohne Zahlungstermin"}</Text>
      {cost.cancellationDeadline && <Text style={styles.costDetail}>{locale === "de" ? "Kündigungsfrist" : "Cancellation deadline"}: {displayDate(cost.cancellationDeadline)}</Text>}
      <View style={styles.actions}><Pressable onPress={() => edit(cost)} style={styles.choice}><Text style={styles.choiceText}>Bearbeiten</Text></Pressable>{cost.cancellationDeadline && <Pressable onPress={() => void shareDeadline(cost.name, cost.cancellationDeadline!, locale).catch(() => Alert.alert(locale === "de" ? "Kalender nicht verfügbar" : "Calendar unavailable", locale === "de" ? "Die Frist konnte nicht geteilt werden." : "Could not share this deadline."))} style={styles.choice}><Text style={styles.choiceText}>{locale === "de" ? "Frist vormerken" : "Add to calendar"}</Text></Pressable>}<Pressable onPress={() => confirmDelete(cost)} style={styles.choice}><Text style={styles.deleteText}>Entfernen</Text></Pressable></View>
    </View>)}</>}
  </>;
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, color: "#087a45" },
  title: { marginTop: 8, marginBottom: 12, fontSize: 24, fontWeight: "800", letterSpacing: -0.6, color: "#17211f" },
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
  choice: { minHeight: 44, justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: "#dfe5dd", backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 8 },
  choiceActive: { backgroundColor: "#087a45" },
  choiceText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  choiceTextActive: { color: "#ffffff" },
  primary: { minHeight: 48, marginTop: 12, borderRadius: 24, backgroundColor: "#087a45", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { fontSize: 14, fontWeight: "900", color: "#ffffff" },
  secondary: { minHeight: 44, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  sectionTitle: { marginTop: 28, fontSize: 18, fontWeight: "800", color: "#17211f" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  categoryCard: { width: "48%", minHeight: 88, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 12 },
  categoryLabel: { fontSize: 12, fontWeight: "700", color: "#52605b" },
  categoryAmount: { marginTop: 7, fontSize: 14, fontWeight: "900", color: "#17211f" },
  costRow: { marginTop: 10, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 14 },
  costName: { fontSize: 14, fontWeight: "900", color: "#17211f" },
  costArea: { marginTop: 5, fontSize: 11, fontWeight: "800", color: "#087a45" },
  costDetail: { marginTop: 5, fontSize: 12, lineHeight: 18, color: "#65716d" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  deleteText: { fontSize: 12, fontWeight: "800", color: "#b42318" },
});
