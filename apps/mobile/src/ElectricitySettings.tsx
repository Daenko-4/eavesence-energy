import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { parseIncomeAmount } from "@eavesence/core/income";
import { FormInput } from "./FormInput";
import { FormSection, FormSubmitButton } from "./FormSection";

type Props = {
  locale: "de" | "en";
  currency: string;
  price: number;
  goal: number;
  monthlyEstimate: number;
  hasDevices: boolean;
  onPrice: (price: number) => Promise<void>;
  onGoal: (goal: number) => Promise<void>;
};

/** Energy preferences stay separate from home identity and household bills. */
export function ElectricitySettings({ locale, currency, price, goal, monthlyEstimate, hasDevices, onPrice, onGoal }: Props) {
  const t = (de: string, en: string) => locale === "de" ? de : en;
  const [draft, setDraft] = useState(String(price));
  const [notice, setNotice] = useState<{error: boolean; text: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const money = (value: number) => new Intl.NumberFormat(locale === "de" ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  async function savePrice() {
    if (saving.current) return;
    const value = parseIncomeAmount(draft, locale);
    if (!Number.isFinite(value) || value <= 0) {
      setNotice({error: true, text: t("Gib einen Strompreis über 0 ein.", "Enter an electricity price above 0.")}); return;
    }
    saving.current = true; setBusy(true);
    try {
      await onPrice(value); Keyboard.dismiss();
      setNotice({error: false, text: t("Strompreis gespeichert.", "Electricity price saved.")});
    } catch { setNotice({error: true, text: t("Speichern fehlgeschlagen. Deine Eingabe bleibt erhalten.", "Could not save. Your entry is still here.")}); }
    finally { saving.current = false; setBusy(false); }
  }
  async function saveGoal(value: number) {
    if (saving.current || value === goal) return;
    saving.current = true; setBusy(true);
    try {
      await onGoal(value);
      setNotice({error: false, text: t("Strom-Sparziel gespeichert.", "Electricity target saved.")});
    } catch { setNotice({error: true, text: t("Sparziel konnte nicht gespeichert werden. Bitte erneut versuchen.", "Could not save the target. Please try again.")}); }
    finally { saving.current = false; setBusy(false); }
  }
  const goalButton = (label: string, value: number, selected = false) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected,disabled:busy}} disabled={busy} onPress={() => void saveGoal(value)} style={[s.button,selected && s.selected]}><Text style={s.buttonText}>{label}</Text></Pressable>;
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.title}>{t("Dein Strom-Sparziel", "Your electricity savings target")}</Text>
    <View style={s.goalRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("Sparziel um 1 Prozentpunkt senken", "Decrease target by 1 percentage point")} disabled={busy || goal <= 1} onPress={() => void saveGoal(Math.max(1,goal-1))} style={s.step}><Text style={s.stepText}>−</Text></Pressable>
      <Text style={s.goal}>{goal} %</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("Sparziel um 1 Prozentpunkt erhöhen", "Increase target by 1 percentage point")} disabled={busy || goal >= 50} onPress={() => void saveGoal(Math.min(50,goal+1))} style={s.step}><Text style={s.stepText}>+</Text></Pressable>
    </View>
    <View style={s.row}>{[5,10,20].map(value => goalButton(`${value} %`,value,goal===value))}</View>
    <Text style={s.note}>{hasDevices
      ? t(`Bei gleichem Strompreis wären das geschätzt ${money(monthlyEstimate*goal/100)} weniger pro Monat für deine gespeicherten Geräte.`, `At the same electricity price, that would mean an estimated ${money(monthlyEstimate*goal/100)} less per month for your saved devices.`)
      : t("Speichere ein Gerät, um die geschätzte Ersparnis zu sehen.", "Save a device to see the estimated saving.")}</Text>
    <Text style={s.note}>{t("Änderungen am Ziel werden automatisch gespeichert. Deine eingetragenen Haushaltskosten bleiben unverändert.", "Target changes save automatically. Your recorded household costs stay unchanged.")}</Text>
    <FormSection onSave={savePrice} saveLabel={t("Strompreis speichern", "Save electricity price")} style={s.priceForm}>
      <FormInput label={`${t("Strompreis pro kWh", "Electricity price per kWh")} (${currency})`} value={draft} onChangeText={value => {setDraft(value);setNotice(null);}} keyboardType="decimal-pad" />
      <FormSubmitButton disabled={busy} label={t("Strompreis speichern", "Save electricity price")} style={s.button} textStyle={s.buttonText}/>
    </FormSection>
    {notice && <Text accessibilityRole={notice.error ? "alert" : undefined} accessibilityLiveRegion="polite" style={[s.note,notice.error && s.error]}>{notice.text}</Text>}
  </View>;
}

const s = StyleSheet.create({
  card:{marginTop:16,padding:16,borderWidth:1,borderColor:"#cce5d6",borderRadius:14,backgroundColor:"#eef8f1",gap:12},
  title:{fontSize:15,fontWeight:"700",color:"#24272c"},
  note:{fontSize:13,lineHeight:20,color:"#52605b"},
  row:{flexDirection:"row",flexWrap:"wrap",gap:8},
  goalRow:{flexDirection:"row",alignItems:"center",gap:12},
  goal:{flex:1,textAlign:"center",fontSize:25,fontWeight:"700",color:"#24272c"},
  step:{minHeight:44,minWidth:44,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:"#fff",borderWidth:1,borderColor:"#dfe5dd"},
  stepText:{fontSize:24,color:"#28734d"},
  button:{minHeight:44,alignSelf:"flex-start",borderWidth:1,borderColor:"#dfe5dd",borderRadius:20,paddingHorizontal:12,paddingVertical:10,justifyContent:"center",backgroundColor:"#fff"},
  buttonText:{fontSize:12,fontWeight:"600",color:"#28734d"},
  selected:{borderColor:"#28734d",backgroundColor:"#ddf8e9"},
  priceForm:{gap:10,borderTopWidth:1,borderColor:"#cce5d6",paddingTop:14},
  error:{color:"#b42318"},
});
