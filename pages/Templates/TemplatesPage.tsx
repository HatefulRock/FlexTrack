import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Dumbbell, Plus, Search, SearchX, X } from 'lucide-react-native';
import { Header } from '../../components/layout/Header';
import { EmptyState, PressableScale } from '../../components/ui/Primitives';
import { WorkoutTemplate } from '../../types';
import { WorkoutCard } from './WorkoutCard';
import { theme } from '../../constants/theme';

interface Props { templates: WorkoutTemplate[]; onEdit: (t: WorkoutTemplate) => void; onDelete: (id: string) => void; onCreate: () => void; onStart: (t: WorkoutTemplate) => void; }

export const TemplatesPage = ({ templates, onEdit, onDelete, onCreate, onStart }: Props) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => templates.filter(t => `${t.name} ${t.description || ''} ${t.exercises.map(e => e.name).join(' ')}`.toLowerCase().includes(q)), [templates, q]);
  const newButton = <PressableScale accessibilityRole="button" accessibilityLabel="New routine" onPress={onCreate} style={styles.add}>
    <Plus size={18} color={theme.colors.onPrimary} strokeWidth={2.6} /><Text style={styles.addText}>New routine</Text>
  </PressableScale>;

  return <View style={styles.container}>
    <Header title="Routines" rightAction={templates.length ? newButton : undefined} />
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {templates.length > 0 && <>
        <View style={[styles.search, focused && styles.searchFocused]}>
          <Search size={18} color={theme.colors.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search routines or exercises" placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel="Search routines" style={styles.input} returnKeyType="search" autoCorrect={false}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
          {query.length > 0 && <PressableScale accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} scaleTo={0.92} style={styles.clear}>
            <X size={18} color={theme.colors.textSecondary} />
          </PressableScale>}
        </View>
        {shown.length > 0 && <Text style={styles.count}>{q ? `${shown.length} of ${templates.length}` : shown.length} {templates.length === 1 && !q ? 'routine' : 'routines'}</Text>}
      </>}
      <View style={styles.list}>{shown.map(t => <WorkoutCard key={t.id} template={t} onEdit={onEdit} onDelete={onDelete} onStart={onStart} />)}</View>
      {!templates.length && <EmptyState icon={Dumbbell} title="No routines yet" message="Build a routine once: pick the exercises, set the days. Then start it from Today or Quick start in one tap." action="New routine" onAction={onCreate} />}
      {!!templates.length && !shown.length && <EmptyState icon={SearchX} title="No matching routines" message={`Nothing named or containing “${query.trim()}”. Try an exercise name, or clear the search.`} action="Clear search" onAction={() => setQuery('')} />}
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, maxWidth: 620, width: '100%', alignSelf: 'center' },
  add: { minHeight: 44, paddingHorizontal: 14, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addText: { ...theme.type.label, color: theme.colors.onPrimary },
  search: { height: 48, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 2, gap: 10 },
  searchFocused: { borderColor: theme.colors.primary },
  input: { flex: 1, height: '100%', ...theme.type.body, color: theme.colors.text, outlineWidth: 0 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  count: { ...theme.type.caption, fontSize: 13, color: theme.colors.textMuted, marginTop: 16, marginBottom: 10 },
  list: { gap: 12 },
});
