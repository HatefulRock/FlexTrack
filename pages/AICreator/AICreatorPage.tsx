import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { Header } from '../../components/layout/Header';
import { WorkoutTemplate } from '../../types';

interface AICreatorPageProps {
  onSave: (template: WorkoutTemplate) => void;
  onCancel: () => void;
}

export const AICreatorPage = ({ onCancel }: AICreatorPageProps) => (
  <SafeAreaView style={styles.container}>
    <Header
      title="AI Creator"
      rightAction={
        <TouchableOpacity accessibilityLabel="Close AI Creator" onPress={onCancel}>
          <X color="white" size={24} />
        </TouchableOpacity>
      }
    />
    <View style={styles.content}>
      <View style={styles.iconCircle}>
        <Sparkles size={40} color="#38bdf8" />
      </View>
      <Text style={styles.title}>Coming Soon</Text>
      <Text style={styles.description}>
        Smart, personalized workout generation is still in development. No AI provider or API key is currently configured.
      </Text>
      <TouchableOpacity accessibilityRole="button" onPress={onCancel} style={styles.button}>
        <Text style={styles.buttonText}>Got it</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 12, textAlign: 'center' },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
