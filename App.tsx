
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, User, Stethoscope, Archive, BrainCircuit, 
  CalendarRange, Activity, MapPin, Sparkles, AlertCircle, Key, Pill, Menu, X
} from 'lucide-react';
import { UserProfile, HealthReport, DailyLog, AssessmentResult, Consultation, Appointment } from './types';
import { INITIAL_USER } from './constants';
import Dashboard from './components/Dashboard';
import ProfileView from './components/ProfileView';
import Clinic from './components/Clinic';
import DocMate from './components/DocMate';
import HistoryVault from './components/Archive';
import DailyCheckIn from './components/DailyCheckIn';
import WellnessAssessments from './components/WellnessAssessments';
import UnixChatbot from './components/UnixChatbot';
import Planizer from './components/Planizer';
import Medico from './components/Medico';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasQuotaError, setHasQuotaError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // State Initialization
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);

  // 1. Initial Load - Runs ONLY ONCE
  useEffect(() => {
    const loadData = () => {
      try {
        const savedUser = localStorage.getItem('medi_user_v2');
        const savedReports = localStorage.getItem('medi_reports');
        const savedAppts = localStorage.getItem('medi_appointments');
        const savedConsults = localStorage.getItem('medi_consults');
        const savedLogs = localStorage.getItem('medi_logs');
        const savedAssessments = localStorage.getItem('medi_assessments');

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedReports) setReports(JSON.parse(savedReports));
        if (savedAppts) setAppointments(JSON.parse(savedAppts));
        if (savedConsults) setConsultations(JSON.parse(savedConsults));
        if (savedLogs) setDailyLogs(JSON.parse(savedLogs));
        if (savedAssessments) setAssessments(JSON.parse(savedAssessments));
        
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Critical: Failed to load storage", err);
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // 2. Continuous Save - Runs only after initial load is confirmed
  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('medi_user_v2', JSON.stringify(user));
    localStorage.setItem('medi_reports', JSON.stringify(reports));
    localStorage.setItem('medi_appointments', JSON.stringify(appointments));
    localStorage.setItem('medi_consults', JSON.stringify(consultations));
    localStorage.setItem('medi_logs', JSON.stringify(dailyLogs));
    localStorage.setItem('medi_assessments', JSON.stringify(assessments));
  }, [user, reports, appointments, consultations, dailyLogs, assessments, isDataLoaded]);

  useEffect(() => {
    const handleError = (e: any) => { if (e.reason?.message === "QUOTA_EXCEEDED") setHasQuotaError(true); };
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...updates }));
  
  const updateReport = (updatedReport: HealthReport) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'profile', icon: User, label: 'Persona' },
    { id: 'clinic', icon: Stethoscope, label: 'Clinic' },
    { id: 'medico', icon: Pill, label: 'Pharmacy' },
    { id: 'docmate', icon: MapPin, label: 'Providers' },
    { id: 'planizer', icon: Sparkles, label: 'Protocol' },
    { id: 'wellness', icon: BrainCircuit, label: 'Cognitive' },
    { id: 'vault', icon: Archive, label: 'Archive' },
    { id: 'daily', icon: CalendarRange, label: 'Logging' },
  ];

  if (!isDataLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Activity className="animate-pulse text-blue-500" size={64} />
        <p className="text-xs font-black uppercase tracking-[0.4em]">Initializing Clinical Core...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Activity className="text-blue-500 w-6 h-6" />
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">MediZen<span className="text-blue-500">HQ</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>Points</span>
            <span className="text-blue-400">{user.mediPoints}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full" style={{ width: `${(user.mediPoints % 1000) / 10}%` }} />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4 lg:hidden">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <Menu size={20} />
             </button>
             <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">MediZen</h1>
          </div>
          <div className="hidden lg:block text-xs font-bold text-slate-400 uppercase tracking-widest">
            Diagnostic Dashboard / {activeTab}
          </div>
          <div className="flex items-center gap-4">
             {hasQuotaError && (
               <button onClick={() => window.aistudio?.openSelectKey?.()} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-md text-[10px] font-bold border border-rose-100 uppercase animate-pulse">
                 <Key size={14} /> Replace Key
               </button>
             )}
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border text-xs font-bold text-slate-600">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Clinical System Online
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-7xl w-full mx-auto scrollbar-hide">
          {activeTab === 'dashboard' && <Dashboard user={user} dailyLogs={dailyLogs} assessments={assessments} />}
          {activeTab === 'profile' && <ProfileView user={user} onUpdate={updateUser} latestReport={reports[0]} />}
          {activeTab === 'clinic' && (
            <Clinic 
              user={user} 
              onConsultationComplete={(c, d) => { 
                setConsultations(prev => [c, ...prev]); 
                if(d) {
                  const newReport: HealthReport = {
                    id: 'rep_' + Date.now(),
                    date: c.date,
                    filename: d.filename,
                    specialty: c.specialty,
                    analysis: d.analysis,
                    chatHistory: []
                  };
                  setReports(prev => [newReport, ...prev]);
                }
                updateUser({ mediPoints: user.mediPoints + 50 }); 
              }} 
              onReportUpdate={updateReport}
              onBookAppointment={a => setAppointments(p => [a, ...p])} 
            />
          )}
          {activeTab === 'medico' && <Medico />}
          {activeTab === 'docmate' && <DocMate user={user} latestReport={reports[0]} onBookAppointment={a => setAppointments(p => [a, ...p])} />}
          {activeTab === 'planizer' && <Planizer user={user} reports={reports} logs={dailyLogs} />}
          {activeTab === 'vault' && <HistoryVault reports={reports} appointments={appointments} consultations={consultations} wellness={assessments} />}
          {activeTab === 'daily' && <DailyCheckIn user={user} onCheckIn={(log, pts) => { setDailyLogs(p => [log, ...p]); updateUser({ mediPoints: user.mediPoints + pts, lastCheckIn: new Date().toISOString().split('T')[0], streak: user.streak + 1, maxStreak: Math.max(user.maxStreak, user.streak + 1) }); }} />}
          {activeTab === 'wellness' && <WellnessAssessments user={user} onSave={res => setAssessments(p => [res, ...p])} />}
        </main>
      </div>

      <UnixChatbot />

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-2 z-50">
        {navItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 p-2 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}>
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-200">
           <aside className="w-64 bg-slate-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
             <div className="p-6 flex items-center justify-between border-b border-slate-800">
               <div className="flex items-center gap-2"><Activity className="text-blue-500 w-5 h-5" /><span className="text-white font-black text-sm uppercase">MediZen</span></div>
               <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-1"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-1">
               {navItems.map(item => (
                 <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                   <item.icon size={18} /> {item.label}
                 </button>
               ))}
             </div>
           </aside>
        </div>
      )}
    </div>
  );
};

export default App;
