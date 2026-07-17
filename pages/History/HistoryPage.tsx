import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, Clock3, Flame, History as HistoryIcon } from 'lucide-react-native';
import { format, isSameDay, subDays } from 'date-fns';
import { Header } from '../../components/layout/Header';
import { Card, Chip, EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { LogItem } from './LogItem';

export const HistoryPage=({logs}:{logs:WorkoutLog[]})=>{
 const [filter,setFilter]=useState('All'),[selected,setSelected]=useState<Date|null>(null);
 const options=useMemo(()=>['All',...Array.from(new Set(logs.map(l=>l.templateName)))],[logs]);
 const stats=useMemo(()=>{const avg=logs.length?Math.round(logs.reduce((n,l)=>n+((l.endTime||l.startTime)-l.startTime),0)/logs.length/60000):0;let streak=0,day=new Date();while(logs.some(l=>isSameDay(new Date(l.startTime),day))){streak++;day=subDays(day,1)}return{avg,streak}},[logs]);
 const shown=useMemo(()=>logs.filter(l=>(filter==='All'||l.templateName===filter)&&(!selected||isSameDay(new Date(l.startTime),selected))).sort((a,b)=>b.startTime-a.startTime),[logs,filter,selected]);
 const grouped=useMemo(()=>shown.reduce<Record<string,WorkoutLog[]>>((all,l)=>{const key=format(new Date(l.startTime),'MMMM yyyy');(all[key]??=[]).push(l);return all},{}),[shown]);
 return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Header title="History"/><View style={styles.content}>
   <ActivityGrid logs={logs} selected={selected} onSelect={d=>setSelected(selected&&isSameDay(selected,d)?null:d)}/>
   <View style={styles.stats}><Stat icon={CalendarDays} value={String(logs.length)} label="Workouts"/><Stat icon={Clock3} value={`${stats.avg}m`} label="Average"/><Stat icon={Flame} value={String(stats.streak)} label="Streak" energy/></View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{options.map(o=><Chip key={o} label={o} active={filter===o} onPress={()=>setFilter(o)}/>)}</ScrollView>
   {selected&&<TouchableOpacity onPress={()=>setSelected(null)} style={styles.selection}><Text style={styles.selectionText}>Showing {format(selected,'EEEE, MMM d')}</Text><Text style={styles.clear}>Clear</Text></TouchableOpacity>}
   {!logs.length?<EmptyState icon={HistoryIcon} title="Your history begins here" message="Completed workouts will appear here with volume, duration, and exercise details."/>:
    !shown.length?<EmptyState icon={CalendarDays} title="No workouts found" message="There are no sessions matching this date and routine filter." action="Clear filters" onAction={()=>{setFilter('All');setSelected(null)}}/>:
    Object.entries(grouped).map(([month,items])=><View key={month}><SectionHeader title={month}/><View style={styles.list}>{items.map(l=><LogItem key={l.id} log={l}/>)}</View></View>)}
 </View></ScrollView>
};
const ActivityGrid=({logs,selected,onSelect}:{logs:WorkoutLog[];selected:Date|null;onSelect:(d:Date)=>void})=>{
 const days=Array.from({length:28},(_,i)=>subDays(new Date(),27-i));
 return <Card><View style={styles.gridHeader}><View><Text style={styles.gridTitle}>Last 28 days</Text><Text style={styles.gridSub}>Tap a day to filter your sessions</Text></View><View style={styles.legend}><View style={styles.legendDot}/><Text style={styles.legendText}>Trained</Text></View></View><View style={styles.grid}>{days.map(d=>{const trained=logs.some(l=>isSameDay(new Date(l.startTime),d)),active=selected&&isSameDay(selected,d);return <TouchableOpacity accessibilityLabel={`${format(d,'MMMM d')}, ${trained?'workout completed':'no workout'}`} key={d.toISOString()} onPress={()=>onSelect(d)} style={[styles.day,trained&&styles.dayTrained,active&&styles.daySelected]}><Text style={[styles.dayText,trained&&styles.dayTextTrained]}>{format(d,'d')}</Text></TouchableOpacity>})}</View></Card>
};
const Stat=({icon:Icon,value,label,energy}:any)=><Card style={styles.stat}><Icon size={17} color={energy?theme.colors.energy:theme.colors.primary}/><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></Card>;
const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:theme.colors.canvas},scroll:{paddingBottom:110},content:{paddingHorizontal:16,gap:20,maxWidth:620,width:'100%',alignSelf:'center'},gridHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14},gridTitle:{...theme.type.label,color:theme.colors.text},gridSub:{...theme.type.caption,color:theme.colors.textMuted,marginTop:2},legend:{flexDirection:'row',alignItems:'center',gap:5},legendDot:{width:7,height:7,borderRadius:3.5,backgroundColor:theme.colors.success},legendText:{fontSize:10,color:theme.colors.textMuted},grid:{flexDirection:'row',flexWrap:'wrap',gap:7},day:{width:'11.7%',aspectRatio:1,borderRadius:8,backgroundColor:theme.colors.surfaceElevated,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'transparent'},dayTrained:{backgroundColor:'rgba(52,211,153,.18)'},daySelected:{borderColor:theme.colors.primary},dayText:{fontSize:10,fontWeight:'600',color:theme.colors.textSubtle},dayTextTrained:{color:theme.colors.success},
 stats:{flexDirection:'row',gap:9},stat:{flex:1,alignItems:'center',padding:12,gap:4},statValue:{fontSize:21,fontWeight:'800',color:theme.colors.text,fontVariant:['tabular-nums']},statLabel:{...theme.type.caption,color:theme.colors.textMuted},filters:{gap:8,paddingRight:12},selection:{height:42,borderRadius:12,backgroundColor:theme.colors.primarySoft,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},selectionText:{...theme.type.caption,color:theme.colors.primary},clear:{...theme.type.label,color:theme.colors.primary},list:{gap:10}
});

