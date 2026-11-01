import {useRef,useState} from 'react';
import {Alert,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createAdditionalIncome,parseIncomeAmount,type AdditionalIncome} from '@eavesence/core/income';
import {localToday} from '@eavesence/core/homeValue';
import {FormInput,KeyboardScrollContext} from './FormInput';
import {FormSection,FormSubmitButton} from './FormSection';
import {revealInput} from './ScrollNavigation';

export function AdditionalIncomeModal({locale,currency,entries,onSave,onRemove,onClose}:{locale:'de'|'en';currency:string;entries:AdditionalIncome[];onSave:(entry:AdditionalIncome)=>Promise<void>;onRemove:(id:string)=>Promise<void>;onClose:()=>void}){
 const t=(de:string,en:string)=>locale==='de'?de:en,today=localToday();
 const [editing,setEditing]=useState<AdditionalIncome|null>(null),[amount,setAmount]=useState(''),[name,setName]=useState(''),[date,setDate]=useState(today),[planned,setPlanned]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[shown,setShown]=useState(10),[focus,setFocus]=useState(1);
 const saving=useRef(false),scroll=useRef<ScrollView>(null);
 const money=(n:number)=>new Intl.NumberFormat(locale==='de'?'de-AT':'en-GB',{style:'currency',currency}).format(n);
 async function work(action:()=>Promise<void>,close=false){if(saving.current)return;saving.current=true;setBusy(true);setError('');try{await action();if(close)onClose();}catch{setError(t('Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten. Versuche es erneut.','Could not save. Your entries have been kept. Try again.'));}finally{saving.current=false;setBusy(false);}}
 async function save(){
  const entry=createAdditionalIncome({...editing,name,amount:parseIncomeAmount(amount,locale),date,status:planned?'planned':'received'},today);
  if(!entry){setError(t('Prüfe Betrag und Datum (JJJJ-MM-TT). Erhaltenes Geld braucht ein Datum bis heute.','Check the amount and date (YYYY-MM-DD). Received money needs a date no later than today.'));return;}
  if(!editing&&entries.length>=500){setError(t('Du kannst bis zu 500 zusätzliche Einnahmen speichern.','You can save up to 500 additional income entries.'));return;}
  await work(()=>onSave(entry),true);
 }
 function edit(entry:AdditionalIncome){setEditing(entry);setAmount(String(entry.amount));setName(entry.name);setDate(entry.date);setPlanned(entry.status==='planned');setError('');scroll.current?.scrollTo({y:0,animated:true});setFocus(n=>n+1);}
 return <Modal animationType="slide" onRequestClose={()=>{if(!busy)onClose();}}><SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.safe} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={s.header}><Text accessibilityRole="header" style={s.title}>{editing?t('Einnahme bearbeiten','Edit income entry'):t('Zusätzliche Einnahme erfassen','Record additional income')}</Text><Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={s.button}><Text>{t('Schließen','Close')}</Text></Pressable></View>
  <KeyboardScrollContext.Provider value={input=>revealInput(scroll.current,input)}><ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={Platform.OS==='ios'}>
   <Text style={s.note}>{t('Ein Verkauf, eine Erstattung oder ein Geschenk: Trage den Betrag ein, der bei dir angekommen ist.','A sale, refund or gift: enter the amount you received.')}</Text>
   <FormSection onSave={save} saveLabel={t('Einnahme speichern','Save income entry')} style={s.form}>
    <FormInput focusRequest={focus} label={`${t('Betrag','Amount')} (${currency})`} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder={t('z. B. 500,00','e.g. 500.00')}/>
    <FormInput label={t('Bezeichnung (optional)','Description (optional)')} value={name} maxLength={100} onChangeText={setName} placeholder={t('z. B. Verkauf auf eBay','e.g. eBay sale')}/>
    <FormInput label={t('Datum (JJJJ-MM-TT)','Date (YYYY-MM-DD)')} value={date} maxLength={10} onChangeText={value=>{setDate(value);if(value>today)setPlanned(true);}}/>
    <Text style={s.note}>{t('Zählt einmalig im angegebenen Monat.','Counted once in the selected month.')}</Text>
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:planned}} onPress={()=>setPlanned(!planned)} style={s.button}><Text>{planned?'☑ ':'☐ '}{t('Noch nicht erhalten – als geplant vormerken','Not received yet — mark as planned')}</Text></Pressable>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <FormSubmitButton disabled={busy} label={t('Einnahme speichern','Save income entry')} style={[s.button,s.primary]} textStyle={s.bold}/>
   </FormSection>
   <Text style={s.note}>{t('Dein reguläres Nettoeinkommen bleibt unverändert. Bei „Bis zum nächsten Gehalt“ zählen erhaltene Einnahmen über deinen aktuellen Kontostand.','Your regular net income stays unchanged. Until next payday uses received income through your current account balance.')}</Text>
   {!!entries.length&&<Text accessibilityRole="header" style={s.title}>{t('Deine zusätzlichen Einnahmen','Your additional income')}</Text>}
   {[...entries].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,shown).map(entry=><View key={entry.id} style={s.entry}>
    <View style={s.row}><Text style={[s.bold,s.flex]}>{entry.name||t('Zusätzliche Einnahme','Additional income')}</Text><Text style={s.bold}>+ {money(entry.amount)}</Text></View>
    <Text style={s.note}>{entry.date} · {entry.status==='received'?t('Erhalten','Received'):t('Geplant','Planned')}</Text>
    <View style={s.row}><Pressable accessibilityRole="button" disabled={busy} onPress={()=>edit(entry)} style={s.button}><Text>{t('Bearbeiten','Edit')}</Text></Pressable>{entry.status==='planned'&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>void work(()=>onSave({...entry,date:today,status:'received'}))} style={s.button}><Text>{t('Heute erhalten','Received today')}</Text></Pressable>}<Pressable accessibilityRole="button" disabled={busy} onPress={()=>Alert.alert(t('Diese Einnahme entfernen?','Remove this income entry?'),undefined,[{text:t('Abbrechen','Cancel'),style:'cancel'},{text:t('Entfernen','Remove'),style:'destructive',onPress:()=>void work(()=>onRemove(entry.id))}])} style={s.button}><Text>{t('Entfernen','Remove')}</Text></Pressable></View>
   </View>)}
   {entries.length>shown&&<Pressable accessibilityRole="button" onPress={()=>setShown(shown+10)} style={s.button}><Text>{t('Weitere Einnahmen anzeigen','Show more income entries')}</Text></Pressable>}
  </ScrollView></KeyboardScrollContext.Provider>
 </KeyboardAvoidingView></SafeAreaView></Modal>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f8f8f2'},header:{padding:16,flexDirection:'row',gap:12,alignItems:'center'},title:{fontSize:18,fontWeight:'700',color:'#17211f',flexShrink:1},content:{padding:20,gap:16},form:{gap:16},note:{fontSize:13,lineHeight:20,color:'#52605b'},button:{minHeight:44,padding:12,justifyContent:'center',borderRadius:16,borderWidth:1,borderColor:'#cddbd0'},primary:{backgroundColor:'#dcf8e8'},bold:{fontWeight:'700',color:'#17211f'},entry:{paddingTop:16,gap:8,borderTopWidth:1,borderColor:'#dfe5dd'},row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},flex:{flex:1},error:{color:'#ad2727'}});
