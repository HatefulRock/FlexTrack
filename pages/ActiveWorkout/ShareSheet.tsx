import React, { useRef, useState, ComponentRef } from 'react';
import { PixelRatio, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Download, Share2 } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { Button } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { Sheet } from '../../components/layout/Navigation';
import { ShareCard } from './ShareCard';
import { CARD_H, CARD_W, ShareData } from './ShareLayout';
import { downloadShareCard } from './ShareCanvas';
import { adoptSharedFile } from '../../utils/sharedFiles';

const web = Platform.OS === 'web';

// Preview sheet for the session card. Native captures a full-size off-screen copy and opens the share sheet;
// web draws the same card on a canvas and downloads the PNG.
export const ShareSheet = ({ visible, onClose, data }: { visible: boolean; onClose: () => void; data: ShareData }) => {
  const { width: ww, height: wh } = useWindowDimensions();
  const capture = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  // Fit the preview inside the sheet (84% of the screen) above the title and two buttons.
  const preview = Math.floor(Math.max(200, Math.min(ww - 32, 588, (wh * 0.84 - 236) * CARD_W / CARD_H)));

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (web) {
        if (typeof document === 'undefined') throw new Error('No document');
        await downloadShareCard(data);
        onClose();
      } else {
        if (!(await Sharing.isAvailableAsync())) { showAlert('Sharing is not available', 'This device has no share sheet to send the image to.'); return; }
        const uri = adoptSharedFile(await captureRef(capture, { format: 'png', quality: 1, result: 'tmpfile', width: CARD_W, height: CARD_H }));
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share session', UTI: 'public.png' });
        onClose();
      }
    } catch {
      showAlert(web ? 'Could not download the image' : 'Could not share the image', 'Something went wrong while making the image. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return <Sheet visible={visible} onClose={busy ? () => undefined : onClose}>
    <Text accessibilityRole="header" style={styles.title}>Share session</Text>
    <View style={[styles.preview, { width: preview }]}><ShareCard data={data} width={preview} /></View>
    <View style={styles.actions}>
      <Button label={web ? 'Download image' : 'Share image'} icon={web ? Download : Share2} loading={busy} onPress={share} />
      <Button label="Cancel" variant="ghost" disabled={busy} onPress={onClose} />
    </View>
    {/* Native capture source: the card at 1080 px wide, laid out off-screen and hidden from screen readers. */}
    {!web && visible && <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.offscreen}>
      <ShareCard ref={capture} data={data} width={CARD_W / PixelRatio.get()} />
    </View>}
  </Sheet>;
};

const styles = StyleSheet.create({
  title: { ...theme.type.title, color: theme.colors.text, marginBottom: 12 },
  preview: { alignSelf: 'center', borderRadius: theme.radius.lg, overflow: 'hidden' },
  actions: { marginTop: 16, gap: 8 },
  offscreen: { position: 'absolute', left: -10000, top: 0 },
});
