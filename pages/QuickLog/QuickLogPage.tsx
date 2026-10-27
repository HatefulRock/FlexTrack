import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityCategory, WorkoutLog } from '../../types';
import { Header } from '../../components/layout/Header';
import { Button, Chip } from '../../components/ui/Primitives';
import { theme } from '../../constants/theme';
import { generateId } from '../../utils/helpers';
import { FieldBlock, Input, punctuatedNumbers, Segments } from './QuickLogFields';

const c = theme.colors;
const categories: { key: ActivityCategory; label: string }[] = [
  { key: 'strength', label: 'Strength' }, { key: 'run', label: 'Run' }, { key: 'walk', label: 'Walk' },
  { key: 'cycle', label: 'Cycle' }, { key: 'timed', label: 'Timed' }, { key: 'other', label: 'Other' },
];
const units: { key: 'm' | 'km' | 'miles'; label: string }[] = [{ key: 'm', label: 'm' }, { key: 'km', label: 'km' }, { key: 'miles', label: 'miles' }];
type DateMode = 'today' | 'yesterday' | 'pick';
type Errors = Partial<Record<'title' | 'date' | 'time' | 'distance' | 'duration', string>>;

const pad = (n: number) => String(n).padStart(2, '0');
const dateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const defaultTitle = (category: ActivityCategory) => category === 'other' ? 'Activity' : category === 'timed' ? 'Timed activity' : category[0].toUpperCase() + category.slice(1);

