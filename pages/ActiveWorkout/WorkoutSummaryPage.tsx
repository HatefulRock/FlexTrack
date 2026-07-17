import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Clock3, Dumbbell, Layers3, TrendingUp } from 'lucide-react-native';
import { WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { Button, Card, SectionHeader } from '../../components/ui/Primitives';

export const WorkoutSummaryPage=({log,onDone}:{log:WorkoutLog;onDone:()=>void})=>{
 const durationSeconds=Math.max(0,Math.round(((log.endTime||log.startTime)-log.startTime)/1000)),durationLabel=durationSeconds<60?`${durationSeconds}s`:`${Math.floor(durationSeconds/60)}m`;
 const completedExercises=log.exercises.filter(e=>e.completed||e.sets.every(s=>s.completed)).length,totalSets=log.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).length,0);
 const volume=log.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).reduce((x,s)=>x+(s.weight||0)*(s.reps||0),0),0);
 return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
  <View style={styles.hero}><View style={styles.check}><Check size={34} color={theme.colors.canvas} strokeWidth={3}/></View><Text style={styles.eyebrow}>SESSION SAVED</Text><Text style={styles.title}>Strong work.</Text><Text style={styles.subtitle}>{log.templateName}</Text></View>
  <View style={styles.content}><View style={styles.metrics}><Metric icon={Clock3} value={durationLabel} label="Duration"/><Metric icon={Dumbbell} value={`${completedExercises}/${log.exercises.length}`} label="Exercises"/><Metric icon={Layers3} value={String(totalSets)} label="Sets"/></View>
   {volume>0&&<Card style={styles.volume}><View style={styles.volumeIcon}><TrendingUp size={20} color={theme.colors.energy}/></View><View><Text style={styles.volumeLabel}>TOTAL VOLUME</Text><Text style={styles.volumeValue}>{volume.toLocaleString()} kg</Text></View></Card>}
   <View><SectionHeader title="Session breakdown"/><Card style={styles.breakdown}>{log.exercises.map((e,i)=>{const count=e.sets.filter(s=>s.completed).length,done=count===e.sets.length;return <View key={e.exerciseId||i} style={[styles.exercise,i>0&&styles.exerciseBorder]}><View style={[styles.status,done&&styles.statusDone]}>{done&&<Check size={14} color={theme.colors.canvas} strokeWidth={3}/>}</View><View style={styles.exerciseCopy}><Text style={[styles.exerciseName,!count&&styles.exerciseMuted]}>{e.exerciseName}</Text><Text style={styles.exerciseMeta}>{count} of {e.sets.length} sets completed</Text></View><Text style={[styles.result,done&&styles.resultDone]}>{done?'Done':count?'Partial':'Skipped'}</Text></View>})}</Card></View>
   <Button label="View workout history" onPress={onDone}/>
  </View>
 </ScrollView>
};
const Metric=({icon:Icon,value,label}:any)=><Card style={styles.metric}><Icon size={18} color={theme.colors.primary}/><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Card>;
const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:theme.colors.canvas},scroll:{paddingBottom:40},hero:{alignItems:'center',paddingTop:44,paddingBottom:28,paddingHorizontal:20},check:{width:64,height:64,borderRadius:32,backgroundColor:theme.colors.success,alignItems:'center',justifyContent:'center',marginBottom:18},eyebrow:{...theme.type.caption,color:theme.colors.success,letterSpacing:1.8},title:{...theme.type.display,color:theme.colors.text,marginTop:4},subtitle:{...theme.type.body,color:theme.colors.textMuted,marginTop:4},
 content:{paddingHorizontal:16,gap:20,maxWidth:620,width:'100%',alignSelf:'center'},metrics:{flexDirection:'row',gap:10},metric:{flex:1,alignItems:'center',padding:13,gap:5},metricValue:{fontSize:21,fontWeight:'800',color:theme.colors.text,fontVariant:['tabular-nums']},metricLabel:{...theme.type.caption,color:theme.colors.textMuted},
 volume:{flexDirection:'row',alignItems:'center',gap:13},volumeIcon:{width:42,height:42,borderRadius:13,backgroundColor:theme.colors.energySoft,alignItems:'center',justifyContent:'center'},volumeLabel:{fontSize:9,fontWeight:'800',letterSpacing:1.2,color:theme.colors.textMuted},volumeValue:{...theme.type.heading,color:theme.colors.energy,marginTop:2},breakdown:{padding:0,overflow:'hidden'},exercise:{minHeight:64,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10},exerciseBorder:{borderTopWidth:1,borderTopColor:theme.colors.border},status:{width:24,height:24,borderRadius:8,borderWidth:1,borderColor:theme.colors.borderStrong,alignItems:'center',justifyContent:'center'},statusDone:{backgroundColor:theme.colors.success,borderColor:theme.colors.success},exerciseCopy:{flex:1},exerciseName:{...theme.type.label,color:theme.colors.text},exerciseMuted:{color:theme.colors.textMuted},exerciseMeta:{...theme.type.caption,color:theme.colors.textSubtle,marginTop:2},result:{...theme.type.caption,color:theme.colors.warning},resultDone:{color:theme.colors.success}
});

