import React, { useState } from 'react';
// 1. Updated Imports
import { View, StyleSheet, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { theme } from './constants/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ViewState, WorkoutTemplate, WorkoutLog } from './types';
import { useWorkoutData } from './hooks/useWorkoutData';

// Layout
import { Navigation } from './components/layout/Navigation';

// Pages
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { TemplatesPage } from './pages/Templates/TemplatesPage';
import { TemplateEditor } from './pages/Templates/TemplateEditor';
import { AICreatorPage } from './pages/AICreator/AICreatorPage';
import { ActiveWorkoutPage } from './pages/ActiveWorkout/ActiveWorkoutPage';
import { WorkoutSummaryPage } from './pages/ActiveWorkout/WorkoutSummaryPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { StatsPage } from './pages/Stats/StatsPage';
import { QuickLogPage } from './pages/QuickLog/QuickLogPage';

const App = () => {
  const [view, setView] = useState<ViewState | 'template-editor'>('dashboard');
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [lastLog, setLastLog] = useState<WorkoutLog | null>(null);

  const {
    templates,
    logs,
    userProfile,
    loading,
    setUserProfile,
    saveTemplate,
    deleteTemplate,
    addLog
  } = useWorkoutData();

  // Loading Guard
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const handleStartWorkout = (t: WorkoutTemplate) => {
    setActiveTemplate(t);
    setView('active-workout');
  };

  const handleFinishWorkout = (log: WorkoutLog | null) => {
    if (log) {
        addLog(log);
        setLastLog(log);
        setView('workout-summary');
    } else {
        setView('dashboard');
    }
    setActiveTemplate(null);
  };

  const handleSaveTemplate = (t: WorkoutTemplate) => {
    saveTemplate(t);
    setEditingTemplate(null);
    setView('templates');
  };

  const handleDeleteTemplate = (id: string) => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTemplate(id) }
      ]
    );
  };

  const handleCreateAI = (t: WorkoutTemplate) => {
    saveTemplate(t);
    setView('templates');
  };

  const isFullScreen = view === 'active-workout' || view === 'workout-summary' || view === 'quick-log';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.canvas} />

        {/* FIX: Conditional styling. ActiveWorkout needs 0 padding to look native. */}
        <View style={[styles.content, isFullScreen && styles.fullScreenContent]}>
          
          {view === 'dashboard' && (
              <DashboardPage 
                  templates={templates} 
                  
                  logs={logs}startWorkout={handleStartWorkout} 
                  setView={setView} 
              />
          )}
          
          {view === 'templates' && (
              <TemplatesPage 
                  templates={templates} 
                  onEdit={(t) => { setEditingTemplate(t); setView('template-editor'); }}
                  onDelete={handleDeleteTemplate}
                  onCreate={() => { setEditingTemplate(null); setView('template-editor'); }}
                  onStart={handleStartWorkout}
              />
          )}

          {view === 'template-editor' && (
              <TemplateEditor 
                  template={editingTemplate} 
                  onSave={handleSaveTemplate} 
                  onCancel={() => setView('templates')} 
              />
          )}

          {view === 'ai-creator' && (
              <AICreatorPage 
                  onSave={handleCreateAI} 
                  onCancel={() => setView('dashboard')} 
              />
          )}

          {/* FIX: Passed previousLogs for History feature */}
          {view === 'active-workout' && activeTemplate && (
              <ActiveWorkoutPage 
                  template={activeTemplate}
                  previousLogs={logs} 
                  onFinish={handleFinishWorkout} 
              />
          )}

          {view === 'workout-summary' && lastLog && (
              <WorkoutSummaryPage
                  log={lastLog}
                  onDone={() => { setLastLog(null); setView('history'); }}
              />
          )}

          {view === 'quick-log' && (
              <QuickLogPage onSave={(log) => { addLog(log); setView('history'); }} onCancel={() => setView('dashboard')} />
          )}
          {view === 'history' && (
              <HistoryPage logs={logs} />
          )}

          {view === 'stats' && (
              <StatsPage 
                  logs={logs} 
                  userProfile={userProfile} 
                  setUserProfile={setUserProfile} 
              />
          )}
        </View>

        {view !== 'active-workout' && view !== 'workout-summary' && view !== 'template-editor' && view !== 'ai-creator' && view !== 'quick-log' && (
          <Navigation currentView={view} setView={setView} templates={templates} onStart={handleStartWorkout} onCreate={() => { setEditingTemplate(null); setView('template-editor'); }} onQuickLog={() => setView('quick-log')} />
        )}

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas, 
  },
  content: {
    flex: 1, 
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  // FIX: Removes padding for the active workout screen
  fullScreenContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default App;



