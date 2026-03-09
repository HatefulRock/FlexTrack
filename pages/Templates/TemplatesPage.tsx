import React from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Plus, Dumbbell } from 'lucide-react-native';

import { Header } from '../../components/layout/Header';
import { WorkoutTemplate } from '../../types';
import { WorkoutCard } from './WorkoutCard';

interface TemplatesPageProps {
  templates: WorkoutTemplate[];
  onEdit: (t: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onStart: (t: WorkoutTemplate) => void;
}

export const TemplatesPage = ({ 
    templates, 
    onEdit, 
    onDelete, 
    onCreate, 
    onStart 
}: TemplatesPageProps) => {
    return (
        <View style={styles.container}>
            <Header title="My Workouts" />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* 1. Subtle Counter */}
                {templates.length > 0 && (
                    <Text style={styles.counterText}>
                        {templates.length} {templates.length === 1 ? 'Routine' : 'Routines'} Found
                    </Text>
                )}

                {/* 2. List of Cards */}
                {templates.map(t => (
                    <WorkoutCard 
                      key={t.id} 
                      template={t} 
                      onEdit={onEdit} 
                      onDelete={onDelete} 
                      onStart={onStart} 
                    />
                ))}
                
                {/* 3. Rich Empty State */}
                {templates.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Dumbbell size={48} color="#94a3b8" />
                        </View>
                        <Text style={styles.emptyTitle}>No Workouts Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Create your first routine manually or use the AI generator to build one.
                        </Text>
                        <TouchableOpacity onPress={onCreate} style={styles.createButton}>
                            <Plus size={20} color="white" />
                            <Text style={styles.createButtonText}>Create Workout</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* 4. Floating Action Button (FAB) */}
            {/* Only show FAB if we have templates (otherwise the empty state button is enough) */}
            {templates.length > 0 && (
                <TouchableOpacity 
                    onPress={onCreate} 
                    style={styles.fab}
                    activeOpacity={0.8}
                >
                    <Plus size={32} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollContent: {
    paddingHorizontal: 20, // Increased padding
    paddingTop: 16,
    paddingBottom: 120, // Extra space at bottom so FAB doesn't cover last card
  },
  counterText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Empty State Styles
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9', // Primary
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 100, // Sits above the Bottom Navigation Bar
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0ea5e9', // Primary
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 50,
  }
});