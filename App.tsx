
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, Calendar, History, Sparkles, Plus, Play, CheckCircle2, 
  Clock, ChevronRight, X, Trash2, StopCircle, TrendingUp,
  Edit2, MessageSquare, Zap, Save, ChevronDown,
  Scale, Ruler, Activity, User
} from './components/Icons';
import { generateWorkoutRoutine } from './services/geminiService';
import { Exercise, WorkoutTemplate, WorkoutLog, ViewState, SetLog, UserProfile, BodyMetricLog } from './types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';

// --- MOCK DATA / DEFAULTS ---
const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'daily-stretch',
    name: 'Daily Stretch',
    description: 'Morning mobility routine to wake up the body.',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6], // Every day
    exercises: [
      { id: 's1', name: 'Cat-Cow', type: 'reps', targetSets: 1, targetReps: 20, notes: 'Slow movement, focus on spine' },
      { id: 's2', name: 'Hamstring Stretch', type: 'timer', targetDurationSeconds: 45, notes: 'Hold each leg' },
      { id: 's3', name: 'Deep Squat Hold', type: 'timer', targetDurationSeconds: 60, notes: 'Keep heels on ground' }
    ]
  },
  {
    id: 'monday-workout',
    name: 'Monday Push',
    description: 'Start the week strong with Upper Body.',
    scheduleDays: [1], // Monday
    exercises: [
      { id: 'e1', name: 'Push Ups', type: 'reps', targetSets: 3, targetReps: 15, targetWeight: 0, restSeconds: 60, notes: 'Chest to floor' },
      { id: 'e2', name: 'Dumbbell Press', type: 'reps', targetSets: 3, targetReps: 10, targetWeight: 20, restSeconds: 90 },
      { id: 'e3', name: 'Plank', type: 'timer', targetDurationSeconds: 60, notes: 'Core tight' }
    ]
  },
  {
    id: 'running-intervals',
    name: 'Interval Run',
    description: 'High intensity interval training.',
    scheduleDays: [3, 6], // Wed, Sat
    exercises: [
        { id: 'r1', name: 'Warmup Jog', type: 'distance', targetSets: 1, targetDistance: 1, targetDistanceUnit: 'km', notes: 'Easy pace' },
        { id: 'r2', name: '400m Sprints', type: 'distance', targetSets: 6, targetDistance: 400, targetDistanceUnit: 'm', restSeconds: 120, notes: 'Max effort, 2 min rest' }
    ]
  }
];

// --- UTILS ---
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const parseTimeString = (str: string): number => {
    if (str.includes(':')) {
        const [mins, secs] = str.split(':').map(Number);
        return (mins * 60) + (secs || 0);
    }
    return parseInt(str) || 0;
};

const getShortDayName = (dayIndex: number) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

const formatSchedule = (days: number[] | undefined) => {
    if (!days || days.length === 0) return 'Unscheduled';
    if (days.length === 7) return 'Every Day';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    return days.sort().map(d => getShortDayName(d)).join(', ');
};

// --- SHARED COMPONENTS ---