// "24:30" is minutes and seconds, "1:05:00" adds hours, a bare number is minutes.
export const parseDuration = (raw: string): number => {
  const s = raw.trim();
  if (!s) return 0;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s) * 60);
  const parts = s.split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some(p => !/^\d+$/.test(p))) return NaN;
  const [a, b, d] = parts.map(Number);
  if (parts.length === 2) return b < 60 ? a * 60 + b : NaN;
  return b < 60 && d < 60 ? a * 3600 + b * 60 + d : NaN;
};
const parseDate = (s: string) => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
};
const parseClock = (s: string) => {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(s.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
};

export const QuickLogPage = ({ onSave, onCancel }: { onSave: (log: WorkoutLog) => void; onCancel: () => void }) => {
  const opened = useMemo(() => new Date(), []);
  const [category, setCategory] = useState<ActivityCategory>('run');
  const [title, setTitle] = useState('Run');
  const [dateMode, setDateMode] = useState<DateMode>('today');
  const [dateText, setDateText] = useState(dateValue(opened));
  const [timeMode, setTimeMode] = useState<'now' | 'set'>('now');
  const [timeText, setTimeText] = useState(timeValue(opened));
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<'km' | 'm' | 'miles'>('km');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const cardio = ['run', 'walk', 'cycle'].includes(category);
  const timed = cardio || category === 'timed';
  const clear = (k: keyof Errors) => errors[k] && setErrors(e => ({ ...e, [k]: undefined }));

  const choose = (next: ActivityCategory) => {
    // Keep a name the lifter typed; replace one that was only the default.
    if (!title.trim() || title === defaultTitle(category)) setTitle(defaultTitle(next));
    setCategory(next); setErrors({});
  };
  const pickDate = (mode: DateMode) => {
    setDateMode(mode); clear('date');
    if (mode === 'pick' && dateMode !== 'pick') {
      const d = new Date(); if (dateMode === 'yesterday') d.setDate(d.getDate() - 1);
      setDateText(dateValue(d));
    }
  };

  const save = () => {
    const next: Errors = {};
    const now = new Date();
    if (!title.trim()) next.title = 'Add a name for this activity.';
    let day: Date | null = new Date(now);
    if (dateMode === 'yesterday') day.setDate(day.getDate() - 1);
    if (dateMode === 'pick') { day = parseDate(dateText); if (!day) next.date = 'Use the format YYYY-MM-DD, for example 2026-10-24.'; }
    const clock = timeMode === 'now' ? { h: now.getHours(), m: now.getMinutes() } : parseClock(timeText);
    if (!clock) next.time = 'Use 24-hour time, for example 18:30.';
    let endedAt = NaN;
    if (day && clock) {
      const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), clock.h, clock.m, timeMode === 'now' ? now.getSeconds() : 0);
      endedAt = d.getTime();
      if (endedAt > now.getTime() + 60_000) next[dateMode === 'pick' ? 'date' : 'time'] = 'That is in the future. Pick when you finished.';
    }
    const distanceNumber = Number(distance.replace(',', '.'));
    if (cardio && (!distance.trim() || !Number.isFinite(distanceNumber) || distanceNumber <= 0)) next.distance = 'Enter a distance greater than zero.';
    const seconds = parseDuration(duration);
    if (Number.isNaN(seconds)) next.duration = 'Use MM:SS or HH:MM:SS, for example 24:30 or 1:05:00.';
    else if (timed && seconds <= 0) next.duration = 'Enter how long it took, for example 24:30.';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    const secs = Number.isNaN(seconds) ? 0 : seconds;
    const name = title.trim(), note = notes.trim() || undefined;
    onSave({
      id: generateId(), templateName: name, source: 'quick', activityCategory: category, notes: note,
      startTime: Math.max(0, endedAt - secs * 1000), endTime: endedAt,
      exercises: [{
        exerciseId: generateId(), exerciseName: name, exerciseType: cardio ? 'distance' : 'timer', distanceUnit: cardio ? unit : undefined, completed: true,
        sets: [{ setNumber: 1, completed: true, distance: cardio ? distanceNumber : undefined, durationSeconds: secs || undefined, notes: note }],
      }],
    });
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
    <Header title="Log activity" onBack={onCancel} />
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <Text style={styles.intro}>Something you already finished. It counts toward history and progress.</Text>

      <FieldBlock label="Activity type">
        <Segments label="Activity type" options={categories} value={category} onChange={choose} columns={3} height={52} />
      </FieldBlock>

      <FieldBlock label="Name" error={errors.title}>
        <Input label="Activity name" value={title} onChange={v => { setTitle(v); clear('title'); }} invalid={!!errors.title} maxLength={60} />
      </FieldBlock>

      <FieldBlock label="Date" error={errors.date} hint={dateMode === 'pick' ? 'Exact date as YYYY-MM-DD, for example 2026-10-24' : undefined}>
        <View style={styles.chips}>
          <Chip label="Today" active={dateMode === 'today'} onPress={() => pickDate('today')} accessibilityLabel="Date: today" />
          <Chip label="Yesterday" active={dateMode === 'yesterday'} onPress={() => pickDate('yesterday')} accessibilityLabel="Date: yesterday" />
          <Chip label="Pick…" active={dateMode === 'pick'} onPress={() => pickDate('pick')} accessibilityLabel="Pick an exact date" />
        </View>
        {dateMode === 'pick' && <Input label="Exact date, year-month-day" value={dateText} onChange={v => { setDateText(v); clear('date'); }} keyboard={punctuatedNumbers} invalid={!!errors.date} maxLength={10} />}
      </FieldBlock>

      <FieldBlock label="Finished at" error={errors.time} hint={timeMode === 'set' ? '24-hour time, for example 18:30' : undefined}>
        <View style={styles.chips}>
          <Chip label="Now" active={timeMode === 'now'} onPress={() => { setTimeMode('now'); clear('time'); }} accessibilityLabel="Finished just now" />
          <Chip label="Set time" active={timeMode === 'set'} onPress={() => { if (timeMode !== 'set') setTimeText(timeValue(new Date())); setTimeMode('set'); }} accessibilityLabel="Set the finish time" />
          {timeMode === 'set' && <Input label="Finish time, hours and minutes" value={timeText} onChange={v => { setTimeText(v); clear('time'); }} keyboard={punctuatedNumbers} invalid={!!errors.time} maxLength={5} style={styles.timeInput} />}
        </View>
      </FieldBlock>

      {cardio && <FieldBlock label="Distance" error={errors.distance}>
        <View style={styles.row}>
          <Input label={`Distance in ${unit}`} value={distance} onChange={v => { setDistance(v); clear('distance'); }} placeholder="e.g. 5" keyboard="decimal-pad" invalid={!!errors.distance} style={styles.flex} maxLength={8} />
          <View style={styles.unit}><Segments<'m' | 'km' | 'miles'> label="Distance unit" options={units} value={unit} onChange={setUnit} columns={3} /></View>
        </View>
      </FieldBlock>}

      <FieldBlock label={timed ? 'Duration' : 'Duration (optional)'} error={errors.duration} hint="MM:SS or HH:MM:SS">
        <Input label="Duration" value={duration} onChange={v => { setDuration(v); clear('duration'); }} placeholder="e.g. 24:30" keyboard={punctuatedNumbers} invalid={!!errors.duration} maxLength={8} />
      </FieldBlock>

      <FieldBlock label="Notes (optional)">
        <Input label="Notes" value={notes} onChange={setNotes} placeholder="How did it feel?" multiline />
      </FieldBlock>
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      {Object.values(errors).some(Boolean) && <Text style={styles.footerError}>Fix the highlighted fields to save.</Text>}
      <Button label="Save activity" onPress={save} />
    </SafeAreaView>
  </KeyboardAvoidingView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.canvas },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 24, maxWidth: 620, width: '100%', alignSelf: 'center' },
  intro: { ...theme.type.body, color: c.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  timeInput: { width: 96, textAlign: 'center' } as any,
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  unit: { width: 192 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8, backgroundColor: c.canvas, maxWidth: 620, width: '100%', alignSelf: 'center' },
  footerError: { ...theme.type.caption, color: c.danger, textAlign: 'center' },
});
