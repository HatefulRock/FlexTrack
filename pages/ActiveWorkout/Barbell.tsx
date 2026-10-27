import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { fonts, plates as PLATE_COLORS, theme } from '../../constants/theme';
import { BAR_KG, formatKg, platesPerSide } from '../../utils/training';

// True relative diameters of calibrated plates: 25 and 20 kg share the 450 mm face.
const DIAMETER: Record<number, number> = { 25: 1, 20: 1, 15: 0.86, 10: 0.72, 5: 0.5, 2.5: 0.4, 1.25: 0.32 };
const DARK_LABEL = new Set([15, 5, 1.25]);
const CHROME = '#B9BDC1';
const SHAFT = '#8A8E92';

// Side view of a loaded bar: plates heaviest-in on both sleeves, each printed with its kg.
export const Barbell = ({ weight, height = 92 }: { weight: number; height?: number }) => {
  const [width, setWidth] = useState(0);
  const { plates, remainder } = platesPerSide(weight);
  const perSide = Math.max(0, (weight - BAR_KG) / 2);
  const summary = plates.length ? `${formatKg(BAR_KG)} bar, ${plates.map(p => formatKg(p)).join(' + ')} a side` : `${formatKg(BAR_KG)} bar`;

  const cy = height / 2;
  const plateMax = height - 4;
  const shaftLen = width * 0.3;
  const sideLen = (width - shaftLen) / 2;
  const innerCollarW = 8, clampW = 7, tail = 10;
  const pw = plates.length ? Math.min(24, (sideLen - innerCollarW - clampW - tail) / plates.length) : 0;

  const side = (dir: 1 | -1) => {
    const origin = width / 2 + dir * (shaftLen / 2);
    const x = (offset: number, w: number) => (dir === 1 ? origin + offset : origin - offset - w);
    const items: React.ReactNode[] = [];
    // Sleeve runs from the inner collar to the bar end.
    items.push(<Rect key="sleeve" x={x(0, sideLen)} y={cy - height * 0.07} width={sideLen} height={height * 0.14} rx={2} fill={CHROME} />);
    items.push(<Rect key="collar" x={x(0, innerCollarW)} y={cy - height * 0.17} width={innerCollarW} height={height * 0.34} rx={1.5} fill={CHROME} />);
    let offset = innerCollarW + 1;
    plates.forEach((p, i) => {
      const h = DIAMETER[p] * plateMax;
      const w = Math.max(0, pw - 1.5);
      const px = x(offset, w);
      items.push(<G key={`p${i}`}>
        <Rect x={px} y={cy - h / 2} width={w} height={h} rx={2.5} fill={PLATE_COLORS[p as keyof typeof PLATE_COLORS]} />
        <SvgText x={px + w / 2} y={cy + 4.5} fontSize={12} fontFamily={fonts.displayBlack} textAnchor="middle"
          fill={DARK_LABEL.has(p) ? theme.colors.onPrimary : theme.colors.text}>{String(p)}</SvgText>
      </G>);
      offset += pw;
    });
    items.push(<Rect key="clamp" x={x(offset + 1, clampW)} y={cy - height * 0.13} width={clampW} height={height * 0.26} rx={1.5} fill={CHROME} />);
    return items;
  };

  return <View accessible accessibilityRole="image" accessibilityLabel={`Barbell: ${summary}`}>
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && <Svg width={width} height={height}>
        <Rect x={width / 2 - shaftLen / 2 - 1} y={cy - 2.5} width={shaftLen + 2} height={5} rx={2} fill={SHAFT} />
        {side(-1)}
        {side(1)}
      </Svg>}
    </View>
    <Text style={styles.caption}>
      {formatKg(BAR_KG)} bar + {formatKg(perSide - remainder)} a side{remainder > 0 ? ` (${formatKg(remainder)} a side won't load)` : ''}
    </Text>
  </View>;
};

const styles = StyleSheet.create({
  caption: { ...theme.type.caption, color: theme.colors.textMuted, textAlign: 'center', marginTop: 6, fontVariant: ['tabular-nums'] },
});
