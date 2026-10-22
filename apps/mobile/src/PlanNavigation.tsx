import type { ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text, useMobileLocale } from './i18n';
import { NavIcon } from './NavIcon';

export type PlanPeriod = 'payday' | 'forecast' | 'budget';
export type PlanTool = 'change' | 'switch' | 'annual' | 'reserves' | 'invoices';
export type PlanGoal = 'payday' | 'savings' | 'progress';

export function PlanView({ visible, children }: { visible: boolean; children: ReactNode }) {
  return <View accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'} style={!visible && styles.hidden}>{children}</View>;
}

export function PlanNavigation<T extends PlanPeriod | PlanTool | PlanGoal>({ kind, value, onChange }: { kind: 'goal' | 'period' | 'tool'; value: T; onChange: (value: T) => void }) {
  const de = useMobileLocale() === 'de';
  const items: { key: string; label: string; accessible?: string; icon?: 'month' | 'costs' | 'plan' }[] = kind === 'goal' ? [
    {key:'payday',label:de?'Geld planen':'Plan money',accessible:de?'Bis zum Gehalt ausgeben':'Spend until payday',icon:'month'},
    {key:'savings',label:de?'Kosten senken':'Lower costs',accessible:de?'Realistisch sparen':'Find realistic savings',icon:'costs'},
    {key:'progress',label:de?'Erspart':'Savings achieved',accessible:de?'Erreichte Ersparnis':'Savings achieved',icon:'plan'},
  ] : kind === 'period' ? [
    {key:'payday',label:de?'Bis zum Gehalt':'Until payday'},
    {key:'forecast',label:de?'90-Tage-Vorschau':'90-day outlook'},
    {key:'budget',label:de?'Monatsbudget':'Monthly budget'},
  ] : [
    {key:'change',label:de?'Kosten prüfen':'Review costs'},
    {key:'switch',label:de?'Tarifwechsel':'Switch plans'},
    {key:'annual',label:de?'Jahresabo':'Annual plans'},
    {key:'reserves',label:de?'Rücklagen':'Bill reserves'},
    {key:'invoices',label:de?'Planbeträge':'Invoice amounts'},
  ];
  return <View accessibilityRole="tablist" accessibilityLabel={kind==='goal' ? de?'Planungsfrage wählen':'Choose planning question' : kind==='period' ? de?'Planungszeitraum wählen':'Choose planning period' : de?'Sparwerkzeug wählen':'Choose savings tool'} style={[styles.row,kind==='goal'&&styles.goals]}>
    {items.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.accessible??item.label} accessibilityState={{selected:value===item.key}} onPress={()=>{Keyboard.dismiss();onChange(item.key as T);}} style={[styles.choice,kind==='goal'&&styles.goal,value===item.key&&(kind==='goal'?styles.goalSelected:styles.selected)]}>
      {item.icon&&<NavIcon name={item.icon} color={value===item.key?'#72dca3':'#52605b'}/>}
      <Text style={[styles.label,kind==='goal'&&styles.goalLabel,value===item.key&&(kind==='goal'?styles.goalLabelSelected:styles.labelSelected)]}>{item.label}</Text>
    </Pressable>)}
  </View>;
}

const styles=StyleSheet.create({
  hidden:{display:'none'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:4,borderBottomWidth:1,borderColor:'#dfe5dd',marginBottom:16},
  goals:{flexWrap:'nowrap',padding:4,borderBottomWidth:0,borderRadius:14,backgroundColor:'#e9ede7',marginTop:18,marginBottom:16},
  choice:{flexGrow:1,flexBasis:100,minHeight:44,paddingVertical:10,paddingHorizontal:8,borderBottomWidth:2,borderColor:'transparent',alignItems:'center',justifyContent:'center'},
  goal:{flex:1,flexBasis:0,minHeight:70,borderBottomWidth:0,borderRadius:10,gap:7},
  selected:{backgroundColor:'#eefbf3',borderColor:'#28734d'},
  goalSelected:{backgroundColor:'#24272c'},
  label:{fontSize:12,lineHeight:17,fontWeight:'600',color:'#65716d',textAlign:'center',flexShrink:1},
  labelSelected:{color:'#1e6843'},
  goalLabel:{fontWeight:'700'},
  goalLabelSelected:{color:'#72dca3'},
});
