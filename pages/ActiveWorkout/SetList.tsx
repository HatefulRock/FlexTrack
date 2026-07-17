import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calculator, Check, MessageSquarePlus, Pause, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Exercise, SetLog } from '../../types';
import { formatTime, parseTimeString } from '../../utils/time';
import { theme } from '../../constants/theme';

interface Props { exercise: Exercise; sets: SetLog[]; historySets?: SetLog[]; exerciseIndex: number; timers: Record<string,number>; timerRunning: Record<string,boolean>; onUpdateSet:(index:number,field:keyof SetLog,value:SetLog[keyof SetLog])=>void; onSetDefaultWeight:(weight:number)=>void; onToggleComplete:(index:number)=>void; onToggleTimer:(index:number)=>void; }

export const SetList=({exercise,sets,historySets,exerciseIndex,timers,timerRunning,onUpdateSet,onSetDefaultWeight,onToggleComplete,onToggleTimer}:Props)=>{
  const [notes,setNotes]=useState<Record<string,boolean>>({});
  const [defaultCandidate,setDefaultCandidate]=useState<{exerciseId:string;setIndex:number}|null>(null);
  const previous=(i:number)=>{const h=historySets?.[i];if(!h)return 'No previous set';if(exercise.type==='reps')return exercise.loadMode==='bodyweight'?`${h.reps||0} reps`:`${h.weight||0} kg × ${h.reps||0}`;if(exercise.type==='distance')return `${h.distance||0} ${exercise.targetDistanceUnit||'km'} · ${formatTime(h.durationSeconds||0)}`;return formatTime(h.durationSeconds||0)};
  const plates=(weight:number)=>{if(weight<=20)return Alert.alert('Plate calculator','Use the empty 20 kg bar.');let left=(weight-20)/2;const result:number[]=[];[25,20,15,10,5,2.5,1.25].forEach(p=>{while(left>=p){result.push(p);left-=p}});Alert.alert('Load each side',result.length?result.map(p=>`${p} kg`).join(' + '):'No plates needed')};
  const complete=(i:number)=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);onToggleComplete(i)};
  return <View style={styles.list}>{sets.map((set,i)=>{
    const key=`${exerciseIndex}-${i}`,running=timerRunning[key],elapsed=timers[key]||0;
    const changedWeight=defaultCandidate?.exerciseId===exercise.id&&defaultCandidate.setIndex===i&&exercise.type==='reps'&&(exercise.loadMode||'external')!=='bodyweight'&&typeof set.weight==='number'&&Number.isFinite(set.weight)&&set.weight!==(exercise.targetWeight??0);
    return <View key={key} style={[styles.card,set.completed&&styles.cardDone]}>
      <View style={styles.cardTop}><View style={[styles.number,set.completed&&styles.numberDone]}><Text style={[styles.numberText,set.completed&&styles.numberTextDone]}>{set.setNumber}</Text></View><View style={styles.previous}><Text style={styles.previousLabel}>PREVIOUS</Text><Text style={styles.previousValue}>{previous(i)}</Text></View>
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked:set.completed}} accessibilityLabel={`Complete set ${set.setNumber}`} onPress={()=>complete(i)} style={[styles.check,set.completed&&styles.checkDone]}><Check size={22} color={set.completed?theme.colors.canvas:theme.colors.textSubtle} strokeWidth={3}/></TouchableOpacity></View>
      <View style={styles.fields}>
        {exercise.type==='reps'&&<><Field label="REPS" value={set.reps?.toString()||''} placeholder={exercise.targetReps?.toString()||'0'} onChange={v=>onUpdateSet(i,'reps',parseFloat(v)||0)}/>
          {(exercise.loadMode||'external')!=='bodyweight'&&<View style={styles.weightWrap}><Field label={exercise.loadMode==='assisted'?'ASSISTANCE (KG)':'WEIGHT (KG)'} value={set.weight?.toString()||''} placeholder={exercise.targetWeight?.toString()||'0'} onChange={v=>{setDefaultCandidate({exerciseId:exercise.id,setIndex:i});onUpdateSet(i,'weight',parseFloat(v)||0)}}/>{exercise.loadMode!=='assisted'&&<TouchableOpacity accessibilityLabel="Open plate calculator" onPress={()=>plates(set.weight||0)} style={styles.calc}><Calculator size={16} color={theme.colors.textMuted}/></TouchableOpacity>}</View>}</>}
        {exercise.type==='distance'&&<><Field label={`DISTANCE (${(exercise.targetDistanceUnit||'km').toUpperCase()})`} value={set.distance?.toString()||''} placeholder={exercise.targetDistance?.toString()||'0'} onChange={v=>onUpdateSet(i,'distance',parseFloat(v)||0)}/><Field label="TIME" value={set.durationSeconds?formatTime(set.durationSeconds):''} placeholder="0:00" keyboard="default" onChange={v=>onUpdateSet(i,'durationSeconds',parseTimeString(v))}/></>}
        {exercise.type==='timer'&&<TouchableOpacity onPress={()=>onToggleTimer(i)} style={[styles.timer,running&&styles.timerRunning]}>{running?<Pause size={20} color={theme.colors.danger}/>:<Play size={20} color={theme.colors.primary}/>}<Text style={styles.timerText}>{formatTime(elapsed)}</Text><Text style={styles.timerHint}>{running?'Pause':'Start timer'}</Text></TouchableOpacity>}
      </View>
      {changedWeight&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={`Use ${set.weight} kilograms as the default for ${exercise.name}`} onPress={()=>{setDefaultCandidate(null);onSetDefaultWeight(set.weight as number)}} style={styles.defaultAction}>
        <Text style={styles.defaultActionText}>Use {set.weight} kg as default {exercise.loadMode==='assisted'?'assistance':'weight'}</Text>
        <Text style={styles.defaultActionHint}>Future workouts</Text>
      </TouchableOpacity>}
      {notes[key]?<TextInput autoFocus placeholder="Add a note for this set…" placeholderTextColor={theme.colors.textSubtle} value={set.notes||''} onChangeText={v=>onUpdateSet(i,'notes',v)} style={styles.noteInput}/>
        :<TouchableOpacity onPress={()=>setNotes(n=>({...n,[key]:true}))} style={styles.noteButton}><MessageSquarePlus size={15} color={theme.colors.textSubtle}/><Text style={styles.noteText}>{set.notes?'Edit note':'Add note'}</Text></TouchableOpacity>}
    </View>})}</View>;
};

