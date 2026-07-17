import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header } from '../../components/layout/Header';
import { WorkoutLog, UserProfile } from '../../types';
import { TrainingTab } from './TrainingTab';
import { BodyTab } from './BodyTab';
import { theme } from '../../constants/theme';

export const StatsPage=({logs,userProfile,setUserProfile}:{logs:WorkoutLog[];userProfile:UserProfile;setUserProfile:(p:UserProfile)=>void})=>{
 const [tab,setTab]=useState<'training'|'body'>('training');
 return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Header title="Progress"/><View style={styles.inner}>
  <View accessibilityRole="tablist" style={styles.tabs}><TouchableOpacity accessibilityRole="tab" accessibilityState={{selected:tab==='training'}} onPress={()=>setTab('training')} style={[styles.tab,tab==='training'&&styles.tabActive]}><Text style={[styles.tabText,tab==='training'&&styles.tabTextActive]}>Training</Text></TouchableOpacity><TouchableOpacity accessibilityRole="tab" accessibilityState={{selected:tab==='body'}} onPress={()=>setTab('body')} style={[styles.tab,tab==='body'&&styles.tabActive]}><Text style={[styles.tabText,tab==='body'&&styles.tabTextActive]}>Body & health</Text></TouchableOpacity></View>
  <View>{tab==='training'?<TrainingTab logs={logs}/>:<BodyTab userProfile={userProfile} setUserProfile={setUserProfile}/>}</View>
 </View></ScrollView>
};
const styles=StyleSheet.create({container:{flex:1,backgroundColor:theme.colors.canvas},scroll:{paddingBottom:110},inner:{paddingHorizontal:16,maxWidth:620,width:'100%',alignSelf:'center'},tabs:{height:48,padding:4,borderRadius:14,backgroundColor:theme.colors.surface,flexDirection:'row',borderWidth:1,borderColor:theme.colors.border,marginBottom:18},tab:{flex:1,borderRadius:10,alignItems:'center',justifyContent:'center'},tabActive:{backgroundColor:theme.colors.surfaceElevated},tabText:{...theme.type.label,color:theme.colors.textMuted},tabTextActive:{color:theme.colors.primary}});

