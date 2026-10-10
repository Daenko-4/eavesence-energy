import {createContext} from 'react';
import {type ScrollView,type TextInput,type View} from 'react-native';
export const ScrollTargetContext=createContext<(target:View|null)=>void>(()=>{});
export function revealInput(scroll:ScrollView|null,input:TextInput) {
  // Clearance includes the input accessory toolbar plus breathing room.
  scroll?.scrollResponderScrollNativeHandleToKeyboard(input,160,true);
}
export function revealSection(scroll:ScrollView|null,target:View|null) {
  const inner=scroll?.getInnerViewNode();
  if(inner!=null&&target)target.measureLayout(inner,(_x,y)=>scroll?.scrollTo({y:Math.max(0,y-16),animated:true}),()=>{});
}
