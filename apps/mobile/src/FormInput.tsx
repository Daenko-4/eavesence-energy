import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View, InputAccessoryView } from "react-native";

const accessoryId = "eavesence-keyboard-done";

export function KeyboardDoneBar() {
  if (Platform.OS !== "ios") return null;
  return <InputAccessoryView nativeID={accessoryId}>
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" onPress={Keyboard.dismiss} style={styles.doneButton}>
        <Text style={styles.doneText}>Fertig</Text>
      </Pressable>
    </View>
  </InputAccessoryView>;
}

export function FormInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
      returnKeyType="done"
      onSubmitEditing={Keyboard.dismiss}
      placeholderTextColor="#8a9591"
      {...props}
      style={[styles.input, props.style]}
    />
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: "800", color: "#52605b" },
  input: { minHeight: 50, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 14, backgroundColor: "#ffffff", paddingHorizontal: 15, fontSize: 16, color: "#07111f" },
  toolbar: { minHeight: 44, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", backgroundColor: "#f6f7f2", borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#dfe5e1", paddingHorizontal: 18 },
  doneButton: { paddingHorizontal: 10, paddingVertical: 8 },
  doneText: { fontSize: 16, fontWeight: "700", color: "#087a45" },
});
