import React, { useMemo, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { niceTicks, shortDate, trimNumber } from './chartUtils';

export interface ChartPoint { t: number; value: number; record?: boolean }

const CHAR_W = 7.4; // Archivo semibold at 13px, per character (estimate for reserving label room)
const TOP = 26, BOTTOM = 26;

// A measured, hand-drawn line chart: straight segments between real entries, nice y ticks, the latest value at the line's end.
// Press and drag across the plot to read any entry.
export const LineChartSvg = ({ points, average, height = 200, format, unit, describe, surface = theme.colors.surface }: {
  points: ChartPoint[];
  average?: { t: number; value: number }[];
  height?: number;
  format?: (v: number) => string;
  unit: string;
  describe: string;
  surface?: string;
}) => {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => { const w = Math.floor(e.nativeEvent.layout.width); if (w !== width) setWidth(w); };

  const geo = useMemo(() => {
    if (!width || points.length < 2) return null;
    const all = [...points.map(p => p.value), ...(average || []).map(p => p.value)];
    const { ticks, lo, hi, decimals } = niceTicks(Math.min(...all), Math.max(...all));
    const fmt = format || ((v: number) => trimNumber(v, Math.max(decimals, 1)));
    const tickText = (v: number) => format ? format(v) : v.toFixed(decimals);
    const last = points[points.length - 1];
    const endText = `${fmt(last.value)}${unit ? ` ${unit}` : ''}`;
    const left = Math.ceil(Math.max(...ticks.map(t => tickText(t).length)) * 6.6) + 10;
    const right = Math.ceil(endText.length * CHAR_W) + 14;
    const plotW = Math.max(40, width - left - right), plotH = height - TOP - BOTTOM;
    const t0 = points[0].t, t1 = last.t, span = t1 - t0;
    const x = (t: number, i: number) => left + (span > 0 ? (t - t0) / span : i / (points.length - 1)) * plotW;
    const y = (v: number) => TOP + (1 - (v - lo) / (hi - lo)) * plotH;
    const xy = points.map((p, i) => ({ x: x(p.t, i), y: y(p.value) }));
    const path = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const avgPath = average && average.length > 1 ? average.map((p, i) => `${i ? 'L' : 'M'}${x(p.t, i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ') : null;
    const labelCount = Math.max(2, Math.min(4, Math.floor(plotW / 76) + 1));
    const seen = new Set<string>();
    const xLabels = span > 0 ? Array.from({ length: labelCount }, (_, i) => {
      const t = t0 + (span * i) / (labelCount - 1);
      return { text: shortDate(t), x: x(t, 0), anchor: i === 0 ? 'start' : i === labelCount - 1 ? 'end' : 'middle' };
    }).filter(l => !seen.has(l.text) && !!seen.add(l.text)) : [{ text: shortDate(t0), x: left + plotW / 2, anchor: 'middle' }];
    const showAllDots = plotW / points.length >= 22; // dense series: line only, plus the latest, records and the selection
    return { ticks, tickText, fmt, endText, left, plotW, plotH, xy, path, avgPath, xLabels, showAllDots, y };
  }, [width, points, average, height, format, unit]);

  const pick = (e: GestureResponderEvent) => {
    if (!geo) return;
    const lx = e.nativeEvent.locationX;
    let best = 0;
    geo.xy.forEach((p, i) => { if (Math.abs(p.x - lx) < Math.abs(geo.xy[best].x - lx)) best = i; });
    setActive(best);
  };

  const last = points.length - 1;
  const sel = active !== null && active <= last ? active : null;
  return <View onLayout={onLayout} style={{ height }} accessible accessibilityRole="image" accessibilityLabel={describe}>
    {geo && <>
      <Svg width={width} height={height}>
        {geo.ticks.map(t => <Line key={t} x1={geo.left} x2={geo.left + geo.plotW} y1={geo.y(t)} y2={geo.y(t)} stroke={theme.colors.border} strokeWidth={1} />)}
        {sel !== null && <Line x1={geo.xy[sel].x} x2={geo.xy[sel].x} y1={TOP - 4} y2={TOP + geo.plotH} stroke={theme.colors.textSubtle} strokeWidth={1} />}
        {geo.avgPath && <Path d={geo.avgPath} stroke={theme.colors.textSubtle} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
        <Path d={geo.path} stroke={theme.colors.text} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {geo.xy.map((p, i) => {
          const pt = points[i];
          if (!geo.showAllDots && !pt.record && i !== last && i !== sel) return null;
          return <Circle key={i} cx={p.x} cy={p.y} r={i === sel ? 5 : 4} fill={pt.record ? theme.colors.record : theme.colors.text} stroke={surface} strokeWidth={2} />;
        })}
      </Svg>
      {geo.ticks.map(t => <Text key={t} style={[styles.tick, { top: geo.y(t) - 8, width: geo.left - 8 }]}>{geo.tickText(t)}</Text>)}
      {geo.xLabels.map(l => <Text key={l.text} numberOfLines={1} style={[styles.xLabel, l.anchor === 'start' ? { left: l.x, textAlign: 'left' } : l.anchor === 'end' ? { left: l.x - 72, textAlign: 'right' } : { left: l.x - 36, textAlign: 'center' }]}>{l.text}</Text>)}
      <Text numberOfLines={1} style={[styles.end, { left: geo.xy[last].x + 9, top: Math.max(0, Math.min(height - BOTTOM - 18, geo.xy[last].y - 9)) }]}>{geo.endText}</Text>
      {sel !== null && <Text numberOfLines={1} style={[styles.readout, { left: Math.max(0, Math.min(width - 180, geo.xy[sel].x - 90)) }]}>
        {`${geo.fmt(points[sel].value)}${unit ? ` ${unit}` : ''} · ${shortDate(points[sel].t, true)}${points[sel].record ? ' · record' : ''}`}
      </Text>}
      <View style={[StyleSheet.absoluteFill, { left: geo.left - 12 }]}
        onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => true}
        onResponderGrant={pick} onResponderMove={pick} />
    </>}
  </View>;
};

const styles = StyleSheet.create({
  tick: { position: 'absolute', left: 0, height: 16, textAlign: 'right', ...theme.type.caption, fontVariant: ['tabular-nums'], color: theme.colors.textSubtle },
  xLabel: { position: 'absolute', bottom: 0, width: 72, ...theme.type.caption, color: theme.colors.textSubtle },
  end: { position: 'absolute', fontFamily: theme.type.label.fontFamily, fontSize: 13, lineHeight: 18, fontVariant: ['tabular-nums'], color: theme.colors.text },
  readout: { position: 'absolute', top: 0, width: 180, textAlign: 'center', ...theme.type.caption, fontVariant: ['tabular-nums'], color: theme.colors.text },
});
