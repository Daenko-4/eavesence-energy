import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import { LocalizedText as Text, showLocalizedAlert, useMobileLocale } from "./i18n";

const FormActionContext = createContext<{ id: string; submit: () => void } | null>(null);
export const useFormAction = () => useContext(FormActionContext);

/** The keyboard action uses exactly the same validation and persistence as the form button. */
export function FormSection({ onSave, saveLabel = "Speichern", children, ...props }: ComponentProps<typeof View> & { onSave: () => unknown | Promise<unknown>; saveLabel?: string }) {
  const id = useId();
  const locale = useMobileLocale();
  const [busy, setBusy] = useState(false);
  async function save() {
    if (busy) return;
    setBusy(true);
    try { await onSave(); }
    catch { showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut."); }
    finally { setBusy(false); }
  }
  return <FormActionContext.Provider value={{ id, submit: () => void save() }}>
    <View {...props}>{children}</View>
    {Platform.OS === "ios" && <InputAccessoryView nativeID={id} backgroundColor="#ffffff">
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" onPress={Keyboard.dismiss} style={styles.dismiss}><Text style={styles.dismissText}>Tastatur schließen</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()} style={[styles.save, busy && styles.busy]}><Text style={styles.saveText}>{saveLabel}</Text></Pressable>
      </View>
    </InputAccessoryView>}
  </FormActionContext.Provider>;
}
const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: "#dfe5dd" },
  dismiss: { minHeight: 44, justifyContent: "center", flexShrink: 1 },
  dismissText: { fontSize: 12, color: "#52605b" },
  save: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22, backgroundColor: "#ddf8e9", flexShrink: 1 },
  saveText: { fontSize: 13, fontWeight: "700", color: "#087a45" },
  busy: { opacity: 0.5 },
});
