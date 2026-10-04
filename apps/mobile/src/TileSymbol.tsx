import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { tileSymbols, tileSymbolLabel, type TileSymbol as SymbolKey } from '@eavesence/core/tileSymbols';
import { tileSymbolImages } from './tileSymbolImages';
import { DisclosureIcon } from './BrandMotion';

export function TileSymbol({icon,color='#17211f',style}:{icon:SymbolKey|null;color?:string;style?:StyleProp<ImageStyle>}) {
  return icon?<Image alt="" source={tileSymbolImages[icon]} accessible={false} style={[s.icon,{tintColor:color},style]}/>:null;
}
export function TileSymbolPicker({value,onChange,locale}:{value:SymbolKey|null;onChange:(icon:SymbolKey|null)=>void;locale:'de'|'en'}) {
  const [open,setOpen]=useState(false);
  const choices=[{key:null,de:'Ohne Symbol',en:'No icon'},...tileSymbols];
  return <View style={s.picker}><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={s.summary}><View style={s.summaryName}><TileSymbol icon={value}/><Text style={s.summaryText}>{locale==='de'?'Symbol':'Icon'}: {tileSymbolLabel(value,locale)}</Text></View><DisclosureIcon open={open}/></Pressable>
    {open&&<View accessibilityLabel={locale==='de'?'Symbol auswählen':'Choose icon'} style={s.choices}>{choices.map(choice=><Pressable key={choice.key??'none'} accessibilityRole="button" accessibilityLabel={choice[locale]} accessibilityState={{selected:choice.key===value}} onPress={()=>{onChange(choice.key);setOpen(false);}} style={[s.choice,choice.key===value&&s.selected]}>{choice.key?<TileSymbol icon={choice.key} style={s.choiceIcon}/>:<Text style={s.none}>—</Text>}<Text style={s.choiceLabel}>{choice[locale]}</Text></Pressable>)}</View>}
  </View>;
}
const s=StyleSheet.create({icon:{width:18,height:18},picker:{gap:8},summary:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,paddingHorizontal:12,borderWidth:1,borderColor:'#dfe5dd',borderRadius:12,backgroundColor:'#fff'},summaryName:{flexDirection:'row',alignItems:'center',gap:8,flex:1},summaryText:{fontSize:12,fontWeight:'600',color:'#17211f',flexShrink:1},choices:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{width:'30%',minHeight:72,borderWidth:1,borderColor:'#dfe5dd',borderRadius:12,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',padding:6,gap:4},selected:{borderColor:'#28734d',backgroundColor:'#dcfce8'},choiceIcon:{width:20,height:20},choiceLabel:{fontSize:11,lineHeight:16,textAlign:'center',color:'#52605b'},none:{fontSize:16,lineHeight:20,color:'#52605b'}});
