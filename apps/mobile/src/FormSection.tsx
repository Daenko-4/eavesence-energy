import { createContext, useCallback, useContext, useId, useRef, useState, type ComponentProps } from "react";
import { createInputNavigation } from "./inputNavigation";
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import { LocalizedText as Text, showLocalizedAlert, useMobileLocale } from "./i18n";

const FormActionContext = createContext<{ id: string; busy: boolean; submit: () => void; run: (work: () => unknown | Promise<unknown>) => void; registerInput: (id:string,get:()=>{focus:()=>void;isFocused:()=>boolean}|null)=>()=>void; nextInput:(id:string)=>boolean; inputIds:string[]; activeId:string|null; setActiveId:(id:string|null)=>void } | null>(null);
export const useFormAction = () => useContext(FormActionContext);

/** The keyboard action uses exactly the same validation and persistence as the form button. */
export function FormSection({ onSave, saveLabel = "Speichern", children, ...props }: ComponentProps<typeof View> & { onSave: () => unknown | Promise<unknown>; saveLabel?: string }) {
  const id = useId();
  const locale = useMobileLocale();
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [navigation] = useState(createInputNavigation);
  const [inputIds,setInputIds]=useState<string[]>([]),[activeId,setActiveId]=useState<string|null>(null);
  const registerInput=useCallback((id:string,get:()=>{focus:()=>void;isFocused:()=>boolean}|null)=>{const remove=navigation.register(id,get);setInputIds(ids=>[...ids,id]);return()=>{remove();setInputIds(ids=>ids.filter(key=>key!==id));};},[navigation]);
  async function save(work = onSave) {
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try { const result = await work(); if (result === true) Keyboard.dismiss(); }
    catch { showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut."); }
    finally { saving.current = false; setBusy(false); }
  }
  return <FormActionContext.Provider value={{ id, busy, submit: () => void save(), run: work => void save(work),registerInput,nextInput:navigation.next,inputIds,activeId,setActiveId }}>
    <View {...props}>{children}</View>
    {Platform.OS === "ios" && <InputAccessoryView nativeID={id} backgroundColor="#ffffff">
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel={locale==="de"?"Tastatur schließen":"Dismiss keyboard"} onPress={Keyboard.dismiss} style={styles.dismiss}><Text style={styles.dismissText}>{locale==="de"?"Schließen":"Close"}</Text></Pressable>
        {activeId&&inputIds.indexOf(activeId)<inputIds.length-1&&<Pressable accessibilityRole="button" accessibilityLabel={locale==="de"?"Nächstes Feld":"Next field"} onPress={()=>navigation.next(activeId)} style={styles.dismiss}><Text style={styles.dismissText}>{locale==="de"?"Weiter":"Next"}</Text></Pressable>}
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

/** Visible and keyboard buttons share one busy state and one error boundary. */
export function FormSubmitButton({ label, style, textStyle }: { label: string; style?: ComponentProps<typeof Pressable>["style"]; textStyle?: ComponentProps<typeof Text>["style"] }) {
  const form = useFormAction();
  return <Pressable accessibilityRole="button" disabled={form?.busy} onPress={form?.submit} style={style}><Text style={textStyle}>{label}</Text></Pressable>;
}

export function FormActionButton({ label, onPress, style, textStyle }: { label: string; onPress: () => unknown | Promise<unknown>; style?: ComponentProps<typeof Pressable>["style"]; textStyle?: ComponentProps<typeof Text>["style"] }) {
  const form = useFormAction();
  return <Pressable accessibilityRole="button" disabled={form?.busy} onPress={() => form?.run(onPress)} style={style}><Text style={textStyle}>{label}</Text></Pressable>;
}
