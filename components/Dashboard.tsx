
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile, DailyLog, AssessmentResult } from '../types';
import { Heart, Activity, Droplets, Zap, Sparkles, TrendingUp, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { getHealthForecast } from '../services/geminiService';

interface Props {
  user: UserProfile;
  dailyLogs: DailyLog[];
  assessments: AssessmentResult[];
}

const Dashboard: React.FC<Props> = ({ user, dailyLogs, assessments }) => {
  const [metric, setMetric] = useState<'bloodSugar' | 'stressLevel' | 'hemoglobin'>('bloodSugar');
  const [forecast, setForecast] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  useEffect(() => {
    if (dailyLogs.length >= 3) {
      handleForecast();
    }
  }, [dailyLogs]);

  const handleForecast = async () => {
    setIsForecasting(true);
    try {
      const res = await getHealthForecast(dailyLogs, user);
      setForecast(res);
    } catch (e) { console.error(e); }
    setIsForecasting(false);
  };

  const chartData = [...dailyLogs].reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    bloodSugar: log.bloodSugar,
    stressLevel: log.stressLevel * 10,
    hemoglobin: log.hemoglobin * 5,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Overview</h2>
           <p className="text-sm text-slate-500 font-medium">Monitoring biometric stability for {user.name}</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Synced
           </div>
           <div className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-600 shadow-sm">
             Session ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}
           </div>
        </div>
      </div>

      {/* Vital Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <VitalCard icon={<Heart size={20} className="text-rose-600" />} label="Blood Pressure" value={user.bloodPressure} status="Optimal" />
        <VitalCard icon={<Droplets size={20} className="text-blue-600" />} label="Glucose" value={`${user.bloodSugar} mg/dL`} status="Steady" />
        <VitalCard icon={<Zap size={20} className="text-amber-600" />} label="Cortisol Index" value={`${user.stressLevel}/10`} status="Modulated" />
        <VitalCard icon={<Activity size={20} className="text-emerald-600" />} label="Hemoglobin" value={`${user.hemoglobin} g/dL`} status="Normal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Biometric Trends</h3>
                 <p className="text-xs font-medium text-slate-500 mt-1">7-Day Analysis Profile</p>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-lg border">
                {(['bloodSugar', 'stressLevel', 'hemoglobin'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                      metric === m ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {m === 'bloodSugar' ? 'Glucose' : m === 'stressLevel' ? 'Cortisol' : 'Hgb'}
                  </button>
                ))}
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} dy={10} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Area type="monotone" dataKey={metric} stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#metricGradient)" dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50 rounded-lg">Insufficient logging data</div>
              )}
           </div>
        </div>

        {/* Forecast Sidebar */}
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl flex flex-col justify-between border border-slate-800">
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-400" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Logic Engine</h3>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              </div>

              {isForecasting ? (
                <div className="space-y-3 py-10 animate-pulse">
                   <div className="h-4 bg-slate-800 rounded-full w-3/4"></div>
                   <div className="h-4 bg-slate-800 rounded-full w-1/2"></div>
                   <div className="h-4 bg-slate-800 rounded-full w-5/6"></div>
                </div>
              ) : forecast ? (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Intelligence Forecast</p>
                      <p className="text-sm font-medium leading-relaxed text-slate-300">
                        {forecast.prediction}
                      </p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recommended Actions</p>
                      <div className="space-y-2">
                         {forecast.actions.slice(0, 3).map((a: string, i: number) => (
                           <div key={i} className="flex items-center gap-3 text-xs font-medium text-slate-200 bg-white/5 p-3 rounded-lg border border-white/5">
                             <ShieldCheck size={14} className="text-emerald-500" /> {a}
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                   <Activity size={32} className="mx-auto text-slate-700" />
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Log 3 days of data for MZ-1 Forecast</p>
                </div>
              )}
           </div>

           <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Level</p>
                 <p className={`text-xl font-black ${forecast?.riskLevel === 'Low' ? 'text-emerald-400' : 'text-blue-400'}`}>{forecast?.riskLevel || 'N/A'}</p>
              </div>
              <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                 <ChevronRight size={20} className="text-slate-400" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const VitalCard = ({ icon, label, value, status }: { icon: React.ReactNode, label: string, value: string, status: string }) => (
  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
    <div className="flex items-center justify-between">
       <div className="p-2.5 bg-slate-50 rounded-lg border">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{status}</span>
    </div>
    <div>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
       <p className="text-lg font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Dashboard;
