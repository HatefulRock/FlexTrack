import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, LogOut, Zap } from 'lucide-react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { ExerciseLog, SetLog, WorkoutLog, WorkoutTemplate } from '../../types';
import { generateId } from '../../utils/helpers';
import { formatTime } from '../../utils/time';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { RestControl } from './RestControl';
import { ExerciseView } from './ExerciseView';
import { SetList } from './SetList';
import { Button, EmptyState } from '../../components/ui/Primitives';
import { theme } from '../../constants/theme';

interface Props { template: WorkoutTemplate; previousLogs: WorkoutLog[]; onUpdateTemplate: (template: WorkoutTemplate) => void; onFinish: (log: WorkoutLog | null) => void; }

export const ActiveWorkoutPage = ({ template, previousLogs, onUpdateTemplate, onFinish }: Props) => {
  useKeepAwake();
  const [startTime] = useState(Date.now());
  const [now,setNow]=useState(Date.now());
  const [activeExerciseIndex,setActiveExerciseIndex]=useState(0);
  const [restExpanded,setRestExpanded]=useState(false);
  const [logs,setLogs]=useState<ExerciseLog[]>(template.exercises.map(e=>({
    exerciseId:e.id,exerciseName:e.name,exerciseType:e.type,loadMode:e.type==='reps'?(e.loadMode||'external'):undefined,distanceUnit:e.targetDistanceUnit,completed:false,
    sets:Array.from({ length: Math.min(100, Math.max(1, Math.floor(e.targetSets ?? 1))) },(_,i)=>({setNumber:i+1,completed:false,reps:e.targetReps,weight:e.loadMode==='bodyweight'?undefined:e.targetWeight,distance:e.targetDistance,durationSeconds:e.targetDurationSeconds,notes:''}))
  })));
  const {timers,timerRunning,restTimer,isResting,toggleTimer,startRest,cancelRest,adjustRest}=useWorkoutTimer();
  const currentExercise=template.exercises[activeExerciseIndex], currentLog=logs[activeExerciseIndex];

  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
  const historySets=useMemo(()=>{
    if(!currentExercise)return undefined;
    const prior=[...previousLogs].sort((a,b)=>(b.endTime||b.startTime)-(a.endTime||a.startTime)).find(l=>l.exercises.some(e=>e.exerciseId===currentExercise.id));
    return prior?.exercises.find(e=>e.exerciseId===currentExercise.id)?.sets;
  },[currentExercise,previousLogs]);

  const finishWorkout=()=>{cancelRest();onFinish({id:generateId(),templateId:template.id,templateName:template.name,source:'routine',startTime,endTime:Date.now(),exercises:logs.map((e,eIndex)=>({...e,sets:e.sets.map((set,setIndex)=>{const elapsed=timers[`${eIndex}-${setIndex}`]||0;return e.exerciseType==='timer'&&elapsed>0?{...set,durationSeconds:elapsed}:set}),completed:e.sets.length>0&&e.sets.every(s=>s.completed)}))})};
  const confirmExit=()=>Alert.alert('Leave this workout?','You can save completed sets or discard this session.',[
    {text:'Keep training',style:'cancel'},{text:'Discard',style:'destructive',onPress:()=>onFinish(null)},{text:'Save & end',onPress:finishWorkout}
  ]);
  const confirmExitRef=useRef(confirmExit);
  confirmExitRef.current=confirmExit;

  useEffect(()=>{const handler=BackHandler.addEventListener('hardwareBackPress',()=>{if(Keyboard.isVisible?.()){Keyboard.dismiss();return true}if(restExpanded){setRestExpanded(false);return true}confirmExitRef.current();return true});return()=>handler.remove()},[restExpanded]);

  const toggleSetComplete=(i:number)=>{
    const key=`${activeExerciseIndex}-${i}`, wasRunning=timerRunning[key]===true;
    setLogs(current=>current.map((exercise,eIndex)=>{
      if(eIndex!==activeExerciseIndex)return exercise;
      const sets=exercise.sets.map((set,sIndex)=>sIndex===i?{...set,completed:!set.completed,...(exercise.exerciseType==='timer'&&!set.completed&&timers[key]>0?{durationSeconds:timers[key]}:{})}:set);
      return {...exercise,sets,completed:sets.every(s=>s.completed)};
    }));
    const set=currentLog.sets[i];
    if(wasRunning)toggleTimer(key);
    if(!set.completed&&!isResting){const seconds=currentExercise.restSeconds??60;if(seconds>0){startRest(seconds);setRestExpanded(false)}}
  };
  const updateSet=(i:number,field:keyof SetLog,value:SetLog[keyof SetLog])=>setLogs(current=>current.map((e,eIndex)=>eIndex===activeExerciseIndex?{...e,sets:e.sets.map((s,sIndex)=>sIndex===i?{...s,[field]:value}:s)}:e));
  const updateDefaultWeight=(weight:number)=>{
    if(!Number.isFinite(weight)||weight<0)return;
    onUpdateTemplate({...template,exercises:template.exercises.map(exercise=>exercise.id===currentExercise.id?{...exercise,targetWeight:weight}:exercise)});
  };
  const quickFinish=()=>{
    setLogs(current=>current.map((e,eIndex)=>eIndex===activeExerciseIndex?{...e,completed:true,sets:e.sets.map((s,i)=>({...s,completed:true,reps:s.reps??currentExercise.targetReps,weight:currentExercise.loadMode==='bodyweight'?undefined:(s.weight??currentExercise.targetWeight),...(e.exerciseType==='timer'&&(timers[`${eIndex}-${i}`]||0)>0?{durationSeconds:timers[`${eIndex}-${i}`]}:{})}))}:e));
  };
  const next=()=>{cancelRest();if(activeExerciseIndex<template.exercises.length-1)setActiveExerciseIndex(i=>i+1);else finishWorkout()};
  const prev=()=>{cancelRest();if(activeExerciseIndex>0)setActiveExerciseIndex(i=>i-1)};

  if(!currentExercise||!currentLog)return <View style={styles.container}><EmptyState icon={Zap} title="Nothing to train yet" message="This routine has no exercises. Add at least one exercise before starting." action="Leave workout" onAction={()=>onFinish(null)}/></View>;

  const completed=currentLog.sets.filter(s=>s.completed).length;
  return <View style={styles.container}>
    <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${((activeExerciseIndex+1)/template.exercises.length)*100}%`}]} /></View>
    <View style={styles.header}><View><Text numberOfLines={1} style={styles.routineName}>{template.name}</Text><Text style={styles.timer}>{formatTime(Math.floor((now-startTime)/1000))}</Text></View>
      <TouchableOpacity accessibilityLabel="End workout" onPress={confirmExit} style={styles.end}><LogOut size={18} color={theme.colors.danger}/><Text style={styles.endText}>End</Text></TouchableOpacity></View>
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.flex}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ExerciseView exercise={currentExercise} index={activeExerciseIndex} total={template.exercises.length}/>
        <View style={styles.setHeading}><View><Text style={styles.setTitle}>Working sets</Text><Text style={styles.setProgress}>{completed} of {currentLog.sets.length} completed</Text></View>
          <TouchableOpacity onPress={quickFinish} style={styles.quick}><Zap size={15} color={theme.colors.energy}/><Text style={styles.quickText}>Complete all</Text></TouchableOpacity></View>
        <SetList exercise={currentExercise} sets={currentLog.sets} historySets={historySets} exerciseIndex={activeExerciseIndex} timers={timers} timerRunning={timerRunning} onUpdateSet={updateSet} onSetDefaultWeight={updateDefaultWeight} onToggleComplete={toggleSetComplete} onToggleTimer={i=>{const key=`${activeExerciseIndex}-${i}`;if(timerRunning[key]&&timers[key]>0)updateSet(i,'durationSeconds',timers[key]);toggleTimer(key)}}/>
      </ScrollView>
    </KeyboardAvoidingView>
    {isResting&&<RestControl restTimer={restTimer} expanded={restExpanded} onToggleExpand={()=>setRestExpanded(v=>!v)} onAdd={()=>adjustRest(15)} onSubtract={()=>adjustRest(-15)} onSkip={cancelRest}/>}
    {!restExpanded&&<View style={[styles.footer,isResting&&styles.footerResting]}><TouchableOpacity accessibilityLabel="Previous exercise" onPress={prev} disabled={activeExerciseIndex===0} style={[styles.prev,activeExerciseIndex===0&&styles.disabled]}><ChevronLeft size={22} color={theme.colors.textMuted}/></TouchableOpacity>
      <Button label={activeExerciseIndex===template.exercises.length-1?'Finish workout':'Next exercise'} icon={ChevronRight} onPress={next} style={styles.next}/></View>}
  </View>;
};

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.canvas},flex:{flex:1},progressTrack:{height:4,backgroundColor:theme.colors.surfaceElevated},progressFill:{height:4,backgroundColor:theme.colors.primary},
  header:{height:76,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:theme.colors.border,backgroundColor:theme.colors.canvas},routineName:{...theme.type.caption,color:theme.colors.textMuted,textTransform:'uppercase',letterSpacing:1,maxWidth:240},timer:{fontSize:24,lineHeight:28,fontWeight:'800',fontVariant:['tabular-nums'],color:theme.colors.primary},
  end:{minWidth:70,height:44,borderRadius:12,backgroundColor:theme.colors.dangerSoft,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},endText:{...theme.type.label,color:theme.colors.danger},scroll:{flex:1},scrollContent:{padding:16,paddingBottom:130,maxWidth:620,width:'100%',alignSelf:'center'},
  setHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},setTitle:{...theme.type.heading,color:theme.colors.text},setProgress:{...theme.type.caption,color:theme.colors.textMuted,marginTop:2},quick:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:8},quickText:{...theme.type.caption,color:theme.colors.energy},
  footer:{padding:12,flexDirection:'row',gap:10,borderTopWidth:1,borderTopColor:theme.colors.border,backgroundColor:theme.colors.canvas},footerResting:{paddingBottom:82},prev:{width:52,minHeight:50,borderRadius:12,backgroundColor:theme.colors.surfaceElevated,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:theme.colors.border},disabled:{opacity:.35},next:{flex:1}
});


