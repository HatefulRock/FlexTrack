import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarCheck, Dumbbell, Play } from 'lucide-react-native';
import { WorkoutTemplate } from '../../types';
import { theme } from '../../constants/theme';
import { Button } from '../../components/ui/Primitives';

export const TodayFocusCard = ({ todaysWorkouts, onStartWorkout, onBrowse }: { todaysWorkouts: WorkoutTemplate[]; onStartWorkout: (t: WorkoutTemplate) => void; onBrowse: () => void }) => {
  const workout = todaysWorkouts[0];
  return <LinearGradient colors={['#112638', '#101925', '#111722']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.card}>
    <View style={styles.glow} /><View style={styles.eyebrowRow}><CalendarCheck size={15} color={theme.colors.primary} /><Text style={styles.eyebrow}>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}).toUpperCase()}</Text></View>
    {workout ? <><Text style={styles.kicker}>TODAY'S SESSION</Text><Text style={styles.title}>{workout.name}</Text><View style={styles.metaRow}><Dumbbell size={16} color={theme.colors.textMuted} /><Text style={styles.meta}>{workout.exercises.length} exercises · Ready when you are</Text></View><Button label="Start workout" icon={Play} onPress={() => onStartWorkout(workout)} style={styles.button} /></>
      : <><Text style={styles.kicker}>RECOVERY DAY</Text><Text style={styles.title}>Move on your terms.</Text><Text style={styles.meta}>Nothing scheduled today. Rest, recover, or choose a routine when the energy is there.</Text><Button label="Browse workouts" variant="secondary" onPress={onBrowse} style={styles.button} /></>}
  </LinearGradient>;
};
const styles=StyleSheet.create({
  card:{minHeight:246,borderRadius:theme.radius.xl,padding:22,overflow:'hidden',borderWidth:1,borderColor:'#23435A',...theme.shadow.card},glow:{position:'absolute',width:170,height:170,borderRadius:85,backgroundColor:'rgba(56,189,248,0.08)',right:-45,top:-65},
  eyebrowRow:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:22},eyebrow:{...theme.type.caption,color:theme.colors.primary,letterSpacing:1.1},kicker:{fontSize:11,fontWeight:'800',color:theme.colors.energy,letterSpacing:1.5,marginBottom:7},
  title:{...theme.type.display,color:theme.colors.text,maxWidth:310},metaRow:{flexDirection:'row',alignItems:'center',gap:7,marginTop:9},meta:{...theme.type.body,color:theme.colors.textMuted,marginTop:8,maxWidth:330},button:{marginTop:22,alignSelf:'stretch'}
});

