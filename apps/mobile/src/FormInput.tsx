import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useFormAction } from "./FormSection";
import { LocalizedText as Text, localize, useMobileLocale } from "./i18n";

export const KeyboardScrollContext = createContext<(input: TextInput) => void>(() => {});

export function FormInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const locale = useMobileLocale();
  const action = useFormAction();
  const id = useId();
  const input = useRef<TextInput>(null);
  const scrollToInput = useContext(KeyboardScrollContext);
  useEffect(() => {
    if (!focused) return;
    const shown = Keyboard.addListener("keyboardDidShow", () => { if (input.current) scrollToInput(input.current); });
    return () => shown.remove();
  }, [focused, scrollToInput]);
  return <View style={styles.field}>
    <Text style={styles.label}>{localize(locale, label)}</Text>
    <View style={styles.inputRow}>
      <TextInput
        {...props}
        ref={input}
        accessibilityLabel={localize(locale, label)}
        placeholder={props.placeholder ? localize(locale, props.placeholder) : undefined}
        inputAccessoryViewID={Platform.OS === "ios" ? action?.id ?? id : undefined}
        returnKeyType={action ? "default" : "done"}
        onSubmitEditing={(event) => { props.onSubmitEditing?.(event); if (action) action.submit(); else Keyboard.dismiss(); }}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); requestAnimationFrame(() => { if (input.current) scrollToInput(input.current); }); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        placeholderTextColor="#8a9591"
        style={[styles.input, focused && styles.inputFocused, props.style]}
      />
      {focused && Platform.OS !== "ios" && <Pressable accessibilityRole="button" accessibilityLabel={`${localize(locale, label)}: ${locale === "de" ? "Eingabe beenden" : "Dismiss keyboard"}`} onPress={Keyboard.dismiss} style={styles.doneButton}>
        <Text style={styles.doneText}>{locale === "de" ? "Fertig" : "Done"}</Text>
      </Pressable>}
    </View>
    {Platform.OS === "ios" && !action && <InputAccessoryView nativeID={id} backgroundColor="#ffffff"><View style={styles.accessory}><Pressable accessibilityRole="button" onPress={Keyboard.dismiss} style={styles.doneButton}><Text style={styles.doneText}>{locale === "de" ? "Fertig" : "Done"}</Text></Pressable></View></InputAccessoryView>}
  </View>;
}

const styles = StyleSheet.create({
  accessory: { alignItems: "flex-end", padding: 8, borderTopWidth: 1, borderColor: "#dfe5dd" },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: "700", color: "#52605b" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 50, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, backgroundColor: "#ffffff", paddingHorizontal: 14, fontSize: 16, color: "#17211f" },
  inputFocused: { borderColor: "#72dca3" },
  doneButton: { minWidth: 62, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#dcf8e8" },
  doneText: { fontSize: 14, fontWeight: "800", color: "#087a45" },
});
