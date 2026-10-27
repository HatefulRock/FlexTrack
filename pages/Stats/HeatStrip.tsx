import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { Category, CATEGORY_LABEL, categoryColor } from '../../utils/training';
import { inkOn, mix, rgb, shortDate } from './chartUtils';

export interface HeatRow { key: Category; values: number[] }

const LABEL_W = 56, GAP = 2, CELL_H = 30, WEEK_LABEL_W = 64;
const STEPS = [0, 0.32, 0.55, 0.78, 1]; // four opacity steps of the category hue; 0 is the empty surface
const BASE = theme.colors.surfaceElevated;

// Rows = training categories, columns = weeks. Each cell is that category's completed sets for the week.
export const HeatStrip = ({ rows, weeks }: { rows: HeatRow[]; weeks: number[] }) => {
  const [width, setWidth] = useState(0);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => { const w = Math.floor(e.nativeEvent.layout.width); if (w !== width) setWidth(w); };
  const n = weeks.length;
  const max = useMemo(() => Math.max(1, ...rows.flatMap(r => r.values)), [rows]);
  const totals = useMemo(() => weeks.map((_, c) => rows.reduce((s, r) => s + r.values[c], 0)), [rows, weeks]);
  const cellW = width ? (width - LABEL_W - GAP * (n - 1)) / n : 0;
  const showNumbers = cellW >= 20;
  const level = (v: number) => v <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((v / max) * 4)));
  const cellX = (c: number) => LABEL_W + c * (cellW + GAP);
  const weekText = (c: number) => c === n - 1 ? 'this week' : `week of ${shortDate(weeks[c])}`;
  const cellText = (r: number, c: number) => { const v = rows[r].values[c]; return `${CATEGORY_LABEL[rows[r].key]}, ${weekText(c)}, ${v} ${v === 1 ? 'set' : 'sets'}`; };
  const selection = sel && rows[sel.r] && sel.c < n ? sel : null; // rows can change under a stale selection
  const readout = selection ? cellText(selection.r, selection.c) : `Completed sets per week, last ${n} weeks. Tap a cell to read it.`;

  return <View onLayout={onLayout}>
    <Text style={[styles.readout, !!selection && styles.readoutActive]} numberOfLines={1}>{readout}</Text>
    {!!width && <>
      {rows.map((row, r) => {
        const hue = categoryColor(row.key);
        return <View key={row.key} style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>{CATEGORY_LABEL[row.key]}</Text>
          {row.values.map((v, c) => {
            const lv = level(v), fill = lv ? mix(BASE, hue, STEPS[lv]) : null;
            const selected = selection?.r === r && selection?.c === c;
            return <Pressable key={c} accessibilityRole="button" accessibilityLabel={cellText(r, c)}
              accessibilityState={{ selected }} onPress={() => setSel(selected ? null : { r, c })} hitSlop={{ top: 4, bottom: 4 }}
              style={[styles.cell, { width: cellW, marginLeft: c ? GAP : 0, backgroundColor: fill ? rgb(fill) : BASE }, selected && styles.cellSelected]}>
              {showNumbers && v > 0 && <Text style={[styles.cellText, { color: inkOn(fill!) }]}>{v}</Text>}
            </Pressable>;
          })}
        </View>;
      })}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        {totals.map((v, c) => <Text key={c} style={[styles.total, { width: cellW, marginLeft: c ? GAP : 0 }]}>{showNumbers || v < 10 ? v || '–' : ''}</Text>)}
      </View>
      <View style={styles.weekRow}>
        {weeks.map((t, c) => (n - 1 - c) % 4 === 0 && <Text key={c} numberOfLines={1}
          style={[styles.week, { left: Math.max(0, Math.min(width - WEEK_LABEL_W, cellX(c) + (cellW - WEEK_LABEL_W) / 2)) }, c === n - 1 && { textAlign: 'right', left: width - WEEK_LABEL_W }]}>{shortDate(t)}</Text>)}
      </View>
    </>}
  </View>;
};

const styles = StyleSheet.create({
  readout: { ...theme.type.caption, color: theme.colors.textMuted, marginBottom: 10, minHeight: 16 },
  readoutActive: { color: theme.colors.text },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: GAP },
  rowLabel: { width: LABEL_W, ...theme.type.caption, fontFamily: theme.type.label.fontFamily, color: theme.colors.textSecondary },
  cell: { height: CELL_H, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { borderWidth: 2, borderColor: theme.colors.text },
  cellText: { ...theme.type.caption, fontFamily: theme.type.label.fontFamily, fontVariant: ['tabular-nums'] },
  totalRow: { marginTop: 6, marginBottom: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingTop: 6 },
  totalLabel: { width: LABEL_W, ...theme.type.caption, color: theme.colors.textMuted },
  total: { ...theme.type.caption, fontVariant: ['tabular-nums'], color: theme.colors.textMuted, textAlign: 'center' },
  weekRow: { height: 18, marginTop: 4 },
  week: { position: 'absolute', top: 0, width: WEEK_LABEL_W, textAlign: 'center', ...theme.type.caption, color: theme.colors.textSubtle },
});
