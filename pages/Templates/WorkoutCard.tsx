import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, ChevronRight, Edit3, Play, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { WorkoutTemplate } from '../../types';
import { formatSchedule } from '../../utils/formatters';
import { theme } from '../../constants/theme';

interface Props { template: WorkoutTemplate; onEdit: (t: WorkoutTemplate) => void; onDelete: (id: string) => void; onStart: (t: WorkoutTemplate) => void; }

export const WorkoutCard = ({template,onEdit,onDelete,onStart}:Props) => {
  const start=()=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);onStart(template)};
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${template.name}`} onPress={()=>onEdit(template)} activeOpacity={.78} style={styles.main}>
      <View style={styles.top}><View style={styles.copy}><Text style={styles.title}>{template.name}</Text><Text numberOfLines={2} style={styles.description}>{template.description||'A focused workout routine.'}</Text></View><ChevronRight size={20} color={theme.colors.textSubtle}/></View>
      <View style={styles.meta}><View style={styles.metaItem}><CalendarDays size={14} color={theme.colors.textMuted}/><Text style={styles.metaText}>{formatSchedule(template.scheduleDays)}</Text></View><View style={styles.dot}/><Text style={styles.metaText}>{template.exercises.length} exercises</Text></View>
    </TouchableOpacity>
    <View style={styles.actions}><TouchableOpacity accessibilityLabel="Edit routine" onPress={()=>onEdit(template)} style={styles.icon}><Edit3 size={18} color={theme.colors.textMuted}/></TouchableOpacity><TouchableOpacity accessibilityLabel="Delete routine" onPress={()=>onDelete(template.id)} style={styles.icon}><Trash2 size={18} color={theme.colors.danger}/></TouchableOpacity><TouchableOpacity accessibilityLabel={`Start ${template.name}`} onPress={start} style={styles.start}><Play size={17} color={theme.colors.canvas} fill={theme.colors.canvas}/><Text style={styles.startText}>Start</Text></TouchableOpacity></View>
  </View>;
};
const styles=StyleSheet.create({
  card:{backgroundColor:theme.colors.surface,borderRadius:theme.radius.lg,borderWidth:1,borderColor:theme.colors.border,overflow:'hidden',...theme.shadow.card},main:{padding:16,paddingBottom:14},top:{flexDirection:'row',alignItems:'flex-start',gap:10},copy:{flex:1},title:{...theme.type.heading,color:theme.colors.text},description:{...theme.type.body,color:theme.colors.textMuted,marginTop:4},
  meta:{flexDirection:'row',alignItems:'center',gap:8,marginTop:14},metaItem:{flexDirection:'row',alignItems:'center',gap:6},metaText:{...theme.type.caption,color:theme.colors.textSecondary},dot:{width:3,height:3,borderRadius:2,backgroundColor:theme.colors.textSubtle},
  actions:{minHeight:60,borderTopWidth:1,borderTopColor:theme.colors.border,flexDirection:'row',alignItems:'center',paddingHorizontal:10,gap:4},icon:{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center'},start:{marginLeft:'auto',height:42,minWidth:108,borderRadius:12,backgroundColor:theme.colors.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},startText:{...theme.type.label,color:theme.colors.canvas}
});

