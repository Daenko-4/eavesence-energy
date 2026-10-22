import type { ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text, useMobileLocale } from './i18n';
import { DisclosureIcon } from './BrandMotion';

export type PlanPeriod = 'payday' | 'forecast' | 'budget';
export type PlanTool = 'change' | 'switch' | 'annual' | 'reserves' | 'invoices';
export type PlanGoal = 'payday' | 'savings' | 'progress';

export function PlanView({ visible, children }: { visible: boolean; children: ReactNode }) {
  return <View accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'} style={!visible && styles.hidden}>{children}</View>;
}

export function PlanNavigation<T extends PlanPeriod | PlanTool | PlanGoal>({ kind, value, onChange }: { kind: 'goal' | 'period' | 'tool'; value: T; onChange: (value: T) => void }) {
  const de = useMobileLocale() === 'de';
  const items: { key: string; label: string; accessible?: string }[] = kind === 'goal' ? [
    {key:'payday',label:de?'Geld planen':'Plan money',accessible:de?'Bis zum Gehalt ausgeben':'Spend until payday'},
    {key:'savings',label:de?'Kosten senken':'Lower costs',accessible:de?'Realistisch sparen':'Find realistic savings'},
    {key:'progress',label:de?'Erspart':'Savings achieved',accessible:de?'Erreichte Ersparnis':'Savings achieved'},
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
      <Text style={[styles.label,kind==='goal'&&styles.goalLabel,value===item.key&&(kind==='goal'?styles.goalLabelSelected:styles.labelSelected)]}>{item.label}</Text>
      {kind==='goal'&&<DisclosureIcon open={value===item.key} color={value===item.key?'#72dca3':'#28734d'}/>}
    </Pressable>)}
  </View>;
}

const styles=StyleSheet.create({
  hidden:{display:'none'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:4,borderBottomWidth:1,borderColor:'#dfe5dd',marginBottom:16},
  goals:{paddingBottom:8,marginTop:8,marginBottom:12},
  choice:{flexGrow:1,flexBasis:100,minHeight:44,paddingVertical:10,paddingHorizontal:8,borderRadius:10,alignItems:'center',justifyContent:'center'},
  goal:{flex:1,flexBasis:0,minHeight:52,flexDirection:'row',gap:6},
  selected:{backgroundColor:'#24272c'},
  goalSelected:{backgroundColor:'#24272c'},
  label:{fontSize:12,lineHeight:17,fontWeight:'600',color:'#65716d',textAlign:'center',flexShrink:1},
  labelSelected:{color:'#72dca3'},
  goalLabel:{fontWeight:'600'},
  goalLabelSelected:{color:'#72dca3'},
});
