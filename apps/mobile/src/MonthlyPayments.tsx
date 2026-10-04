import {useState} from "react";
import {DisclosureIcon} from "./BrandMotion";
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePaymentChecklist } from '@eavesence/core/usePaymentChecklist';
import { paymentKey } from '@eavesence/core/paymentChecklist';
import type { HouseholdCost } from '@eavesence/core/householdCosts';
import type { PlanningData } from '@eavesence/core/planning';

type Props = {costs:HouseholdCost[];data?:PlanningData;onSave:(data:PlanningData)=>void|Promise<void>;locale:'de'|'en';currency:string;onEdit:(cost:HouseholdCost)=>void;onAdd:()=>void};
export function MonthlyPayments({costs,data,onSave,locale,currency,onEdit,onAdd}:Props) {
  const [open,setOpen]=useState(true);
  const de=locale==='de',t=(a:string,b:string)=>de?a:b;
  const c=usePaymentChecklist(costs,data,onSave,de);
  const money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
  const monthLabel=new Intl.DateTimeFormat(de?'de-AT':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${c.month}-01T00:00:00Z`));
  const dateLabel=(date:string)=>new Intl.DateTimeFormat(de?'de-AT':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));
  return <View style={s.section} accessibilityLabel={t('Monatscheckliste','Monthly checklist')}>
    <View style={s.header}><Text style={s.caption}>{c.month===c.current?t('Dieser Monat','This month'):t('Zahlungen im Monat','Payments this month')}</Text><View style={s.monthRow}><Text accessibilityRole="header" style={s.title}>{monthLabel}</Text><View style={s.buttons}><Pressable accessibilityRole="button" accessibilityLabel={t('Vorheriger Monat','Previous month')} onPress={c.previous} style={s.arrow}><Text style={s.arrowText}>‹</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={t('Nächster Monat','Next month')} onPress={c.next} style={s.arrow}><Text style={s.arrowText}>›</Text></Pressable></View></View>
      {c.month!==c.current&&<Pressable accessibilityRole="button" onPress={c.reset} style={s.today}><Text style={s.caption}>{t('Zum aktuellen Monat','Back to this month')}</Text></Pressable>}
      <Text style={s.caption}>{t('Noch zu bezahlen','Still to pay')}{c.missing.length>0?` · ${t('unvollständig','incomplete')}`:''}</Text><Text style={s.amount}>{c.payments.length?money(c.openTotal):'—'}</Text><Text style={s.caption}>{c.payments.length-c.open.length} {t('von','of')} {c.payments.length} {t('bezahlt','paid')} · {money(c.paidTotal)}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={s.disclosure}><Text style={s.disclosureText}>{t("Zahlungen abhaken","Check off payments")}</Text><DisclosureIcon open={open} color="#72dca3"/></Pressable>
    {open&&<View style={s.body}><Text style={s.note}>{t('Abgebucht oder bezahlt? Hake die Zahlung ab. Die nächste Zahlung bleibt offen.','Debited or paid? Check it off. The next payment stays open.')}</Text>
      {c.payments.map(p=>{const paid=c.isPaid(p);return <View key={paymentKey({costId:p.cost.id,month:p.month,date:p.date})} style={s.row}><Pressable accessibilityRole="checkbox" accessibilityState={{checked:paid,disabled:c.busy}} disabled={c.busy} accessibilityLabel={`${p.cost.name}, ${p.date?dateLabel(p.date):monthLabel}, ${money(p.cost.amount)}, ${t('Bezahlt','Paid')}`} onPress={()=>void c.toggle(p)} style={s.payment}><View style={[s.check,paid&&s.checked]}><Text style={s.checkText}>{paid?'✓':''}</Text></View><View style={s.nameColumn}><Text style={[s.name,paid&&s.paidName]}>{p.cost.name}</Text><Text style={s.small}>{p.date?dateLabel(p.date):t('Monatlich · Termin fehlt','Monthly · date missing')}{paid?` · ${t('Bezahlt','Paid')}`:''}</Text></View><Text style={[s.value,paid&&s.paidValue]}>{money(p.cost.amount)}</Text></Pressable>{!p.date&&<Pressable accessibilityRole="button" accessibilityLabel={`${p.cost.name} · ${t('Termin ergänzen','Add date')}`} onPress={()=>onEdit(p.cost)} style={s.dateAction}><Text style={s.link}>{t('Termin','Date')}</Text></Pressable>}</View>})}
      {!c.payments.length&&<Text style={s.note}>{costs.length?t('Keine Zahlungen für diesen Monat eingeplant.','No payments scheduled for this month.'):t('Füge deine erste regelmäßige Ausgabe hinzu.','Add your first recurring cost.')}</Text>}
      {c.error&&<Text accessibilityRole="alert" style={s.error}>{c.error}</Text>}
      {c.missing.length>0&&<View style={s.missing}><Text style={s.note}>{t('Diese Kosten brauchen einen Termin, damit wir wissen, in welchem Monat sie anfallen. Sie fehlen im Betrag oben.','These costs need a date so we know which month they fall in. They are excluded from the amount above.')}</Text>{c.missing.map(cost=><Pressable accessibilityRole="button" key={cost.id} onPress={()=>onEdit(cost)} style={s.dateAction}><Text style={s.link}>{cost.name} · {t('Termin ergänzen','Add date')}</Text></Pressable>)}</View>}
      {c.payments.some(p=>!p.date)&&<Text style={s.small}>{t('Monatliche Kosten ohne Termin zählen einmal pro Monat. Mit einem Datum siehst du auch, wann sie anstehen.','Monthly costs without a date count once each month. Add a date to see when they are due.')}</Text>}
      <Text style={s.small}>{t('Deine manuelle Checkliste, ohne Bankabgleich. Kein Kontostand.','Your manual checklist, without bank verification. Not an account balance.')}</Text>
      {!costs.length&&<Pressable accessibilityRole="button" onPress={onAdd} style={s.dateAction}><Text style={s.link}>{t('Kosten hinzufügen','Add cost')}</Text></Pressable>}
    </View>}
  </View>;
}
const s=StyleSheet.create({
  section:{borderWidth:1,borderColor:'#dfe5dd',borderRadius:16,overflow:'hidden',backgroundColor:'#fff',marginBottom:16},
  header:{backgroundColor:'#24272c',padding:16,gap:4},caption:{fontSize:12,lineHeight:18,color:'#d1d7d4'},
  monthRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:12},title:{fontSize:20,fontWeight:'700',color:'#fff',flex:1},buttons:{flexDirection:'row',gap:6},arrow:{minWidth:44,minHeight:44,borderRadius:24,borderWidth:1,borderColor:'#65716d',alignItems:'center',justifyContent:'center'},arrowText:{fontSize:24,color:'#fff'},today:{minHeight:44,justifyContent:'center',marginBottom:8},
  disclosure:{minHeight:48,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#24272c",borderTopWidth:1,borderTopColor:"#464c53"},disclosureText:{fontSize:12,fontWeight:"600",color:"#fff"},
  amount:{fontSize:28,fontWeight:'800',color:'#72dca3',letterSpacing:-.6},body:{padding:16,gap:10},note:{fontSize:12,lineHeight:19,color:'#65716d'},small:{fontSize:11,lineHeight:17,color:'#65716d'},row:{flexDirection:'row',gap:4,borderBottomWidth:1,borderBottomColor:'#e7ebe5'},payment:{flex:1,minHeight:56,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8},check:{width:24,height:24,borderRadius:6,borderWidth:1,borderColor:'#65716d',alignItems:'center',justifyContent:'center'},checked:{backgroundColor:'#28734d',borderColor:'#28734d'},checkText:{color:'#fff',fontSize:16,fontWeight:'700'},nameColumn:{flex:1},name:{fontSize:13,fontWeight:'600',color:'#17211f'},paidName:{textDecorationLine:'line-through',color:'#65716d'},value:{fontSize:13,fontWeight:'600',color:'#17211f',flexShrink:1,textAlign:'right',maxWidth:'35%'},paidValue:{color:'#65716d'},dateAction:{minHeight:44,paddingHorizontal:4,justifyContent:'center'},link:{fontSize:11,fontWeight:'600',color:'#28734d'},missing:{padding:12,backgroundColor:'#f4f6f2',borderRadius:12,gap:4},error:{fontSize:12,color:'#b42318'},
});
