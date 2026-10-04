import { Pressable, StyleSheet, View } from "react-native";
import { FormSection, FormSubmitButton } from "./FormSection";
import { FormInput } from "./FormInput";
import { LocalizedText as Text, useMobileLocale } from "./i18n";

/** First-time settings contain only the choices needed for a household overview. */
export function HomeSetupForm({ name, onName, currency, onCurrency, onSave }: {
  name: string; onName: (name: string) => void;
  currency: "EUR" | "CHF"; onCurrency: (currency: "EUR" | "CHF") => void;
  onSave: () => Promise<void>;
}) {
  const de = useMobileLocale() === "de";
  const saveLabel = de ? "Zuhause speichern & weiter" : "Save home & continue";
  return <FormSection style={styles.panel} onSave={onSave} saveLabel={saveLabel}>
    <Text style={styles.eyebrow}>{de ? "ZUERST · DEIN ZUHAUSE EINRICHTEN" : "FIRST · SET UP YOUR HOME"}</Text>
    <Text accessibilityRole="header" style={styles.title}>{de ? "Dein Zuhause einrichten" : "Set up your home"}</Text>
    <Text style={styles.help}>{de ? "Gib deinem Zuhause einen Namen und wähle die Währung. Danach tragen wir gemeinsam dein Einkommen und deine ersten Kosten ein." : "Name your home and choose a currency. Next, we will add your income and first cost, one step at a time."}</Text>
    <FormInput label={de ? "Name deines Zuhauses" : "Home name"} value={name} onChangeText={onName} autoCapitalize="sentences" maxLength={60} />
    <Text style={styles.label}>{de ? "Währung" : "Currency"}</Text>
    <View style={styles.row}>{(["EUR", "CHF"] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected: currency === value}} onPress={() => onCurrency(value)} style={[styles.choice, currency === value && styles.selected]}><Text style={styles.choiceText}>{value}</Text></Pressable>)}</View>
    <FormSubmitButton label={saveLabel} style={styles.save} textStyle={styles.saveText} />
  </FormSection>;
}
const styles = StyleSheet.create({
  panel: { gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: "#dfe5dd", backgroundColor: "#fff" },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: .8, color: "#087a45" },
  title: { fontSize: 24, fontWeight: "800", color: "#17211f", letterSpacing: -.5 },
  help: { fontSize: 13, lineHeight: 20, color: "#52605b" },
  label: { fontSize: 12, fontWeight: "700", color: "#52605b" },
  row: { flexDirection: "row", gap: 8 },
  choice: { minHeight: 44, justifyContent: "center", paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, borderColor: "#cddbd0" },
  selected: { backgroundColor: "#ddf8e9", borderColor: "#087a45" },
  choiceText: { fontSize: 13, fontWeight: "700", color: "#17211f" },
  save: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 18, borderRadius: 24, backgroundColor: "#087a45", marginTop: 4 },
  saveText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
