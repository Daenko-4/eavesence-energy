import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { LocalizedText as Text, localize, useMobileLocale } from "./i18n";

export function FormInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const locale = useMobileLocale();
  return <View style={styles.field}>
    <Text style={styles.label}>{localize(locale, label)}</Text>
    <View style={styles.inputRow}>
      <TextInput
        {...props}
        accessibilityLabel={localize(locale, label)}
        placeholder={props.placeholder ? localize(locale, props.placeholder) : undefined}
        returnKeyType="done"
        onSubmitEditing={(event) => { props.onSubmitEditing?.(event); Keyboard.dismiss(); }}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        placeholderTextColor="#8a9591"
        style={[styles.input, focused && styles.inputFocused, props.style]}
      />
      {focused && <Pressable accessibilityRole="button" accessibilityLabel={`${localize(locale, label)}: ${locale === "de" ? "Eingabe beenden" : "Dismiss keyboard"}`} onPress={Keyboard.dismiss} style={styles.doneButton}>
        <Text style={styles.doneText}>{locale === "de" ? "Fertig" : "Done"}</Text>
      </Pressable>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: "800", color: "#52605b" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 50, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, backgroundColor: "#ffffff", paddingHorizontal: 14, fontSize: 16, color: "#17211f" },
  inputFocused: { borderColor: "#72dca3" },
  doneButton: { minWidth: 62, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#dcf8e8" },
  doneText: { fontSize: 14, fontWeight: "800", color: "#087a45" },
});