const Field=({label,value,placeholder,onChange,keyboard='decimal-pad'}:{label:string;value:string;placeholder:string;onChange:(v:string)=>void;keyboard?:any})=><View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} value={value} placeholder={placeholder} placeholderTextColor={theme.colors.textSubtle} onChangeText={onChange} keyboardType={keyboard} selectTextOnFocus style={styles.input}/></View>;

const styles=StyleSheet.create({
  list:{gap:12},card:{padding:14,borderRadius:theme.radius.lg,backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border},cardDone:{backgroundColor:'rgba(52,211,153,0.06)',borderColor:'rgba(52,211,153,0.4)'},cardTop:{flexDirection:'row',alignItems:'center',marginBottom:13},
  number:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.surfaceElevated},numberDone:{backgroundColor:'rgba(52,211,153,0.14)'},numberText:{...theme.type.label,color:theme.colors.textSecondary},numberTextDone:{color:theme.colors.success},
  previous:{flex:1,marginLeft:10},previousLabel:{fontSize:9,fontWeight:'800',letterSpacing:1,color:theme.colors.textSubtle},previousValue:{...theme.type.caption,color:theme.colors.textSecondary,marginTop:2,fontFamily:Platform.OS==='ios'?'Menlo':'monospace'},check:{width:46,height:46,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.surfaceElevated,borderWidth:1,borderColor:theme.colors.borderStrong},checkDone:{backgroundColor:theme.colors.success,borderColor:theme.colors.success},
  fields:{flexDirection:'row',gap:10},field:{flex:1},fieldLabel:{fontSize:9,fontWeight:'800',letterSpacing:.8,color:theme.colors.textMuted,marginBottom:5},input:{height:48,borderRadius:12,backgroundColor:theme.colors.canvas,borderWidth:1,borderColor:theme.colors.borderStrong,color:theme.colors.text,textAlign:'center',fontSize:18,fontWeight:'700',fontVariant:['tabular-nums'],outlineStyle:'none'} as any,
  weightWrap:{flex:1,flexDirection:'row',alignItems:'flex-end'},weightWrapField:{flex:1},calc:{width:40,height:48,marginLeft:-40,alignItems:'center',justifyContent:'center'},timer:{flex:1,height:54,borderRadius:12,backgroundColor:theme.colors.canvas,borderWidth:1,borderColor:theme.colors.borderStrong,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10},timerRunning:{borderColor:theme.colors.danger},timerText:{fontSize:20,fontWeight:'800',fontVariant:['tabular-nums'],color:theme.colors.text},timerHint:{...theme.type.caption,color:theme.colors.textMuted,marginLeft:'auto'},
  defaultAction:{minHeight:40,marginTop:9,paddingHorizontal:11,borderRadius:10,backgroundColor:theme.colors.primarySoft,borderWidth:1,borderColor:'rgba(56, 189, 248, 0.3)',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},defaultActionText:{...theme.type.caption,color:theme.colors.primary,fontWeight:'700',flex:1},defaultActionHint:{fontSize:10,fontWeight:'700',color:theme.colors.textMuted,textTransform:'uppercase',letterSpacing:.5},
  noteButton:{minHeight:38,flexDirection:'row',alignItems:'center',gap:6,marginTop:7},noteText:{...theme.type.caption,color:theme.colors.textSubtle},noteInput:{minHeight:42,marginTop:9,borderRadius:10,backgroundColor:theme.colors.canvas,borderWidth:1,borderColor:theme.colors.border,color:theme.colors.textSecondary,paddingHorizontal:12}
});




