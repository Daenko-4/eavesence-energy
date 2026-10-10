import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useFormAction } from "./FormSection";
import { LocalizedText as Text, localize, useMobileLocale } from "./i18n";

export const KeyboardScrollContext = createContext<(input: TextInput) => void>(() => {});

export function FormInput({ label, focusRequest=0, signedAmount=false, ...props }: { label: string;focusRequest?:number;signedAmount?:boolean } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const locale = useMobileLocale();
  const action = useFormAction();
  const id = useId();
  const input = useRef<TextInput>(null);
  const scrollToInput = useContext(KeyboardScrollContext);
  useEffect(()=>{if(focusRequest>0)input.current?.focus();},[focusRequest]);
  const register=action?.registerInput;
  useEffect(()=>props.editable===false?undefined:register?.(id,()=>input.current),[register,id,props.editable]);
  useEffect(() => {
    if (!focused) return;
    const reveal=()=>{if(input.current?.isFocused())scrollToInput(input.current);};
    const timers: ReturnType<typeof setTimeout>[]=[];
    const schedule=()=>{timers.forEach(clearTimeout);timers.length=0;reveal();timers.push(setTimeout(reveal,100),setTimeout(reveal,450));};
    schedule();
    const shown=Keyboard.addListener("keyboardDidShow",schedule),changed=Keyboard.addListener("keyboardDidChangeFrame",schedule);
    return ()=>{timers.forEach(clearTimeout);shown.remove();changed.remove();};
  }, [focused, scrollToInput, props.value]);
  const hasNext=!!action&&action.inputIds.indexOf(id)>=0&&action.inputIds.indexOf(id)<action.inputIds.length-1;
  return <View style={styles.field}>
    <Text style={styles.label}>{localize(locale, label)}</Text>
    <View style={styles.inputRow}>
      <TextInput
        {...props}
        ref={input}
        accessibilityLabel={localize(locale, label)}
        keyboardType={props.keyboardType ?? "default"}
        inputMode={props.inputMode ?? (props.keyboardType === "decimal-pad" ? "decimal" : props.keyboardType === "number-pad" || props.keyboardType === "numeric" ? "numeric" : undefined)}
        selectTextOnFocus={props.selectTextOnFocus ?? (!!props.keyboardType && props.keyboardType!=="default")}
        placeholder={!focused && props.placeholder ? localize(locale, props.placeholder) : undefined}
        inputAccessoryViewID={Platform.OS === "ios" ? action?.id ?? id : undefined}
        returnKeyType={props.returnKeyType ?? (hasNext ? "next" : "done")}
        submitBehavior={props.submitBehavior ?? (props.multiline ? "newline" : "submit")}
        onSubmitEditing={(event) => { props.onSubmitEditing?.(event); if(props.submitBehavior==="newline")return; if(action?.nextInput(id))return; if (action) action.submit(); else Keyboard.dismiss(); }}
        onFocus={(event) => { setFocused(true); action?.setActiveId(id); props.onFocus?.(event); requestAnimationFrame(() => { if (input.current) scrollToInput(input.current); }); }}
        onBlur={(event) => { setFocused(false); if(action?.activeId===id)action.setActiveId(null); props.onBlur?.(event); }}
        placeholderTextColor="#8a9591"
        style={[styles.input, focused && styles.inputFocused, props.style]}
      />
      {signedAmount && <Pressable accessibilityRole="button" accessibilityLabel={locale === "de" ? "Vorzeichen ändern" : "Change sign"} accessibilityState={{disabled:props.editable===false}} disabled={props.editable===false} onPress={()=>{const value=props.value ?? "";props.onChangeText?.(value.startsWith("-") ? value.slice(1) : `-${value}`);input.current?.focus();}} style={styles.signButton}><Text style={styles.signText}>±</Text></Pressable>}
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
  signButton: { minWidth: 44, minHeight: 50, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signText: { fontSize: 22, color: "#52605b" },
  doneButton: { minWidth: 62, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#dcf8e8" },
  doneText: { fontSize: 14, fontWeight: "800", color: "#087a45" },
});
