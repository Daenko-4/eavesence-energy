import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PlanningData } from '@eavesence/core/planning';
import { useSalaryGrowth } from '@eavesence/core/useSalaryGrowth';
import { FormInput } from './FormInput';
import { FormSection, FormSubmitButton } from './FormSection';
import { LocalizedText as Text, useMobileLocale } from './i18n';

export function SalaryGrowthEditor({income,data,onSave,currency,enabled=true}: {income:number;data?:PlanningData;onSave:(data:PlanningData)=>void|Promise<void>;currency:string;enabled?:boolean}) {
  const locale=useMobileLocale(),de=locale==='de',t=(a:string,b:string)=>de?a:b,p=useSalaryGrowth(income,data,onSave,locale,enabled);
  const [open,setOpen]=useState(false);
  const money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
  const saveLabel=t('Zukunftsannahme speichern','Save future assumption');
  return <View style={styles.box}>
    {p.active&&<Text style={styles.note}>{t('Prognose mit geschätzter jährlicher Netto-Erhöhung','Forecast includes estimated annual net salary growth')}: {p.saved!.annualPercent} % · {t('erstmals','first applied')} {p.saved!.firstMonth}.</Text>}
    {p.stale&&<Text accessibilityLiveRegion="polite" style={styles.warning}>{t('Deine Gehaltsbasis hat sich geändert. Die Erhöhungsannahme pausiert. Prüfe Prozentsatz und einen zukünftigen Startmonat und speichere erneut.','Your salary basis changed. The growth assumption is paused. Review the rate and a future start month, then save again.')}</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={styles.toggle}><Text style={styles.title}>{t('Zukunftsannahmen (optional)','Future assumptions (optional)')} {open?'−':'+'}</Text></Pressable>
    {open&&<FormSection onSave={p.save} saveLabel={saveLabel} style={styles.form}>
      <Text style={styles.note}>{t('Schätzung für zukünftige Gehälter in der 12-Monats- und 90-Tage-Prognose. Die Erhöhung wiederholt sich jährlich ab dem Startmonat. Dein bestätigtes Einkommen, Kontostand und heutiges Monatsbudget werden dadurch nicht erhöht. Sonderzahlungen mit festem Betrag werden separat geplant.','Estimate for future salaries in the 12-month and 90-day forecasts. Growth repeats annually from the start month. Your confirmed income, balance and current monthly budget are not increased. Fixed salary extras are planned separately.')}</Text>
      {!enabled&&<Text style={styles.note}>{t('Trage zuerst ein reguläres Monatsnetto statt eines Jahresdurchschnitts ein.','Enter regular monthly net income instead of an annual average first.')}</Text>}
      <FormInput label={t('Geschätzte jährliche Netto-Erhöhung (%)','Estimated annual net salary growth (%)')} keyboardType="decimal-pad" value={p.percent} onChangeText={p.setPercent}/>
      <FormInput label={t('Erste Erhöhung ab (MM.JJJJ)','First increase from (MM.YYYY)')} keyboardType="number-pad" value={/^\d{4}-\d{2}$/.test(p.firstMonth)?`${p.firstMonth.slice(5)}.${p.firstMonth.slice(0,4)}`:p.firstMonth} onChangeText={v=>{const digits=v.replace(/\D/g,'').slice(0,6);p.setFirstMonth(digits.length===6?`${digits.slice(2)}-${digits.slice(0,2)}`:digits.length>2?`${digits.slice(0,2)}.${digits.slice(2)}`:digits);}}/>
      <Text style={styles.note}>{t('0 % deaktiviert die Annahme. Eine Bruttoerhöhung ist keine gleich hohe Nettoerhöhung.','0% disables the assumption. A gross pay rise does not mean the same net pay rise.')}</Text>
      {p.example!==null&&<Text style={styles.note}>{t('Geschätztes Monatsnetto nach der ersten Erhöhung','Estimated monthly net income after the first increase')}: {money(p.example)}</Text>}
      {!!p.error&&<Text accessibilityRole="alert" style={styles.warning}>{p.error}</Text>}
      {!!p.notice&&<Text accessibilityLiveRegion="polite" style={styles.note}>{p.notice}</Text>}
      <FormSubmitButton label={saveLabel} style={styles.save} textStyle={styles.title}/>
    </FormSection>}
  </View>;
}
const styles=StyleSheet.create({box:{marginTop:12,borderWidth:1,borderColor:'#dfe5dd',borderRadius:12,padding:14,gap:10,backgroundColor:'#fff'},toggle:{minHeight:44,justifyContent:'center'},title:{fontSize:13,fontWeight:'700',color:'#17211f'},note:{fontSize:13,lineHeight:20,color:'#52605b'},warning:{fontSize:13,lineHeight:20,color:'#92400e'},form:{gap:12},save:{minHeight:44,borderRadius:22,backgroundColor:'#72dca3',alignItems:'center',justifyContent:'center',paddingHorizontal:16}});
