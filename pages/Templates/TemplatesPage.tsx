import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dumbbell, Plus, Search } from 'lucide-react-native';
import { Header } from '../../components/layout/Header';
import { Button, EmptyState } from '../../components/ui/Primitives';
import { WorkoutTemplate } from '../../types';
import { WorkoutCard } from './WorkoutCard';
import { theme } from '../../constants/theme';

interface Props { templates: WorkoutTemplate[]; onEdit: (t: WorkoutTemplate) => void; onDelete: (id: string) => void; onCreate: () => void; onStart: (t: WorkoutTemplate) => void; }

export const TemplatesPage = ({ templates, onEdit, onDelete, onCreate, onStart }: Props) => {
  const [query,setQuery]=useState('');
  const shown=useMemo(()=>templates.filter(t=>`${t.name} ${t.description||''}`.toLowerCase().includes(query.trim().toLowerCase())),[templates,query]);
  return <View style={styles.container}>
    <Header title="Workouts" rightAction={templates.length ? <TouchableOpacity accessibilityLabel="Create routine" onPress={onCreate} style={styles.add}><Plus size={21} color={theme.colors.canvas}/></TouchableOpacity> : undefined}/>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {templates.length > 0 && <View style={styles.search}><Search size={19} color={theme.colors.textSubtle}/><TextInput value={query} onChangeText={setQuery} placeholder="Search routines" placeholderTextColor={theme.colors.textSubtle} style={styles.input} returnKeyType="search"/>{query.length>0&&<TouchableOpacity onPress={()=>setQuery('')}><Text style={styles.clear}>Clear</Text></TouchableOpacity>}</View>}
      {templates.length > 0 && <View style={styles.intro}><View><Text style={styles.count}>{shown.length} {shown.length===1?'ROUTINE':'ROUTINES'}</Text><Text style={styles.helper}>Choose a plan and make today count.</Text></View></View>}
      <View style={styles.list}>{shown.map(t=><WorkoutCard key={t.id} template={t} onEdit={onEdit} onDelete={onDelete} onStart={onStart}/>)}</View>
      {!templates.length&&<EmptyState icon={Dumbbell} title="Your training starts here" message="Create a routine once, then launch it anytime from Today or Quick Start." action="Create a routine" onAction={onCreate}/>}
      {!!templates.length&&!shown.length&&<View style={styles.noResults}><Text style={styles.noResultsTitle}>No matching routines</Text><Text style={styles.noResultsBody}>Try another name or clear your search.</Text><Button label="Clear search" variant="secondary" onPress={()=>setQuery('')}/></View>}
    </ScrollView>
  </View>;
};
const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.canvas},scroll:{paddingHorizontal:16,paddingTop:8,paddingBottom:120,maxWidth:620,width:'100%',alignSelf:'center'},search:{height:48,borderRadius:theme.radius.md,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10,marginBottom:20},
  input:{flex:1,height:'100%',color:theme.colors.text,fontSize:15,outlineStyle:'none'} as any,clear:{...theme.type.caption,color:theme.colors.primary},intro:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',marginBottom:14},count:{...theme.type.caption,color:theme.colors.primary,letterSpacing:1.2},helper:{...theme.type.body,color:theme.colors.textMuted,marginTop:3},
  list:{gap:12},add:{width:42,height:42,borderRadius:21,backgroundColor:theme.colors.primary,alignItems:'center',justifyContent:'center'},noResults:{paddingVertical:64,alignItems:'center'},noResultsTitle:{...theme.type.heading,color:theme.colors.text},noResultsBody:{...theme.type.body,color:theme.colors.textMuted,marginTop:5,marginBottom:20}
});

