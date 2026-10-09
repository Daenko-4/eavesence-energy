import {StyleSheet,View} from 'react-native';
export function NavIcon({name,color}:{name:'month'|'costs'|'plan'|'calculator';color:string}){
 const border={borderColor:color};
 if(name==='plan')return <View accessible={false} style={s.bars}>{[10,18,14].map((height,i)=><View key={i} style={[s.bar,border,{height}]}/>)}</View>;
 if(name==='month')return <View accessible={false} style={[s.calendar,border]}><View style={[s.calendarLine,{backgroundColor:color}]}/><View style={[s.ring,{left:4,backgroundColor:color}]}/><View style={[s.ring,{right:4,backgroundColor:color}]}/></View>;
 if(name==='calculator')return <View accessible={false} style={[s.calculator,border]}><View style={[s.display,border]}/><View style={s.keys}>{Array.from({length:6},(_,i)=><View key={i} style={[s.dot,{backgroundColor:color}]}/>)}</View></View>;
 return <View accessible={false} style={[s.list,border]}>{[11,11,7].map((width,i)=><View key={i} style={[s.line,{width,backgroundColor:color}]}/>)}</View>;
}
const s=StyleSheet.create({calendar:{width:22,height:21,borderWidth:1.5,borderRadius:4,marginTop:3},calendarLine:{position:'absolute',top:5,left:0,right:0,height:1.5},ring:{position:'absolute',top:-4,width:1.5,height:7,borderRadius:1},list:{width:19,height:23,borderWidth:1.5,borderRadius:3,padding:3,gap:4,justifyContent:'center'},line:{height:1.5,borderRadius:1},bars:{width:23,height:24,flexDirection:'row',alignItems:'flex-end',gap:3,paddingBottom:1},bar:{width:5,borderWidth:1.5,borderRadius:2},calculator:{width:19,height:24,borderWidth:1.5,borderRadius:3,padding:3,gap:3},display:{height:5,borderWidth:1,borderRadius:1},keys:{flexDirection:'row',flexWrap:'wrap',gap:2},dot:{width:2.5,height:2.5,borderRadius:.5}});
