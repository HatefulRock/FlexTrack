import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Edit2, Trash2, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics'; // Optional: for vibration feel

import { WorkoutTemplate } from '../../types';
import { formatSchedule } from '../../utils/formatters';

interface WorkoutCardProps {
  template: WorkoutTemplate;
  onEdit: (t: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
  onStart: (t: WorkoutTemplate) => void;
}

export const WorkoutCard = ({ template, onEdit, onDelete, onStart }: WorkoutCardProps) => {
  
  const handleStart = () => {
    // Optional: Add vibration when starting
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStart(template);
  };

  return (
    <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
            <View style={styles.headerTextContainer}>
                <Text style={styles.title}>{template.name}</Text>
                <Text 
                    style={styles.description} 
                    numberOfLines={2} 
                >
                    {template.description || 'No description'}
                </Text>
            </View>
            
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    onPress={() => onEdit(template)} 
                    style={styles.iconButton}
                >
                    <Edit2 size={18} color="#94a3b8" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => onDelete(template.id)} 
                    style={styles.iconButton}
                >
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>

        {/* Tags / Details */}
        <View style={styles.tagsContainer}>
            <View style={styles.tag}>
                <Text style={styles.tagText}>
                    {formatSchedule(template.scheduleDays)}
                </Text>
            </View>
            <View style={styles.tag}>
                <Text style={styles.tagText}>
                    {template.exercises.length} Exercises
                </Text>
            </View>
        </View>

        {/* Start Button - High Contrast & Taller */}
        <TouchableOpacity 
            onPress={handleStart} 
            style={styles.startButton}
            activeOpacity={0.8}
        >
            <Play size={20} color="white" fill="white" />
            <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b', 
    padding: 20, 
    borderRadius: 24, // Increased for modern look
    marginBottom: 16, // Adds breathing room between cards
    borderWidth: 1,
    borderColor: '#334155', 
    // Stronger Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // More space between title and tags
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22, // Bigger Title
    fontWeight: '800', // Thicker font
    color: 'white',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14, 
    color: '#94a3b8', 
    marginTop: 6,
    lineHeight: 20, // Better readability
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 10, // Larger hit target for fingers
    backgroundColor: '#0f172a', // Darker bg for contrast
    borderRadius: 12, 
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)', // Transparent pill style (Cleaner)
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12, // Increased from 10
    color: '#cbd5e1', 
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
    backgroundColor: '#0ea5e9', // Solid Primary Color
    paddingVertical: 16, // Taller button
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // Button Shadow
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});