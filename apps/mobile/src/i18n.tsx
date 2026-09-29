import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { Text as NativeText } from "react-native";

export type MobileLocale = "de" | "en";
export const LocaleContext = createContext<MobileLocale>("de");
export const useMobileLocale = () => useContext(LocaleContext);

const en: Record<string, string> = {
  "z. B. Versicherungen": "e.g. insurance", "z. B. Kühlschrank": "e.g. refrigerator",
  "z. B. Lebensmittel, Freizeit": "e.g. groceries, leisure", "z. B. Internet": "e.g. internet",
  "TT.MM.JJJJ": "DD.MM.YYYY", "0,00": "0.00",
  "Jetzt starten": "Get started", "Angaben schließen": "Close options", "Name und Strompreis anpassen": "Change name and electricity price",
  "BLICK AUF DEN NÄCHSTEN MONAT": "LOOKING AHEAD", "Bearbeiten": "Edit", "EAVESENCE HOME": "EAVESENCE HOME", "SPRACHE / LANGUAGE": "LANGUAGE",
  "Name deines Zuhauses": "Name your home", "Strompreis pro kWh (€)": "Electricity price per kWh", "Sparziel (%)": "Savings target (%)",
  "Einstellungen": "Settings", "Schließen": "Close", "Einstellungen speichern": "Save settings", "Name": "Name",
  "Alltagsausgaben pro Monat (optional)": "Everyday spending per month (optional)", "Sicherheitspuffer pro Monat": "Monthly buffer", "Gewünschter Sparbetrag pro Monat": "Monthly savings goal",
  "Gerät suchen": "Search devices", "Gerätename": "Device name", "Leistung in Watt": "Power in watts", "Minuten pro Nutzung": "Minutes per use", "Nutzungen pro Woche": "Uses per week",
  "kWh je Nutzung (Energielabel: kWh/Jahr)": "kWh per use (energy label: kWh/year)", "Gemessene kWh je Nutzung": "Measured kWh per use", "Verbrauch in kWh": "Usage in kWh",
  "Kachelname": "Tile name", "Nächste Zahlung (optional)": "Next payment (optional)", "Kündigungsfrist (optional)": "Cancellation deadline (optional)",
  "Miete oder Kreditrate": "Rent or mortgage", "Strom oder Heizung": "Electricity or heating", "Auto oder Öffis": "Car or public transport", "Internet oder Abo": "Internet or subscription", "Kreditrate": "Loan payment",
  "Zuhause": "Home", "Kosten": "Costs", "Gerät": "Device", "Verlauf": "History", "WÄHRUNG": "CURRENCY",
  "Was bleibt dir nächsten Monat?": "What will you have left next month?",
  "Erfasse dein Nettoeinkommen und deine festen Kosten. EAVESENCE zeigt dir, welche Zahlungen anstehen und was übrig bleibt.": "Add your net income and fixed costs. EAVESENCE shows upcoming payments and what is left.",
  "Ohne Konto · lokal gespeichert · jederzeit löschbar": "No account · stored on your device · delete anytime",
  "Für Geräte starten wir mit 0,30 €/kWh. Du kannst den Strompreis später in den Einstellungen ändern.": "The initial electricity price is 0.30 per kWh. You can change it in settings.",
  "Dein Zuhause": "Your home", "Deine Daten": "Your data", "Deine Kacheln": "Your tiles", "Finanzen im Überblick": "Your finances",
  "Dein Überblick über Einkommen, feste Kosten und nächste Zahlungen.": "Your income, fixed costs and upcoming payments at a glance.",
  "Sicherungen enthalten Einstellungen, Kacheln, Kosten, Geräte und Monatswerte. Du kannst auch eine Website-Sicherung importieren; vorhandene App-Daten werden erst nach deiner Bestätigung ersetzt.": "Backups contain settings, tiles, costs, devices and monthly entries. You can import a website backup; current app data is replaced only after you confirm.",
  "Trage erst dein Nettoeinkommen und mindestens eine regelmäßige Ausgabe ein. Das dauert nur einen Moment.": "Add your net income and at least one recurring cost to get started.",
  "Zahlungstermine ergänzen": "Add payment dates", "Fällige Zahlungen": "Due payments", "Zahlungen schließen": "Close payments",
  "Keine datierten Zahlungen vorhanden.": "No dated payments yet.", "Kosten bearbeiten": "Edit costs", "Feste Ausgaben": "Fixed spending",
  "Öffne einen Bereich oder ändere seine Reihenfolge mit den Pfeilen.": "Open a section or use the arrows to reorder it.",
  "+ Eigene Kachel": "+ Custom tile", "Kachel erstellen": "Create tile", "Kachel umbenennen": "Rename tile",
  "Ändern": "Edit", "Abbrechen": "Cancel", "Entfernen": "Remove", "Löschen": "Clear", "Hinzufügen": "Add",
  "Monatswert eintragen": "Add monthly reading", "Aktueller Monatswert noch offen": "This month's reading is still open",
  "Erfasse einmal im Monat Verbrauch oder Rechnungsbetrag. Den zweiten Wert berechnen wir automatisch.": "Record usage or the bill once a month. We calculate the other value.",
  "Strom & Geräte": "Electricity & devices", "Gerätekosten/Jahr": "Device costs/year", "Verbrauch": "Usage", "Ziel pro Monat": "Monthly target", "Geräte": "Devices", "GRÖSSTER HEBEL": "BIGGEST OPPORTUNITY",
  "Alle Verbraucher im Haushalt": "All household devices", "Gerät hinzufügen": "Add device", "Noch keine Geräte. Füge dein erstes Gerät hinzu.": "No devices yet. Add your first one.",
  "Gerät aus der Bibliothek": "Choose a device", "Richtwerte der Website. Passe den Verbrauch an dein Modell an.": "Typical values from the website. Adjust usage to match your model.",
  "Schätzen": "Estimate", "Gemessen": "Measured", "Watt & Dauer": "Watts & duration", "kWh je Nutzung": "kWh per use",
  "Beim Jahresverbrauch des Energielabels ist die Nutzung auf ein Jahr eingestellt.": "For annual energy label usage, the frequency is set to once a year.",
  "Berechnen und speichern": "Calculate and save", "Änderungen speichern": "Save changes",
  "MONATS-CHECK": "MONTHLY CHECK", "Aus Schätzungen wird ein Verlauf.": "Build a history from your estimates.",
  "Gib Verbrauch oder Rechnungsbetrag ein. Den zweiten Wert berechnen wir automatisch mit deinem Strompreis.": "Enter usage or your bill. We calculate the other value using your electricity price.",
  "Rechnung": "Bill", "Monat": "Month", "Aktueller Monat": "Current month", "Monat speichern": "Save month", "Monat aktualisieren": "Update month",
  "Monatliche Erinnerung aktivieren": "Enable monthly reminder", "Monatliche Erinnerung ausschalten": "Disable monthly reminder",
  "Noch kein Monatswert vorhanden.": "No monthly entry yet.",
  "SPARPLAN · VORSCHAU": "SAVINGS PLAN · PREVIEW", "SPARPLAN · PRO-VORSCHAU": "SAVINGS PLAN · PRO PREVIEW",
  "Was kannst du einplanen?": "What can you plan for?", "Deinen Spielraum vervollständigen": "Complete your budget estimate",
  "Einkommen und feste Kosten kommen aus My Home. Ergänze nur einen groben Alltagsbetrag. Diese Vorschau ist während der Entwicklung kostenlos testbar.": "Income and fixed costs come from My Home. Add an approximate everyday budget. This preview is free to try during development.",
  "Plan speichern": "Save plan", "Die nächsten 12 Monate": "The next 12 months", "Kosten prüfen": "Review costs",
  "Ein kostenpflichtiges Abo ist derzeit nicht verfügbar.": "A paid subscription is not available yet.", "Käufe wiederherstellen": "Restore purchases", "Pro aktiv": "Pro active",
  "HAUSHALTSKOSTEN": "HOUSEHOLD COSTS", "Was kostet dein Zuhause?": "What does your home cost?",
  "Alle regelmäßigen Kosten aus deinen Kacheln an einem Ort. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um.": "All recurring costs from your tiles in one place. Annual and other payments are converted to a monthly average.",
  "Die regelmäßigen Kosten in dieser Kachel. Jährliche und andere Zahlungen rechnen wir auf einen Monatsdurchschnitt um.": "Recurring costs in this tile. Annual and other payments are converted to a monthly average.",
  "PRO MONAT": "PER MONTH", "PRO JAHR": "PER YEAR", "Nettoeinkommen": "Net income",
  "Das Budget zieht nur deine erfassten regelmäßigen Kosten ab; variable Ausgaben bleiben außen vor.": "The budget subtracts recorded recurring costs only; variable spending is not included.",
  "Einkommen speichern": "Save income", "Kosten hinzufügen": "Add cost", "Angelegte Kosten": "Saved costs", "Kosten nach Kategorie": "Costs by category",
  "Beginne mit Wohnen, Energie oder einem Vertrag. Anbieterangaben sind nicht nötig.": "Start with housing, energy or a contract. No provider details needed.",
  "Neue Kosten": "New cost", "Bezeichnung": "Name", "Betrag": "Amount", "KATEGORIE": "CATEGORY", "WIE OFT?": "HOW OFTEN?",
  "Mit Zahlungstermin können wir den nächsten Monat genau berechnen. Ohne Termin fließt der Posten nur in den Monatsdurchschnitt ein.": "A payment date makes next month's forecast more precise. Without a date, the cost is included in the monthly average only.",
  "Speichern": "Save", "Aktualisieren": "Update", "Noch keine Kosten angelegt.": "No costs saved yet.",
  "Wohnen": "Housing", "Energie": "Energy", "Versicherung": "Insurance", "Verträge & Abos": "Contracts & subscriptions", "Mobilität": "Transport", "Finanzierung": "Financing", "Freizeit": "Leisure", "Sonstiges": "Other",
  "Wöchentlich": "Weekly", "Monatlich": "Monthly", "Quartalsweise": "Quarterly", "Halbjährlich": "Every six months", "Jährlich": "Yearly",
  "Heute": "Today", "In 30 Tagen": "In 30 days", "Nächster 1.": "Next 1st", "Nächster 15.": "Next 15th", "Monatsende": "Month end",
  "Ohne Zahlungstermin": "No payment date", "Sicherung exportieren": "Export backup", "Sicherung importieren": "Import backup", "My Home zurücksetzen": "Reset My Home",
  "NETTO / MONAT": "NET / MONTH", "KOSTEN / MONAT": "COSTS / MONTH", "ZAHLUNGEN IM NÄCHSTEN MONAT · ": "PAYMENTS NEXT MONTH · ",
  "Schnell starten · ": "Quick start · ", "Feste Kosten im Monatsdurchschnitt: ": "Average monthly fixed costs: ",
  "Rest nach festen Kosten, Alltag und Puffer; das Sparziel ist darin noch enthalten. Monate unter deinem Sparziel: ": "Remaining after fixed costs, everyday spending and buffer; the savings goal is not yet deducted. Months below your goal: ",
};

export function localize(locale: MobileLocale, value: string): string {
  if (locale === "de") return value;
  return en[value] ?? value;
}

export function LocalizedText({ children, ...props }: ComponentProps<typeof NativeText>) {
  const locale = useMobileLocale();
  function map(value: ReactNode): ReactNode {
    if (typeof value === "string") return localize(locale, value);
    if (Array.isArray(value)) return value.map(map);
    return value;
  }
  return <NativeText {...props}>{map(children)}</NativeText>;
}