const Navigation = ({ currentView, setView }: { currentView: ViewState | 'template-editor', setView: (v: ViewState) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-700 pb-safe z-50 h-16 flex justify-around items-center">
    <button onClick={() => setView('dashboard')} className={`flex flex-col items-center p-2 ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}>
      <Calendar size={24} />
      <span className="text-xs mt-1">Schedule</span>
    </button>
    <button onClick={() => setView('templates')} className={`flex flex-col items-center p-2 ${['templates', 'template-editor'].includes(currentView) ? 'text-primary' : 'text-slate-400'}`}>
      <Dumbbell size={24} />
      <span className="text-xs mt-1">Workouts</span>
    </button>
    <div className="relative -top-5">
      <button 
        onClick={() => setView('ai-creator')}
        className="bg-primary hover:bg-sky-400 text-white p-4 rounded-full shadow-lg shadow-sky-900/50 transition-all active:scale-95"
      >
        <Sparkles size={28} />
      </button>
    </div>
    <button onClick={() => setView('history')} className={`flex flex-col items-center p-2 ${currentView === 'history' ? 'text-primary' : 'text-slate-400'}`}>
      <History size={24} />
      <span className="text-xs mt-1">History</span>
    </button>
    <button onClick={() => setView('stats')} className={`flex flex-col items-center p-2 ${currentView === 'stats' ? 'text-primary' : 'text-slate-400'}`}>
      <Activity size={24} />
      <span className="text-xs mt-1">Stats</span>
    </button>
  </nav>
);

const Header = ({ title, rightAction, onBack }: { title: string, rightAction?: React.ReactNode, onBack?: () => void }) => (
  <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center h-16">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="text-slate-400 hover:text-white">
          <ChevronRight className="rotate-180" size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
    </div>
    {rightAction}
  </header>
);

// --- EXTRACTED VIEW COMPONENTS ---

const StatsView = ({ 
    logs, 
    userProfile, 
    setUserProfile 
}: { 
    logs: WorkoutLog[], 
    userProfile: UserProfile, 
    setUserProfile: (p: UserProfile) => void 
}) => {
    const [activeTab, setActiveTab] = useState<'training' | 'body'>('training');
    const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
    const [newWeight, setNewWeight] = useState<string>('');
    const [newHeight, setNewHeight] = useState<string>(userProfile.height?.toString() || '');

    // 1. Calculate Exercise List
    const exercises = useMemo(() => {
        const set = new Set<string>();
        logs.forEach(l => l.exercises.forEach(e => set.add(e.exerciseName)));
        return Array.from(set).sort();
    }, [logs]);

    // 2. Default Exercise Selection
    useEffect(() => {
        if (!selectedExerciseName && exercises.length > 0) {
            setSelectedExerciseName(exercises[0]);
        }
    }, [exercises, selectedExerciseName]);

    // 3. Prepare Chart Data (Training)
    const trainingData = useMemo(() => {
        if (!selectedExerciseName) return [];
        const relevantLogs = logs.filter(l => 
            l.exercises.some(e => e.exerciseName === selectedExerciseName)
        ).sort((a, b) => a.startTime - b.startTime);

        return relevantLogs.map(log => {
            const exercise = log.exercises.find(e => e.exerciseName === selectedExerciseName);
            if (!exercise) return null;
            const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0), 0);
            const totalReps = exercise.sets.reduce((acc, s) => acc + (s.reps || 0), 0);
            return {
                date: new Date(log.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                maxWeight,
                totalReps
            };
        }).filter(Boolean);
    }, [logs, selectedExerciseName]);

    // 4. Prepare Consistency Data (Last 14 Days)
    const consistencyData = useMemo(() => {
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString();
            const count = logs.filter(l => new Date(l.startTime).toLocaleDateString() === dateStr).length;
            days.push({ day: d.toLocaleDateString(undefined, {weekday: 'narrow'}), fullDate: dateStr, count });
        }
        return days;
    }, [logs]);

    // 5. Calculate BMI
    const currentWeight = userProfile.weightLogs.length > 0 ? userProfile.weightLogs[userProfile.weightLogs.length - 1].weight : 0;
    const bmi = (userProfile.height && currentWeight) 
        ? (currentWeight / ((userProfile.height / 100) ** 2)).toFixed(1) 
        : '--';

    const getBMIStatus = (bmiVal: string) => {
        const num = parseFloat(bmiVal);
        if (isNaN(num)) return { text: 'N/A', color: 'text-slate-500' };
        if (num < 18.5) return { text: 'Underweight', color: 'text-blue-400' };
        if (num < 25) return { text: 'Healthy', color: 'text-green-400' };
        if (num < 30) return { text: 'Overweight', color: 'text-yellow-400' };
        return { text: 'Obese', color: 'text-red-400' };
    };
    const bmiStatus = getBMIStatus(bmi);

    // Handlers
    const handleAddWeight = () => {
        if (!newWeight) return;
        const newLog: BodyMetricLog = { date: Date.now(), weight: parseFloat(newWeight) };
        const updatedLogs = [...userProfile.weightLogs, newLog].sort((a, b) => a.date - b.date);
        setUserProfile({ ...userProfile, weightLogs: updatedLogs });
        setNewWeight('');
    };

    const handleUpdateHeight = () => {
        if(!newHeight) return;
        setUserProfile({ ...userProfile, height: parseFloat(newHeight) });
    };

    const bodyChartData = userProfile.weightLogs.map(l => ({
        date: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: l.weight
    }));

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <Header title="Statistics" />
            
            {/* TABS */}
            <div className="flex p-4 gap-4">
                <button 
                    onClick={() => setActiveTab('training')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'training' ? 'bg-primary text-white shadow-lg shadow-sky-900/50' : 'bg-surface text-slate-400'}`}
                >
                    Training
                </button>
                <button 
                    onClick={() => setActiveTab('body')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'body' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-surface text-slate-400'}`}
                >
                    Body & Health
                </button>
            </div>

            <div className="px-4 pb-4 space-y-6">
                
                {/* --- TRAINING TAB --- */}
                {activeTab === 'training' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        
                        {/* Consistency Heatmap */}
                        <div className="bg-surface p-5 rounded-2xl border border-slate-700">
                            <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary"/> Workout Consistency</h3>
                            <div className="flex justify-between items-end h-16 gap-1">
                                {consistencyData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                        <div 
                                            className={`w-full rounded-t-sm transition-all ${d.count > 0 ? 'bg-primary' : 'bg-slate-800'}`} 
                                            style={{ height: d.count > 0 ? `${Math.min(d.count * 30, 100)}%` : '4px' }}
                                        ></div>
                                        <span className="text-[10px] text-slate-500 uppercase">{d.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exercise Selector */}
                        <div className="bg-surface p-4 rounded-2xl border border-slate-700">
                            <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Analyze Exercise</label>
                            <div className="relative">
                                <select 
                                    value={selectedExerciseName}
                                    onChange={(e) => setSelectedExerciseName(e.target.value)}
                                    className="w-full bg-black border border-slate-600 rounded-lg p-3 text-white appearance-none focus:border-primary outline-none"
                                >
                                    {exercises.length === 0 && <option>No exercises logged yet</option>}
                                    {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Chart 1: Max Weight */}
                        {trainingData.length > 0 ? (
                            <>
                                <div className="bg-surface p-5 rounded-2xl border border-slate-700 shadow-lg">
                                    <h3 className="text-slate-200 font-bold mb-1">Max Weight Progression</h3>
                                    <p className="text-xs text-slate-400 mb-4">Heaviest set per session</p>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trainingData}>
                                                <defs>
                                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} unit="kg" />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                                                    itemStyle={{ color: '#38bdf8' }}
                                                />
                                                <Area type="monotone" dataKey="maxWeight" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Chart 2: Volume */}
                                <div className="bg-surface p-5 rounded-2xl border border-slate-700 shadow-lg">
                                    <h3 className="text-slate-200 font-bold mb-1">Volume Load</h3>
                                    <p className="text-xs text-slate-400 mb-4">Total reps per session</p>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={trainingData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                                                <Tooltip 
                                                    cursor={{fill: '#334155', opacity: 0.2}}
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                                                />
                                                <Bar dataKey="totalReps" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                             <div className="text-center text-slate-500 py-10 bg-surface rounded-2xl border border-slate-800 border-dashed">
                                <p>Select an exercise to view stats.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- BODY TAB --- */}
                {activeTab === 'body' && (
                     <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        
                        {/* Profile Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                                <Scale className="text-emerald-500 mb-2" size={24} />
                                <div className="text-2xl font-bold text-white">{currentWeight || '--'} <span className="text-sm font-normal text-slate-400">kg</span></div>
                                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Current Weight</div>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                                <Ruler className="text-emerald-500 mb-2" size={24} />
                                {userProfile.height ? (
                                    <div className="text-2xl font-bold text-white">{userProfile.height} <span className="text-sm font-normal text-slate-400">cm</span></div>
                                ) : (
                                    <div className="flex flex-col gap-1 w-full">
                                        <input 
                                            type="number" 
                                            placeholder="Height (cm)" 
                                            className="bg-black/30 text-center text-white text-sm rounded p-1 w-full outline-none border border-slate-600 focus:border-emerald-500"
                                            value={newHeight}
                                            onChange={(e) => setNewHeight(e.target.value)}
                                            onBlur={handleUpdateHeight}
                                        />
                                    </div>
                                )}
                                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Height</div>
                            </div>
                        </div>

                        {/* BMI Card */}
                        <div className="bg-gradient-to-br from-surface to-slate-900 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Body Mass Index</h3>
                                <div className="text-3xl font-bold text-white">{bmi}</div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${bmiStatus.color}`}>{bmiStatus.text}</div>
                                <div className="text-xs text-slate-500">BMI Score</div>
                            </div>
                        </div>

                        {/* Weight Chart */}
                        <div className="bg-surface p-5 rounded-2xl border border-slate-700 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-200 font-bold">Weight History</h3>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="kg"
                                        value={newWeight}
                                        onChange={(e) => setNewWeight(e.target.value)}
                                        className="w-16 bg-black border border-slate-600 rounded-lg px-2 py-1 text-white text-sm focus:border-emerald-500 outline-none"
                                    />
                                    <button onClick={handleAddWeight} className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg">
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            {bodyChartData.length > 1 ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={bodyChartData}>
                                            <defs>
                                                <linearGradient id="colorBody" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} unit="kg" />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                                            />
                                            <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBody)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
                                    <Scale className="mb-2 opacity-50" />
                                    <p>Log at least 2 entries to see trend.</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Logs List */}
                        <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden">
                             <div className="p-4 border-b border-slate-700 font-bold text-slate-300">Recent Logs</div>
                             {userProfile.weightLogs.slice().reverse().slice(0, 5).map((log, idx) => (
                                 <div key={idx} className="p-4 flex justify-between items-center border-b border-slate-800 last:border-0">
                                     <span className="text-slate-400 text-sm">{new Date(log.date).toLocaleDateString()}</span>
                                     <span className="text-white font-bold">{log.weight} kg</span>
                                 </div>
                             ))}
                             {userProfile.weightLogs.length === 0 && <div className="p-4 text-center text-slate-500">No logs yet.</div>}
                        </div>

                     </div>
                )}
            </div>
        </div>
    );
};

const DashboardView = ({ 
    templates, 
    startWorkout, 
    setView 
}: { 
    templates: WorkoutTemplate[], 
    startWorkout: (t: WorkoutTemplate) => void, 
    setView: (v: ViewState) => void 
}) => {
    const todayIndex = new Date().getDay();
    const days = [0, 1, 2, 3, 4, 5, 6];
    
    const weeklySchedule = days.map(d => ({
      day: d,
      workouts: templates.filter(t => t.scheduleDays?.includes(d))
    }));

    const todaysWorkouts = templates.filter(t => t.scheduleDays?.includes(todayIndex));

    return (
      <div className="pb-24 animate-in fade-in duration-500">
        <Header title="Dashboard" />
        <div className="p-4 space-y-6">
          {/* Weekly Schedule Strip */}
          <div className="space-y-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Weekly Schedule</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {weeklySchedule.map((slot) => {
                const isToday = slot.day === todayIndex;
                const hasWorkout = slot.workouts.length > 0;
                return (
                  <div 
                    key={slot.day}
                    onClick={() => { if (slot.workouts.length > 0) startWorkout(slot.workouts[0]); }}
                    className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative
                      ${isToday ? 'bg-primary border-primary text-white shadow-lg shadow-sky-900/50' : 'bg-surface border-slate-700 text-slate-400'}
                      ${hasWorkout && !isToday ? 'hover:border-primary/50' : ''}
                    `}
                  >
                    <span className="text-xs font-bold">{getShortDayName(slot.day)}</span>
                    <div className="mt-2">
                      {hasWorkout ? <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-white' : 'bg-primary'}`}></div> : <span className="text-xs opacity-20">-</span>}
                    </div>
                    {isToday && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Focus Card */}
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 shadow-lg text-white">
            <p className="text-blue-100 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h2 className="text-3xl font-bold mb-4">Ready to train?</h2>
            
            {todaysWorkouts.length > 0 ? (
                <div className="space-y-3">
                    {todaysWorkouts.map((workout, idx) => (
                        <div key={workout.id} className={`p-4 rounded-xl backdrop-blur-sm border border-white/20 ${idx === 0 ? 'bg-white/10' : 'bg-white/5'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full uppercase">Scheduled</span>
                            </div>
                            <h3 className="text-xl font-bold">{workout.name}</h3>
                            <p className="text-sm opacity-90 mb-4">{workout.exercises.length} Exercises</p>
                            <button onClick={() => startWorkout(workout)} className="w-full bg-white text-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                <Play size={20} fill="currentColor" /> Start Workout
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="mb-4 text-center text-blue-100">Rest day! Or pick a routine from your list.</p>
                <button onClick={() => setView('templates')} className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors border border-white/30">
                  Browse Workouts
                </button>
              </div>
            )}
          </div>

          {/* Quick Access */}
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-3">Your Templates</h3>
            <div className="space-y-3">
              {templates.slice(0, 3).map(template => (
                <div key={template.id} onClick={() => startWorkout(template)} className="bg-surface p-4 rounded-xl border border-slate-700 flex justify-between items-center cursor-pointer hover:border-primary transition-colors active:bg-slate-800">
                  <div>
                    <h4 className="font-semibold text-slate-100">{template.name}</h4>
                    <p className="text-xs text-slate-400">{template.exercises.length} exercises • {formatSchedule(template.scheduleDays)}</p>
                  </div>
                  <div className="bg-slate-700 p-2 rounded-full">
                    <Play size={16} className="text-primary ml-0.5" />
                  </div>
                </div>
              ))}
              <button onClick={() => setView('templates')} className="w-full py-3 text-sm text-slate-500 text-center hover:text-primary">
                View All Workouts
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

const TemplatesView = ({ 
    templates, 
    setTemplates, 
    startWorkout, 
    openTemplateEditor, 
    createNewTemplate 
}: { 
    templates: WorkoutTemplate[], 
    setTemplates: any, 
    startWorkout: (t: WorkoutTemplate) => void, 
    openTemplateEditor: (t: WorkoutTemplate) => void, 
    createNewTemplate: () => void 
}) => {
    const deleteTemplate = (id: string) => {
        if (confirm('Delete this workout template?')) {
            setTemplates((prev: WorkoutTemplate[]) => prev.filter(t => t.id !== id));
        }
    };

    return (
        <div className="pb-24 animate-in fade-in duration-500">
        <Header 
            title="Workouts" 
            rightAction={<button onClick={createNewTemplate} className="text-primary p-2"><Plus size={24} /></button>}
        />
        <div className="p-4 space-y-4">
            {templates.map(template => (
            <div key={template.id} className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{template.name}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => openTemplateEditor(template)} className="text-slate-400 hover:text-white"><Edit2 size={18}/></button>
                        <button onClick={() => deleteTemplate(template.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={18}/></button>
                    </div>
                </div>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description || 'No description'}</p>
                
                <div className="flex gap-2 mb-4">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{formatSchedule(template.scheduleDays)}</span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{template.exercises.length} Exercises</span>
                </div>
                
                <button onClick={() => startWorkout(template)} className="w-full bg-slate-700 hover:bg-primary hover:text-white text-slate-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                    <Play size={16} /> Start
                </button>
                </div>
            </div>
            ))}
            {templates.length === 0 && <div className="text-center py-10 text-slate-500"><p>No workouts yet. Create one or use AI!</p></div>}
        </div>
        </div>
    );
};

const TemplateEditorView = ({ 
    editingTemplate, 
    setEditingTemplate, 
    onSave, 
    onBack 
}: { 
    editingTemplate: WorkoutTemplate, 
    setEditingTemplate: React.Dispatch<React.SetStateAction<WorkoutTemplate | null>>, 
    onSave: () => void, 
    onBack: () => void 
}) => {
    const handleUpdate = (field: keyof WorkoutTemplate, value: any) => {
      setEditingTemplate((prev: any) => prev ? ({ ...prev, [field]: value }) : null);
    };

    const toggleDay = (dayIndex: number) => {
        const currentDays = editingTemplate.scheduleDays || [];
        let newDays;
        if (currentDays.includes(dayIndex)) {
            newDays = currentDays.filter(d => d !== dayIndex);
        } else {
            newDays = [...currentDays, dayIndex].sort();
        }
        handleUpdate('scheduleDays', newDays);
    };

    const updateExercise = (index: number, field: keyof Exercise, value: any) => {
      const newExercises = [...editingTemplate.exercises];
      newExercises[index] = { ...newExercises[index], [field]: value };
      setEditingTemplate((prev: any) => ({ ...prev, exercises: newExercises }));
    };

    const removeExercise = (index: number) => {
      const newExercises = editingTemplate.exercises.filter((_, i) => i !== index);
      setEditingTemplate((prev: any) => ({ ...prev, exercises: newExercises }));
    };

    const addExercise = () => {
        const newEx: Exercise = {
            id: Date.now().toString(),
            name: 'New Exercise',
            type: 'reps',
            targetSets: 3,
            targetReps: 10,
            targetWeight: 0
        };
        setEditingTemplate((prev: any) => ({...prev, exercises: [...prev.exercises, newEx]}));
    }

    return (
      <div className="pb-24 animate-in slide-in-from-right duration-300 bg-background min-h-screen z-50 absolute top-0 w-full">
        <Header title="Edit Workout" onBack={onBack} rightAction={<button onClick={onSave} className="text-primary font-bold">Save</button>} />
        <div className="p-4 space-y-6">
          <div className="space-y-4 bg-surface p-4 rounded-xl border border-slate-700">
             <div>
                <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Workout Name</label>
                <input value={editingTemplate.name} onChange={(e) => handleUpdate('name', e.target.value)} className="w-full bg-black border border-slate-600 rounded p-2 text-white focus:border-primary outline-none" />
             </div>
             <div>
                <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Schedule Days (Tap to toggle)</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                        const isSelected = editingTemplate.scheduleDays?.includes(idx);
                        return (
                            <button key={day} onClick={() => toggleDay(idx)} className={`px-3 py-2 rounded-lg text-sm font-bold border ${isSelected ? 'bg-primary border-primary text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {day}
                            </button>
                        );
                    })}
                </div>
             </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-slate-200 font-bold">Exercises</h3>
                <button onClick={addExercise} className="text-primary text-sm font-bold flex items-center gap-1"><Plus size={16}/> Add</button>
            </div>
            
            <div className="space-y-3">
              {editingTemplate.exercises.map((ex, idx) => (
                <div key={ex.id} className="bg-surface p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <input value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} className="bg-transparent font-bold text-white border-b border-transparent focus:border-slate-500 outline-none w-full mr-2" />
                    <button onClick={() => removeExercise(idx)} className="text-red-400 p-1"><X size={16} /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] text-slate-500 uppercase block">Type</label>
                        <select value={ex.type} onChange={(e) => updateExercise(idx, 'type', e.target.value)} className="w-full bg-black/50 text-slate-300 text-sm p-1 rounded border border-slate-700">
                            <option value="reps">Reps & Sets</option>
                            <option value="timer">Timer</option>
                            <option value="distance">Distance / Cardio</option>
                        </select>
                     </div>
                     {ex.type === 'reps' && (
                        <>
                           <div><label className="text-[10px] text-slate-500 uppercase block">Sets</label><input type="number" value={ex.targetSets} onChange={(e) => updateExercise(idx, 'targetSets', parseInt(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                           <div><label className="text-[10px] text-slate-500 uppercase block">Reps</label><input type="number" value={ex.targetReps} onChange={(e) => updateExercise(idx, 'targetReps', parseInt(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                           <div><label className="text-[10px] text-slate-500 uppercase block">Weight (kg)</label><input type="number" value={ex.targetWeight || 0} onChange={(e) => updateExercise(idx, 'targetWeight', parseFloat(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                           <div><label className="text-[10px] text-slate-500 uppercase block">Rest (s)</label><input type="number" value={ex.restSeconds || ''} placeholder="60" onChange={(e) => updateExercise(idx, 'restSeconds', parseInt(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                        </>
                     )}
                     {ex.type === 'timer' && (
                        <div className="col-span-1"><label className="text-[10px] text-slate-500 uppercase block">Seconds</label><input type="number" value={ex.targetDurationSeconds} onChange={(e) => updateExercise(idx, 'targetDurationSeconds', parseInt(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                     )}
                     {ex.type === 'distance' && (
                        <>
                            <div><label className="text-[10px] text-slate-500 uppercase block">Sets</label><input type="number" value={ex.targetSets} onChange={(e) => updateExercise(idx, 'targetSets', parseInt(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                            <div><label className="text-[10px] text-slate-500 uppercase block">Distance</label><input type="number" value={ex.targetDistance} onChange={(e) => updateExercise(idx, 'targetDistance', parseFloat(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                            <div><label className="text-[10px] text-slate-500 uppercase block">Unit</label><select value={ex.targetDistanceUnit || 'km'} onChange={(e) => updateExercise(idx, 'targetDistanceUnit', e.target.value)} className="w-full bg-black/50 text-slate-300 text-sm p-1 rounded border border-slate-700"><option value="km">km</option><option value="m">meters</option><option value="miles">miles</option></select></div>
                            <div><label className="text-[10px] text-slate-500 uppercase block">Rest (s)</label><input type="number" value={ex.restSeconds || ''} placeholder="60" onChange={(e) => updateExercise(idx, 'restSeconds', parseInt(e.target.value))} className="w-full bg-black/50 text-white text-sm p-1 rounded border border-slate-700"/></div>
                        </>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
};

const HistoryView = ({ logs, setView }: { logs: WorkoutLog[], setView: (v: ViewState) => void }) => {
    const stats = useMemo(() => {
        if (logs.length === 0) return null;
        let totalDurationMs = 0;
        const typeCounts: Record<string, number> = {};
        logs.forEach(log => {
            if (log.endTime) totalDurationMs += (log.endTime - log.startTime);
            const name = log.templateName || 'Unknown';
            typeCounts[name] = (typeCounts[name] || 0) + 1;
        });
        const avgMinutes = Math.round((totalDurationMs / 1000 / 60) / logs.length);
        let mostFrequent = 'N/A';
        let maxCount = 0;
        Object.entries(typeCounts).forEach(([name, count]) => {
            if (count > maxCount) { maxCount = count; mostFrequent = name; }
        });
        return { total: logs.length, avgDuration: avgMinutes, mostFrequent };
    }, [logs]);

    return (
    <div className="pb-24 animate-in fade-in duration-500">
      <Header title="History" />
      <div className="p-4 space-y-4">
        {logs.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">No completed workouts yet.</div>
        ) : (
          <>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="bg-surface rounded-xl border border-slate-700 p-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-white">{log.templateName}</h3>
                    <span className="text-slate-400 text-sm">{new Date(log.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1"><Clock size={14} /><span>{formatTime(Math.floor(((log.endTime || 0) - log.startTime) / 1000))}</span></div>
                    <div className="flex items-center gap-1"><Dumbbell size={14} /><span>{log.exercises.reduce((acc, ex) => acc + (ex.completed || ex.sets.some(s => s.completed) ? 1 : 0), 0)} Exercises</span></div>
                  </div>
                </div>
              ))}
            </div>
            {stats && (
                <div className="mt-8 pt-6 border-t border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-primary"/> Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total Workouts</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-slate-400 uppercase font-bold">Avg Duration</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.avgDuration} min</p>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-slate-700 col-span-2">
                            <p className="text-xs text-slate-400 uppercase font-bold">Most Frequent</p>
                            <p className="text-xl font-bold text-primary mt-1 truncate">{stats.mostFrequent}</p>
                        </div>
                        <button onClick={() => setView('stats')} className="col-span-2 py-3 text-sm text-primary font-bold border border-primary/30 rounded-xl hover:bg-primary/10">View Detailed Analytics</button>
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  )};
};

const AICreatorView = ({ 
    aiPrompt, 
    setAiPrompt, 
    handleGenerateAI, 
    isGenerating,
    generatedTemplate,
    setGeneratedTemplate,
    onApprove,
    onDiscard
}: any) => {
    // Local state for the "Refine" text box
    const [refinePrompt, setRefinePrompt] = useState('');

    // Re-use logic from template editor to allow manual tweaks before approval
    const handleUpdate = (field: keyof WorkoutTemplate, value: any) => {
        setGeneratedTemplate((prev: any) => prev ? ({ ...prev, [field]: value }) : null);
    };

    const updateExercise = (index: number, field: keyof Exercise, value: any) => {
        const newExercises = [...generatedTemplate.exercises];
        newExercises[index] = { ...newExercises[index], [field]: value };
        setGeneratedTemplate((prev: any) => ({ ...prev, exercises: newExercises }));
    };

    const removeExercise = (index: number) => {
        const newExercises = generatedTemplate.exercises.filter((_: any, i: number) => i !== index);
        setGeneratedTemplate((prev: any) => ({ ...prev, exercises: newExercises }));
    };

    // Refinement Handler
    const handleRefine = () => {
        if (!refinePrompt.trim()) return;
        // Trigger the parent's generate function but pass the current state
        handleGenerateAI(refinePrompt);
        setRefinePrompt('');
    };

    if (generatedTemplate) {
        return (
            <div className="pb-32 animate-in slide-in-from-right duration-300">
                <header className="sticky top-0 z-40 bg-purple-900/80 backdrop-blur-md border-b border-purple-500/50 p-4 flex justify-between items-center h-16 shadow-lg shadow-purple-900/20">
                    <h1 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={18} className="text-purple-300" /> AI Preview</h1>
                    <button onClick={onDiscard} className="text-slate-300 text-sm hover:text-white">Discard</button>
                </header>

                <div className="p-4 space-y-6">
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                        <p className="text-sm text-purple-200 mb-2">Review your generated workout. You can edit details directly or use the AI chat below to refine it.</p>
                        <button onClick={onApprove} className="w-full bg-primary hover:bg-sky-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30">
                            <CheckCircle2 size={20} /> Approve & Add to Library
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Workout Name</label>
                            <input value={generatedTemplate.name} onChange={(e) => handleUpdate('name', e.target.value)} className="w-full bg-black border border-slate-600 rounded p-2 text-white focus:border-primary outline-none" />
                        </div>

                        <div className="space-y-3">
                            {generatedTemplate.exercises.map((ex: Exercise, idx: number) => (
                                <div key={ex.id} className="bg-surface p-4 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-start mb-3">
                                        <input value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} className="bg-transparent font-bold text-white border-b border-transparent focus:border-slate-500 outline-none w-full mr-2" />
                                        <button onClick={() => removeExercise(idx)} className="text-red-400 p-1"><X size={16} /></button>
                                    </div>
                                    <div className="text-xs text-slate-500 flex gap-3">
                                        {ex.type === 'reps' && <span>{ex.targetSets} sets x {ex.targetReps} reps</span>}
                                        {ex.type === 'timer' && <span>{ex.targetDurationSeconds}s duration</span>}
                                        {ex.type === 'distance' && <span>{ex.targetDistance} {ex.targetDistanceUnit}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Refine Bar */}
                <div className="fixed bottom-16 left-0 right-0 p-4 bg-surface border-t border-slate-700 z-50">
                    <div className="relative flex items-center">
                        <input 
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleRefine()}
                            placeholder={isGenerating ? "AI is thinking..." : "Refine this... (e.g. 'Make it harder', 'Swap runs for bikes')"}
                            disabled={isGenerating}
                            className="w-full bg-black border border-slate-600 rounded-full pl-4 pr-12 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        />
                        <button 
                            onClick={handleRefine}
                            disabled={!refinePrompt.trim() || isGenerating}
                            className="absolute right-2 bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full disabled:opacity-50"
                        >
                            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <Header title="AI Workout Creator" />
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 p-8 rounded-full mb-6 relative">
                    <Sparkles size={48} className="text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Describe your goal</h2>
                <p className="text-slate-400 text-center mb-8 max-w-xs">Tell AI what you want to achieve, equipment you have, or how much time you have.</p>
                <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Create a 30 min home workout with no equipment focusing on abs and legs..."
                    className="w-full h-32 bg-surface border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none mb-6"
                />
                <button 
                    onClick={() => handleGenerateAI()}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-400 text-white shadow-lg shadow-sky-900/50'}`}
                >
                    {isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Generating...</> : <><Sparkles size={20} /> Generate Workout</>}
                </button>
            </div>
        </div>
    );
};

const ActiveWorkoutView = ({
    activeTemplate,
    activeLog,
    activeExerciseIndex,
    elapsedTime,
    exerciseTimer,
    isTimerRunning,
    restTimer,
    isResting,
    expandedNotes,
    handleNext,
    handlePrev,
    finishWorkout,
    toggleTimer,
    resetTimer,
    setIsResting,
    setRestTimer,
    toggleNote,
    handleSetUpdate,
    toggleSetComplete,
    quickFinishExercise
}: any) => {
    if (!activeTemplate || !activeLog) return null;
    const currentExercise = activeTemplate.exercises[activeExerciseIndex];
    const currentLog = activeLog.exercises![activeExerciseIndex];
    const isLastExercise = activeExerciseIndex === activeTemplate.exercises.length - 1;
    const isFirstExercise = activeExerciseIndex === 0;

    return (
      <div className="h-screen flex flex-col bg-black relative">
        {/* REST OVERLAY */}
        {isResting && (
             <div className="absolute inset-x-0 bottom-20 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="bg-surface/95 backdrop-blur-md border border-slate-600 shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col items-center">
                    <div className="flex justify-between w-full items-center mb-4">
                         <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold animate-pulse">Resting</h3>
                         <button onClick={() => setIsResting(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
                    </div>
                    <div className="text-6xl font-mono font-bold text-primary mb-6 tabular-nums tracking-tighter">{formatTime(restTimer)}</div>
                    <div className="flex gap-2 w-full">
                         <button onClick={() => setRestTimer((prev: number) => Math.max(0, prev - 30))} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold border border-slate-700 text-xs">-30s</button>
                         <button onClick={() => setRestTimer((prev: number) => Math.max(0, prev - 10))} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold border border-slate-700 text-xs">-10s</button>
                         <button onClick={() => setIsResting(false)} className="flex-[1.5] bg-white text-black hover:bg-slate-200 py-3 rounded-xl font-bold text-sm">Skip</button>
                         <button onClick={() => setRestTimer((prev: number) => prev + 10)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold border border-slate-700 text-xs">+10s</button>
                         <button onClick={() => setRestTimer((prev: number) => prev + 30)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold border border-slate-700 text-xs">+30s</button>
                    </div>
                </div>
             </div>
        )}

        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-surface">
           <div><h2 className="text-sm text-slate-400 uppercase tracking-wider">{activeTemplate.name}</h2><div className="text-2xl font-mono text-primary font-bold">{formatTime(elapsedTime)}</div></div>
           <button onClick={finishWorkout} className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-500/50">End</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="bg-surface/50 border border-slate-700/50 rounded-2xl p-5 mb-4 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold text-white leading-tight pr-4">{currentExercise.name}</h1>
                <span className="text-slate-500 text-xs font-mono whitespace-nowrap bg-black/40 px-2 py-1 rounded">{activeExerciseIndex + 1} / {activeTemplate.exercises.length}</span>
             </div>
             {currentExercise.notes && <p className="text-slate-400 text-sm mb-2">{currentExercise.notes}</p>}
             <div className="flex gap-2 mt-2">
                 {currentExercise.type === 'distance' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-bold uppercase">Cardio</span>}
                 {currentExercise.type === 'reps' && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded font-bold uppercase">Weights</span>}
                 {currentExercise.type === 'timer' && <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded font-bold uppercase">Timed</span>}
             </div>
          </div>

          {(currentExercise.type === 'reps' || currentExercise.type === 'distance') && (
            <div className="flex justify-end mb-4">
                 <button onClick={quickFinishExercise} className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors"><Zap size={14} className="fill-current" /> Quick Finish & Rest</button>
            </div>
          )}

          {currentExercise.type === 'reps' && (
            <div className="space-y-3">
              <div className="grid grid-cols-10 gap-2 px-2 mb-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center">
                <div className="col-span-1">Set</div><div className="col-span-3">Target</div><div className="col-span-2">Reps</div><div className="col-span-2">Kg</div><div className="col-span-2">Status</div>
              </div>
              {currentLog.sets.map((set: any, idx: number) => {
                const hasNote = expandedNotes[`set-${idx}`];
                return (
                    <div key={idx} className={`flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${set.completed ? 'bg-green-950/20 border-green-500/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]' : 'bg-surface border-slate-800'}`}>
                        <div className="grid grid-cols-10 gap-2 items-center p-3">
                            <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-sm">{idx + 1}</div>
                            <div className="col-span-3 text-center text-slate-400 text-sm font-medium">{currentExercise.targetReps} <span className="text-slate-600">x</span> {currentExercise.targetWeight}</div>
                            <div className="col-span-2"><input type="number" value={set.reps} onChange={(e) => handleSetUpdate(activeExerciseIndex, idx, 'reps', parseInt(e.target.value) || 0)} className={`w-full bg-black/40 border border-transparent rounded-lg text-center py-2 text-white font-bold outline-none focus:border-slate-500 focus:bg-black transition-all ${set.completed ? 'text-green-400' : ''}`} /></div>
                            <div className="col-span-2"><input type="number" value={set.weight} placeholder={currentExercise.targetWeight?.toString()} onChange={(e) => handleSetUpdate(activeExerciseIndex, idx, 'weight', parseFloat(e.target.value) || 0)} className={`w-full bg-black/40 border border-transparent rounded-lg text-center py-2 text-white font-bold outline-none focus:border-slate-500 focus:bg-black transition-all ${set.completed ? 'text-green-400' : ''}`} /></div>
                            <div className="col-span-2 flex justify-center"><button onClick={() => toggleSetComplete(activeExerciseIndex, idx)} className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-sm ${set.completed ? 'bg-green-500 text-black scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}><CheckCircle2 size={18} /></button></div>
                        </div>
                        <div className="px-3 pb-2 flex justify-start"><button onClick={() => toggleNote(`set-${idx}`)} className="text-slate-600 hover:text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider p-1"><MessageSquare size={10} /> {hasNote ? 'Hide Note' : (set.notes ? 'Edit Note' : 'Add Note')}</button></div>
                        {hasNote && <div className="px-3 pb-3 animate-in slide-in-from-top-2"><input type="text" placeholder="Add set notes..." autoFocus value={set.notes || ''} onChange={(e) => handleSetUpdate(activeExerciseIndex, idx, 'notes', e.target.value)} className="w-full bg-black/30 border border-slate-700/50 rounded-lg text-xs px-3 py-2 text-slate-300 focus:border-primary outline-none" /></div>}
                    </div>
                );
              })}
            </div>
          )}
          
          {currentExercise.type === 'distance' && (
             <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 px-2 mb-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center">
                    <div className="col-span-2">Set</div><div className="col-span-3">Target</div><div className="col-span-3">Dist</div><div className="col-span-2">Time</div><div className="col-span-2">Status</div>
                </div>
                {currentLog.sets.map((set: any, idx: number) => {
                    const hasNote = expandedNotes[`set-${idx}`];
                    return (
                        <div key={idx} className={`flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${set.completed ? 'bg-green-950/20 border-green-500/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]' : 'bg-surface border-slate-800'}`}>
                            <div className="grid grid-cols-12 gap-2 items-center p-3">
                                <div className="col-span-2 text-center font-bold text-slate-400 font-mono text-sm">#{idx + 1}</div>
                                <div className="col-span-3 text-center text-slate-400 text-sm font-medium">{currentExercise.targetDistance} {currentExercise.targetDistanceUnit}</div>
                                <div className="col-span-3"><input type="number" value={set.distance || ''} placeholder={currentExercise.targetDistance?.toString()} onChange={(e) => handleSetUpdate(activeExerciseIndex, idx, 'distance', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-transparent rounded-lg text-center py-2 text-white font-bold outline-none focus:border-slate-500 focus:bg-black transition-all" /></div>
                                <div className="col-span-2"><input type="text" placeholder="mm:ss" defaultValue={set.durationSeconds ? formatTime(set.durationSeconds) : ''} onBlur={(e) => handleSetUpdate(activeExerciseIndex, idx, 'durationSeconds', parseTimeString(e.target.value))} className="w-full bg-black/40 border border-transparent rounded-lg text-center py-2 text-white font-bold outline-none focus:border-slate-500 focus:bg-black text-xs transition-all" /></div>
                                <div className="col-span-2 flex justify-center"><button onClick={() => toggleSetComplete(activeExerciseIndex, idx)} className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-sm ${set.completed ? 'bg-green-500 text-black scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}><CheckCircle2 size={18} /></button></div>
                            </div>
                            <div className="px-3 pb-2 flex justify-start"><button onClick={() => toggleNote(`set-${idx}`)} className="text-slate-600 hover:text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider p-1"><MessageSquare size={10} /> {hasNote ? 'Hide Note' : (set.notes ? 'Edit Note' : 'Add Note')}</button></div>
                            {hasNote && <div className="px-3 pb-3 animate-in slide-in-from-top-2"><input type="text" placeholder="Add split notes..." autoFocus value={set.notes || ''} onChange={(e) => handleSetUpdate(activeExerciseIndex, idx, 'notes', e.target.value)} className="w-full bg-black/30 border border-slate-700/50 rounded-lg text-xs px-3 py-2 text-slate-300 focus:border-primary outline-none" /></div>}
                        </div>
                    );
                })}
             </div>
          )}

          {currentExercise.type === 'timer' && (
            <div className="flex flex-col items-center justify-center py-12">
               <div className="w-64 h-64 rounded-full border-8 border-surface flex items-center justify-center relative mb-8 shadow-2xl shadow-black/50">
                 {isTimerRunning && <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin-slow opacity-20"></div>}
                 <div className="text-center">
                    <span className="text-5xl font-mono font-bold block">{exerciseTimer > 0 ? formatTime(exerciseTimer) : formatTime(currentExercise.targetDurationSeconds || 0)}</span>
                    <span className="text-slate-400 uppercase text-xs tracking-widest font-bold mt-2 block">{isTimerRunning ? 'Running' : 'Target Time'}</span>
                 </div>
               </div>
               <div className="flex gap-4">
                    <button onClick={toggleTimer} className={`${isTimerRunning ? 'bg-orange-500 hover:bg-orange-400' : 'bg-primary hover:bg-primary/90'} text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-black/40 flex items-center gap-3 transition-all active:scale-95`}>
                        {isTimerRunning ? <StopCircle size={24} /> : <Play size={24} fill="currentColor" />} {isTimerRunning ? 'Pause' : (exerciseTimer > 0 && exerciseTimer !== currentExercise.targetDurationSeconds ? 'Resume' : 'Start Timer')}
                    </button>
                    <button onClick={resetTimer} className="bg-surface border border-slate-600 hover:bg-slate-700 text-white px-6 py-4 rounded-full font-bold transition-all">Reset</button>
               </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-slate-800 flex gap-3 z-40 pb-safe">
           <button onClick={handlePrev} disabled={isFirstExercise} className={`px-4 py-3 rounded-xl font-bold border transition-colors ${isFirstExercise ? 'border-slate-800 text-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-800 active:bg-slate-700'}`}><ChevronRight size={20} className="rotate-180"/></button>
           <button onClick={isLastExercise ? finishWorkout : handleNext} className={`flex-1 py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2 shadow-lg ${isLastExercise ? 'bg-green-500 hover:bg-green-400 shadow-green-900/20' : 'bg-white hover:bg-slate-200'}`}>
             {isLastExercise ? 'Finish Workout' : <><>Next Exercise <ChevronRight size={20} /></></>}
           </button>
        </div>
      </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState | 'template-editor'>('dashboard');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() => {
    const saved = localStorage.getItem('templates');
    if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
            ...t,
            scheduleDays: t.scheduleDays || (t.dayOfWeek !== undefined && t.dayOfWeek > -1 ? [t.dayOfWeek] : [])
        }));
    }
    return DEFAULT_TEMPLATES;
  });
  const [logs, setLogs] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : { weightLogs: [] };
  });
  
  // Active Workout State
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeLog, setActiveLog] = useState<Partial<WorkoutLog> | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Timers
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // Template Editor State
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  // Staging area for AI generated workout before approval
  const [generatedTemplate, setGeneratedTemplate] = useState<WorkoutTemplate | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Global Workout Timer
  useEffect(() => {
    let interval: any;
    if (view === 'active-workout' && activeLog) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, activeLog]);

  // Exercise Specific Timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && exerciseTimer > 0) {
      interval = setInterval(() => {
        setExerciseTimer(prev => {
          if (prev <= 1) { setIsTimerRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, exerciseTimer]);

  // Rest Timer
  useEffect(() => {
    let interval: any;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) { setIsResting(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimer <= 0) {
        setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const startWorkout = (template: WorkoutTemplate) => {
    setActiveTemplate(template);
    setActiveExerciseIndex(0);
    setElapsedTime(0);
    setExerciseTimer(0);
    setIsTimerRunning(false);
    setRestTimer(0);
    setIsResting(false);
    setExpandedNotes({});
    
    const initialLog: Partial<WorkoutLog> = {
      id: Date.now().toString(),
      templateId: template.id,
      templateName: template.name,
      startTime: Date.now(),
      exercises: template.exercises.map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        completed: false,
        sets: (ex.type === 'reps' || ex.type === 'distance')
          ? Array(ex.targetSets || 1).fill({ completed: false, reps: ex.targetReps, weight: ex.targetWeight, distance: ex.targetDistance, durationSeconds: 0, setNumber: 0 }).map((s, i) => ({ ...s, setNumber: i + 1 })) 
          : [],
        durationSeconds: 0
      }))
    };
    setActiveLog(initialLog);
    setView('active-workout');
  };

  const finishWorkout = () => {
    if (!activeLog) return;
    const completedLog: WorkoutLog = { ...(activeLog as WorkoutLog), endTime: Date.now() };
    setLogs([completedLog, ...logs]);
    setActiveTemplate(null);
    setActiveLog(null);
    setView('history');
  };

  const handleSetUpdate = (exerciseIndex: number, setIndex: number, field: keyof SetLog, value: any) => {
    if (!activeLog) return;
    const newExercises = [...(activeLog.exercises || [])];
    newExercises[exerciseIndex].sets[setIndex] = { ...newExercises[exerciseIndex].sets[setIndex], [field]: value };
    setActiveLog({ ...activeLog, exercises: newExercises });
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    if (!activeLog || !activeTemplate) return;
    const currentExercise = activeLog.exercises![exerciseIndex];
    const currentCompleted = currentExercise.sets[setIndex].completed;
    const newCompletedState = !currentCompleted;
    handleSetUpdate(exerciseIndex, setIndex, 'completed', newCompletedState);
    if (newCompletedState && activeTemplate.exercises[exerciseIndex].type === 'reps') {
        const restTime = activeTemplate.exercises[exerciseIndex].restSeconds || 60;
        setRestTimer(restTime);
        setIsResting(true);
    }
  };

  const openTemplateEditor = (template: WorkoutTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setView('template-editor');
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;
    if (templates.some(t => t.id === editingTemplate.id)) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    } else {
        setTemplates(prev => [...prev, editingTemplate]);
    }
    setEditingTemplate(null);
    setView('templates');
  };
  
  const createNewTemplate = () => {
    const newTemp: WorkoutTemplate = { id: Date.now().toString(), name: 'New Workout', exercises: [], scheduleDays: [] };
    setEditingTemplate(newTemp);
    setView('template-editor');
  };

  // AI Handlers
  const handleGenerateAI = async (refinePrompt?: string) => {
    const promptToUse = refinePrompt || aiPrompt;
    if (!promptToUse.trim()) return;
    
    setIsGenerating(true);
    // If we have a generatedTemplate, pass it for refinement
    const routine = await generateWorkoutRoutine(promptToUse, generatedTemplate);
    setIsGenerating(false);
    
    if (routine) {
        setGeneratedTemplate(routine);
        // We stay in the 'ai-creator' view, but the UI changes to preview mode
        if (!refinePrompt) setAiPrompt(''); // Clear initial prompt on success
    } else {
        alert('Failed to generate workout. Please try again.');
    }
  };

  const approveGeneratedTemplate = () => {
      if (generatedTemplate) {
          setTemplates(prev => [...prev, generatedTemplate]);
          setGeneratedTemplate(null);
          setView('templates');
      }
  };

  const discardGeneratedTemplate = () => {
      setGeneratedTemplate(null);
  };

  // Active Workout Logic Helpers
  const handleNext = () => {
      if (!activeTemplate) return;
      setIsResting(false);
      setExpandedNotes({});
      if (activeExerciseIndex < activeTemplate.exercises.length - 1) {
        setActiveExerciseIndex(prev => prev + 1);
        setExerciseTimer(0);
        setIsTimerRunning(false);
      }
  };
  const handlePrev = () => {
      setIsResting(false);
      setExpandedNotes({});
      if (activeExerciseIndex > 0) {
        setActiveExerciseIndex(prev => prev - 1);
        setExerciseTimer(0);
        setIsTimerRunning(false);
      }
  };
  const toggleTimer = () => {
      if (activeTemplate && exerciseTimer === 0 && !isTimerRunning) {
          setExerciseTimer(activeTemplate.exercises[activeExerciseIndex].targetDurationSeconds || 60);
      }
      setIsTimerRunning(!isTimerRunning);
  };
  const resetTimer = () => {
      if(activeTemplate) {
        setIsTimerRunning(false);
        setExerciseTimer(activeTemplate.exercises[activeExerciseIndex].targetDurationSeconds || 60);
      }
  }
  const toggleNote = (key: string) => {
      setExpandedNotes(prev => ({ ...prev, [key]: !prev[key] }));
  }
  const quickFinishExercise = () => {
      if (!activeLog || !activeTemplate) return;
      const newExercises = [...(activeLog.exercises || [])];
      const currentEx = activeTemplate.exercises[activeExerciseIndex];
      newExercises[activeExerciseIndex].sets = newExercises[activeExerciseIndex].sets.map(set => ({
          ...set,
          completed: true,
          reps: set.reps || currentEx.targetReps,
          weight: set.weight || currentEx.targetWeight,
          distance: set.distance || currentEx.targetDistance,
          durationSeconds: set.durationSeconds || currentEx.targetDurationSeconds
      }));
      newExercises[activeExerciseIndex].completed = true;
      setActiveLog({ ...activeLog, exercises: newExercises });
      const restTime = currentEx.restSeconds || 60;
      setRestTimer(restTime);
      setIsResting(true);
  };

  return (
    <div className="bg-background min-h-screen text-slate-100 font-sans selection:bg-primary/30">
      {view === 'dashboard' && <DashboardView templates={templates} startWorkout={startWorkout} setView={setView} />}
      {view === 'templates' && <TemplatesView templates={templates} setTemplates={setTemplates} startWorkout={startWorkout} openTemplateEditor={openTemplateEditor} createNewTemplate={createNewTemplate} />}
      {view === 'history' && <HistoryView logs={logs} setView={setView} />}
      {view === 'active-workout' && <ActiveWorkoutView 
        activeTemplate={activeTemplate} 
        activeLog={activeLog} 
        activeExerciseIndex={activeExerciseIndex} 
        elapsedTime={elapsedTime} 
        exerciseTimer={exerciseTimer}
        isTimerRunning={isTimerRunning}
        restTimer={restTimer}
        isResting={isResting}
        expandedNotes={expandedNotes}
        handleNext={handleNext}
        handlePrev={handlePrev}
        finishWorkout={finishWorkout}
        toggleTimer={toggleTimer}
        resetTimer={resetTimer}
        setIsResting={setIsResting}
        setRestTimer={setRestTimer}
        toggleNote={toggleNote}
        handleSetUpdate={handleSetUpdate}
        toggleSetComplete={toggleSetComplete}
        quickFinishExercise={quickFinishExercise}
      />}
      {view === 'template-editor' && editingTemplate && <TemplateEditorView editingTemplate={editingTemplate} setEditingTemplate={setEditingTemplate} onSave={saveTemplate} onBack={() => setView('templates')} />}
      {view === 'stats' && <StatsView logs={logs} userProfile={userProfile} setUserProfile={setUserProfile} />}
      {view === 'ai-creator' && <AICreatorView 
        aiPrompt={aiPrompt} 
        setAiPrompt={setAiPrompt} 
        handleGenerateAI={handleGenerateAI} 
        isGenerating={isGenerating} 
        generatedTemplate={generatedTemplate}
        setGeneratedTemplate={setGeneratedTemplate}
        onApprove={approveGeneratedTemplate}
        onDiscard={discardGeneratedTemplate}
      />}
      
      {!['active-workout', 'template-editor'].includes(view) && (
        <Navigation currentView={view as ViewState} setView={(v) => { 
            // Reset generated state if leaving view
            if(view === 'ai-creator' && v !== 'ai-creator') {
                setGeneratedTemplate(null);
            }
            setView(v); 
        }} />
      )}
    </div>
  );
};

export default App;
