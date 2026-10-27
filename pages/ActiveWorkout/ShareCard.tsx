import React, { forwardRef, useMemo } from 'react';
import { Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { CARD_H, CARD_W, ShareData, describeShare, layoutCard } from './ShareLayout';

// The session card as a view: the shared display list drawn at `width` points (card pixels × width/1080).
// At full scale it is the capture source on native; scaled down it is the preview in the share sheet.
export const ShareCard = forwardRef<View, { data: ShareData; width: number }>(({ data, width }, ref) => {
  const ops = useMemo(() => layoutCard(data), [data]);
  const s = width / CARD_W;
  return <View ref={ref} collapsable={false} accessible accessibilityRole="image" accessibilityLabel={describeShare(data)}
    style={{ width, height: CARD_H * s, backgroundColor: theme.colors.canvas, overflow: 'hidden' }}>
    {ops.map((o, i) => o.kind === 'rect'
      ? <View key={i} style={{ position: 'absolute', left: o.x * s, top: o.y * s, width: o.w * s, height: o.h * s, borderRadius: o.r * s, backgroundColor: o.color }} />
      : <Text key={i} numberOfLines={1} style={{ position: 'absolute', left: o.x * s, top: o.y * s, width: o.w * s, height: o.lh * s, lineHeight: o.lh * s, textAlign: o.align,
        fontFamily: o.runs[0].family, fontSize: o.runs[0].size * s, color: o.runs[0].color, fontVariant: ['tabular-nums'] }}>
        {o.runs.length === 1 ? o.runs[0].text : o.runs.map((r, j) => <Text key={j} style={{ fontFamily: r.family, fontSize: r.size * s, color: r.color }}>{r.text}</Text>)}
      </Text>)}
  </View>;
});
ShareCard.displayName = 'ShareCard';
