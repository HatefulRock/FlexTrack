import React, { lazy, Suspense, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { theme } from './constants/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ViewState, WorkoutTemplate, WorkoutLog } from './types';
import { useWorkoutData } from './hooks/useWorkoutDataSafe';
import { useAppFonts } from './hooks/useAppFonts';
import { DialogHost, showAlert } from './components/ui/Dialog';
import { ActiveSession, clearActiveSession, loadActiveSession } from './utils/activeSession';

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
import { QuickLogPage } from './pages/QuickLog/QuickLogPage';

const StatsPage = lazy(() => import('./pages/Stats/StatsPage').then(module => ({ default: module.StatsPage })));

const App = () => {
  const [view, setView] = useState<ViewState | 'template-editor'>('dashboard');
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [lastLog, setLastLog] = useState<WorkoutLog | null>(null);
  const [savedSession, setSavedSession] = useState<ActiveSession | null>(null);
  const [resumeSession, setResumeSession] = useState<ActiveSession | null>(null);
  const fontsReady = useAppFonts();

  useEffect(() => { void loadActiveSession().then(setSavedSession); }, []);

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

  if (loading || !fontsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleStartWorkout = (t: WorkoutTemplate) => {
    void clearActiveSession();
    setSavedSession(null);
    setResumeSession(null);
    setActiveTemplate(t);
    setView('active-workout');
  };

  const handleResumeWorkout = (session: ActiveSession) => {
    setSavedSession(null);
    setResumeSession(session);
    setActiveTemplate(session.template);
    setView('active-workout');
  };

  const handleDiscardSession = () => { void clearActiveSession(); setSavedSession(null); };

  const handleFinishWorkout = (log: WorkoutLog | null) => {
    void clearActiveSession();
    setResumeSession(null);
    if (log) {
        void addLog(log).catch(() => showAlert('Save failed', 'This workout could not be written to local storage.'));
        setLastLog(log);
        setView('workout-summary');
    } else {
        setView('dashboard');
    }
    setActiveTemplate(null);
  };

  const handleSaveTemplate = (t: WorkoutTemplate) => {
    void saveTemplate(t).catch(() => showAlert('Save failed', 'This routine could not be written to local storage.'));
    setEditingTemplate(null);
    setView('templates');
  };

  const handleUpdateActiveTemplate = (t: WorkoutTemplate) => {
    setActiveTemplate(t);
    void saveTemplate(t).catch(() => showAlert('Save failed', 'The new default weight could not be written to local storage.'));
  };

  const handleDeleteTemplate = (id: string) => {
    showAlert(
      "Delete this routine?",
      "Its history stays in your logs. The routine itself cannot be restored.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete routine", style: "destructive", onPress: () => { void deleteTemplate(id).catch(() => showAlert('Delete failed', 'The routine could not be removed from local storage.')); } }
      ]
    );
  };

  const handleCreateAI = (t: WorkoutTemplate) => {
    void saveTemplate(t).catch(() => showAlert('Save failed', 'This routine could not be written to local storage.'));
    setView('templates');
  };

  const isFullScreen = view === 'active-workout' || view === 'workout-summary' || view === 'quick-log';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.canvas} />

        <View style={[styles.content, isFullScreen && styles.fullScreenContent]}>
          
          {view === 'dashboard' && (
              <DashboardPage 
                  templates={templates} 
                  
                  logs={logs}
                  startWorkout={handleStartWorkout}
                  setView={setView}
                  activeSession={savedSession}
                  onResume={handleResumeWorkout}
                  onDiscardSession={handleDiscardSession}
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

          {view === 'active-workout' && activeTemplate && (
              <ActiveWorkoutPage 
 template={activeTemplate}
                  resume={resumeSession}
                  previousLogs={logs}
                  onUpdateTemplate={handleUpdateActiveTemplate}
                  onFinish={handleFinishWorkout} 
              />
          )}

          {view === 'workout-summary' && lastLog && (
              <WorkoutSummaryPage
                  log={lastLog}
                  previousLogs={logs}
                  onDone={() => { setLastLog(null); setView('dashboard'); }}
                  onViewHistory={() => { setLastLog(null); setView('history'); }}
              />
          )}

          {view === 'quick-log' && (
              <QuickLogPage onSave={(log) => { void addLog(log).catch(() => showAlert('Save failed', 'This activity could not be written to local storage.')); setView('history'); }} onCancel={() => setView('dashboard')} />
          )}
          {view === 'history' && (
              <HistoryPage logs={logs} />
          )}

          {view === 'stats' && (
            <Suspense fallback={<View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>}>
              <StatsPage 
                  logs={logs} 
                  userProfile={userProfile} 
                  setUserProfile={setUserProfile} 
              />
            </Suspense>
          )}
        </View>

        {view !== 'active-workout' && view !== 'workout-summary' && view !== 'template-editor' && view !== 'ai-creator' && view !== 'quick-log' && (
          <Navigation currentView={view} setView={setView} templates={templates} onStart={handleStartWorkout} onCreate={() => { setEditingTemplate(null); setView('template-editor'); }} onQuickLog={() => setView('quick-log')} />
        )}

        <DialogHost />
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



