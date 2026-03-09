import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';

import { Header } from '../../components/layout/Header';
import { WorkoutLog, UserProfile } from '../../types';
import { TrainingTab } from './TrainingTab';
import { BodyTab } from './BodyTab';

interface StatsPageProps {
  logs: WorkoutLog[];
  userProfile: UserProfile;
  setUserProfile: (p: UserProfile) => void;
}

export const StatsPage = ({ 
    logs, 
    userProfile, 
    setUserProfile 
}: StatsPageProps) => {
    const [activeTab, setActiveTab] = useState<'training' | 'body'>('training');

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
        >
            <Header title="Statistics" />
            
            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('training')}
                    style={[
                        styles.tab, 
                        activeTab === 'training' ? styles.activeTabTrain : styles.inactiveTab
                    ]}
                >
                    <Text style={[
                        styles.tabText, 
                        activeTab === 'training' ? styles.activeTabText : styles.inactiveTabText
                    ]}>
                        Training
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setActiveTab('body')}
                    style={[
                        styles.tab, 
                        activeTab === 'body' ? styles.activeTabBody : styles.inactiveTab
                    ]}
                >
                    <Text style={[
                        styles.tabText, 
                        activeTab === 'body' ? styles.activeTabText : styles.inactiveTabText
                    ]}>
                        Body & Health
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View style={styles.contentContainer}>
                {activeTab === 'training' && <TrainingTab logs={logs} />}
                {activeTab === 'body' && <BodyTab userProfile={userProfile} setUserProfile={setUserProfile} />}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // bg-background
  },
  scrollContent: {
    paddingBottom: 96, // pb-24
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16, // p-4
    gap: 16, // gap-4
  },
  tab: {
    flex: 1,
    paddingVertical: 10, // py-2 (approx)
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
    // Default transitions aren't supported in RN StyleSheet, requires Reanimated for smooth color fade
  },
  tabText: {
    fontWeight: 'bold', // font-bold
    fontSize: 14, // text-sm
  },
  
  // Inactive Styles
  inactiveTab: {
    backgroundColor: '#1e293b', // bg-surface
  },
  inactiveTabText: {
    color: '#94a3b8', // text-slate-400
  },

  // Active Training Styles
  activeTabTrain: {
    backgroundColor: '#0ea5e9', // bg-primary (sky-500)
    // shadow-lg
    shadowColor: '#0c4a6e', // sky-900
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },

  // Active Body Styles
  activeTabBody: {
    backgroundColor: '#059669', // bg-emerald-600
    // shadow-lg
    shadowColor: '#064e3b', // emerald-900
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },

  activeTabText: {
    color: 'white',
  },
  
  contentContainer: {
    paddingHorizontal: 16, // px-4
    paddingBottom: 16, // pb-4
  }
});