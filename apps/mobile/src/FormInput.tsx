import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function FormInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput
        {...props}
        accessibilityLabel={label}
        returnKeyType="done"
        onSubmitEditing={(event) => { props.onSubmitEditing?.(event); Keyboard.dismiss(); }}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        placeholderTextColor="#8a9591"
        style={[styles.input, props.style]}
      />
      {focused && <Pressable accessibilityRole="button" accessibilityLabel={`${label}: Eingabe beenden`} onPress={Keyboard.dismiss} style={styles.doneButton}>
        <Text style={styles.doneText}>Fertig</Text>
      </Pressable>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: "800", color: "#52605b" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 50, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 14, backgroundColor: "#ffffff", paddingHorizontal: 15, fontSize: 16, color: "#07111f" },
  doneButton: { minWidth: 62, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#dcf8e8" },
  doneText: { fontSize: 14, fontWeight: "800", color: "#087a45" },
});
