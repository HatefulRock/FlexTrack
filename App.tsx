import React, { lazy, Suspense, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { theme } from './constants/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ViewState, WorkoutTemplate, WorkoutLog } from './types';
import { useWorkoutData } from './hooks/useWorkoutDataSafe';
import { useHealthSync } from './hooks/useHealthSync';
import { useWidgetSync } from './hooks/useWidgetSync';
import { useAppFonts } from './hooks/useAppFonts';
import { DialogHost, showAlert } from './components/ui/Dialog';
import { ActiveSession, clearActiveSession, loadActiveSession } from './utils/activeSession';
import { buildExport, shareExport } from './utils/exportData';
import { describePlan, ImportedData, ImportError, importProblemMessage, isEmptyPlan, parseImport, planImport } from './utils/importData';
import { pickBackupText } from './utils/pickBackup';
import { clearSharedFiles } from './utils/sharedFiles';
import { SAMPLE_ROUTINE } from './utils/storage';
import { Onboarding, loadOnboardingSeen, markOnboardingSeen } from './components/Onboarding';

// Layout
import { Navigation } from './components/layout/Navigation';

// Pages
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { TemplatesPage } from './pages/Templates/TemplatesPage';
import { TemplateEditor } from './pages/Templates/TemplateEditor';
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
  // Gates the first render: a read that resolved after the user had already started a new
  // session would resurrect the old one as a resume card.
  const [sessionChecked, setSessionChecked] = useState(false);
  // null until read; the tour only opens for a brand-new install, never over an upgrade with data in it.
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const fontsReady = useAppFonts();

  useEffect(() => {
    clearSharedFiles();
    void loadActiveSession().then(session => { setSavedSession(session); setSessionChecked(true); });
    void loadOnboardingSeen().then(setOnboardingSeen);
  }, []);

  const {
    templates,
    logs,
    userProfile,
    unreadable,
    loading,
    setUserProfile,
    saveTemplate,
    deleteTemplate,
    addLog,
    importData
  } = useWorkoutData();
  const health = useHealthSync();
  useWidgetSync(templates, logs, !loading);

  // The editor and the activity form have an on-screen back button; the hardware key does the same
  // instead of closing the app. Active workout and the other tabs keep their own behaviour.
  useEffect(() => {
    if (Platform.OS === 'web' || (view !== 'template-editor' && view !== 'quick-log')) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setView(view === 'quick-log' ? 'dashboard' : 'templates');
      return true;
    });
    return () => handler.remove();
  }, [view]);

  const ready = !loading && fontsReady && sessionChecked && onboardingSeen !== null;
  const hasUnreadable = Object.keys(unreadable).length > 0;
  const firstRun = ready && !onboardingSeen && !hasUnreadable && templates.length === 0 && logs.length === 0;
  useEffect(() => { if (firstRun) setTourOpen(true); }, [firstRun]);
  // Runs once DialogHost has mounted with the first full render.
  useEffect(() => {
    if (ready && hasUnreadable) showAlert('Some saved data could not be read', 'FlexTrack has left it untouched so nothing is lost. Exporting your data from History includes a copy of it.');
  }, [ready, hasUnreadable]);

  if (!ready) {
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
        void addLog(log).then(() => health.onLogSaved(log), () => showAlert('Save failed', 'This workout could not be written to local storage.'));
        setLastLog(log);
        setView('workout-summary');
    } else {
        setView('dashboard');
    }
    setActiveTemplate(null);
  };

  const handleSaveTemplate = (t: WorkoutTemplate) => {
    void saveTemplate(t).catch(() => showAlert('Save failed', 'This workout could not be written to local storage.'));
    setEditingTemplate(null);
    setView('templates');
  };

  const handleUpdateActiveTemplate = (t: WorkoutTemplate) => {
    setActiveTemplate(t);
    void saveTemplate(t).catch(() => showAlert('Save failed', 'The new default weight could not be written to local storage.'));
  };

  const handleDeleteTemplate = (id: string) => {
    showAlert(
      "Delete this workout?",
      "Its history stays in your logs. The workout itself cannot be restored.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete workout", style: "destructive", onPress: () => { void deleteTemplate(id).catch(() => showAlert('Delete failed', 'The workout could not be removed from local storage.')); } }
      ]
    );
  };

  const closeTour = () => { setTourOpen(false); setOnboardingSeen(true); void markOnboardingSeen(); };

  const handleAddSample = () => {
    void saveTemplate(SAMPLE_ROUTINE).catch(() => showAlert('Save failed', 'The sample workout could not be written to local storage.'));
  };

  const handleExport = () => {
    void shareExport(buildExport(templates, logs, userProfile, new Date(), unreadable))
      .catch(() => showAlert('Export failed', 'Your data could not be exported. Try again.'));
  };

  const handleImport = async () => {
    let incoming: ImportedData;
    try {
      const text = await pickBackupText();
      if (text === null) return;
      incoming = parseImport(text);
    } catch (error) {
      showAlert('Can’t restore this file', error instanceof ImportError ? importProblemMessage(error.problem) : 'The file could not be read. Try again.');
      return;
    }
    const preview = planImport({ templates, logs, profile: userProfile }, incoming);
    if (isEmptyPlan(preview)) {
      showAlert('Nothing new to restore', 'Everything in this backup is already on this device.');
      return;
    }
    showAlert('Restore this backup?', `This adds ${describePlan(preview)}. Nothing already on this device is changed or removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: () => {
        void importData(incoming).then(({ plan, failed }) => failed.length
          ? showAlert('Some data wasn’t restored', 'Part of the backup couldn’t be written to local storage. Restoring the same file again adds only what is still missing.')
          : showAlert('Backup restored', `Added ${describePlan(plan)}.`));
      } },
    ]);
  };

  // iOS can't present the file picker or share sheet while the alert is still animating away. Web must stay
  // synchronous: the browser only opens a file picker inside the tap that asked for it.
  const afterAlert = (action: () => void) => () => { if (Platform.OS === 'ios') setTimeout(action, 350); else action(); };
  const handleBackup = () => showAlert('Back up your data', 'Export saves every workout, session and weight entry to one file. Restore adds anything in a backup file that isn’t on this device yet.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Restore from a backup', onPress: afterAlert(() => { void handleImport(); }) },
    { text: 'Export all data', onPress: afterAlert(handleExport) },
  ]);

  const isFullScreen = view === 'active-workout' || view === 'workout-summary' || view === 'quick-log';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" />

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
                  onAddSample={handleAddSample}
                  onRestore={() => { void handleImport(); }}
                  onCreate={() => { setEditingTemplate(null); setView('template-editor'); }}
                  onHelp={() => setTourOpen(true)}
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
                  templates={templates}
                  onSave={handleSaveTemplate} 
                  onCancel={() => setView('templates')} 
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
              <QuickLogPage onSave={(log) => { void addLog(log).then(() => health.onLogSaved(log), () => showAlert('Save failed', 'This activity could not be written to local storage.')); setView('history'); }} onCancel={() => setView('dashboard')} />
          )}
          {view === 'history' && (
              <HistoryPage logs={logs} templates={templates} onBackup={handleBackup} health={health.available ? { name: health.platformName!, enabled: health.enabled, onPress: () => health.openSettings(logs) } : undefined} />
          )}

          {view === 'stats' && (
            <Suspense fallback={<View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>}>
              <StatsPage 
                  logs={logs} 
                  templates={templates}
                  userProfile={userProfile} 
                  setUserProfile={setUserProfile} 
              />
            </Suspense>
          )}
        </View>

        {view !== 'active-workout' && view !== 'workout-summary' && view !== 'template-editor' && view !== 'quick-log' && (
          <Navigation currentView={view} setView={setView} templates={templates} onStart={handleStartWorkout} onCreate={() => { setEditingTemplate(null); setView('template-editor'); }} onQuickLog={() => setView('quick-log')} />
        )}

        <Onboarding visible={tourOpen} onClose={closeTour} />
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



