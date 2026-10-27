import React, { useEffect, useState } from 'react';
import { Alert, AlertButton, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { Button, ButtonVariant } from './Primitives';

type Request = { title: string; message?: string; buttons: AlertButton[] };
let push: ((r: Request) => void) | null = null;

// Native keeps the platform alert. react-native-web's Alert is a no-op, so web routes to an in-app sheet.
export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  if (Platform.OS !== 'web') return Alert.alert(title, message, buttons);
  const request = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] };
  if (push) push(request);
};

// Mirrors the native alert: destructive reads as danger, and only the last non-cancel action is primary.
const buttonVariant = (button: AlertButton, isLast: boolean): ButtonVariant => {
  if (button.style === 'destructive') return 'danger';
  return button.style !== 'cancel' && isLast ? 'primary' : 'secondary';
};

export const DialogHost = () => {
  const [queue, setQueue] = useState<Request[]>([]);
  useEffect(() => { push = r => setQueue(q => [...q, r]); return () => { push = null; }; }, []);
  const current = queue[0];
  const close = (button?: AlertButton) => { setQueue(q => q.slice(1)); button?.onPress?.(); };
  const cancel = current?.buttons.find(b => b.style === 'cancel');
  return <Modal visible={!!current} transparent animationType="fade" onRequestClose={() => close(cancel)}>
    <View style={styles.root}>
      <View style={styles.scrim} />
      {current && <View accessibilityRole="alert" style={styles.sheet}>
        <Text accessibilityRole="header" style={styles.title}>{current.title}</Text>
        {!!current.message && <Text style={styles.message}>{current.message}</Text>}
        <View style={styles.actions}>
          {current.buttons.map((b, i) => <Button key={`${b.text}-${i}`} label={b.text ?? 'OK'} onPress={() => close(b)}
            variant={buttonVariant(b, i === current.buttons.length - 1)} />)}
        </View>
      </View>}
    </View>
  </Modal>;
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, padding: 20, paddingBottom: 28, gap: 8, ...theme.shadow.sheet },
  title: { ...theme.type.title, color: theme.colors.text },
  message: { ...theme.type.body, color: theme.colors.textMuted, marginBottom: 12 },
  actions: { gap: 10 },
});
