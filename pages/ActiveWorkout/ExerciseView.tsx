import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { Exercise } from '../../types';
import { theme } from '../../constants/theme';

const targetLabel=(exercise:Exercise)=>{
 if(exercise.type==='distance')return `${exercise.targetDistance||0} ${exercise.targetDistanceUnit||'km'} target`;
 if(exercise.type==='timer')return `${exercise.targetDurationSeconds||0} sec target`;
 if(exercise.loadMode==='bodyweight')return `${exercise.targetReps||0} reps`;
 if(exercise.loadMode==='assisted')return `${exercise.targetReps||0} reps with ${exercise.targetWeight||0} kg assistance`;
 return `${exercise.targetReps||0} reps at ${exercise.targetWeight||0} kg`;
};
export const ExerciseView=({exercise,index,total}:{exercise:Exercise;index:number;total:number})=><View style={styles.container}>
  <Text style={styles.eyebrow}>EXERCISE {index+1} OF {total}</Text><Text style={styles.title}>{exercise.name}</Text>
  <Text style={styles.target}>{exercise.targetSets||1} working sets · {targetLabel(exercise)}</Text>
  {!!exercise.notes&&<View style={styles.note}><Info size={16} color={theme.colors.primary}/><Text style={styles.noteText}>{exercise.notes}</Text></View>}
</View>;
const styles=StyleSheet.create({container:{marginBottom:24},eyebrow:{...theme.type.caption,color:theme.colors.primary,letterSpacing:1.3,marginBottom:5},title:{...theme.type.display,color:theme.colors.text},target:{...theme.type.body,color:theme.colors.textMuted,marginTop:6},note:{flexDirection:'row',alignItems:'flex-start',gap:8,marginTop:14,padding:12,borderRadius:12,backgroundColor:theme.colors.primarySoft},noteText:{...theme.type.body,color:theme.colors.textSecondary,flex:1}});
