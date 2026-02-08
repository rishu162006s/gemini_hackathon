import React, { useState } from 'react';
import { Sparkles, Calendar, Utensils, Ban, AlertCircle, CheckCircle, Loader2, ClipboardList, ShieldCheck, HeartPulse, ChevronRight, AlertTriangle, Info, Zap } from 'lucide-react';
import { UserProfile, HealthReport, DailyLog, MonthlyPlan } from '../types';
import { generateMonthlyPlan } from '../services/geminiService';

interface Props {
  user: UserProfile;
  reports: HealthReport[];
  logs: DailyLog[];
}

const Planizer: React.FC<Props> = ({ user, reports, logs }) => {
  const [plan, setPlan] = useState<MonthlyPlan | null>(() => {
    const saved = localStorage.getItem('medi_current_plan');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title && parsed.dietStrategy) return parsed;
      }
    } catch(e) {}
    return null;
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const hasData = (reports && reports.length > 0) || (logs && logs.length > 0);

  const handleGeneratePlan = async () => {
    if (!hasData) return;

    setIsGenerating(true);
    try {
      const newPlan = await generateMonthlyPlan(reports, logs, user);
      if (newPlan && newPlan.title) {
        setPlan(newPlan);
        localStorage.setItem('medi_current_plan', JSON.stringify(newPlan));
      } else {
        throw new Error("Empty plan generated");
      }
    } catch (err) {
      console.error(err);
      alert("Plan generation failed. Please ensure you have clinical data logged.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
         <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-100 ring-4 ring-blue-50">
           <Sparkles size={28} />
         </div>
         <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Loko Planizer</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">30-Day Clinical Roadmap</p>
         </div>
      </div>

      {!plan && !isGenerating ? (
        <div className="bg-white rounded-[4rem] p-12 border shadow-2xl space-y-10 relative overflow-hidden group text-center">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Calendar size={200} />
           </div>
           
           <div className="space-y-6 max-w-xl mx-auto">
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                 <ClipboardList size={48} />
              </div>
              <h3 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">Your 30-Day Health Path Awaits</h3>
              
              {!hasData ? (
                <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-sm">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="text-amber-900 font-black text-sm uppercase tracking-tight">
                    Please complete at least one check-in or clinical analysis to generate a plan.
                  </p>
                  <p className="text-amber-700/60 text-[10px] font-bold uppercase tracking-widest max-w-[250px]">
                    Loko AI requires biometric data or clinical reports to formulate a safe roadmap.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Loko AI will analyze your entire clinical history—including lab reports, daily biometrics, and symptoms—to construct a personalized monthly strategy.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 py-4">
                     <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center gap-2">
                        <Utensils className="text-emerald-500" size={24} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Diet Routine</span>
                     </div>
                     <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center gap-2">
                        <Ban className="text-rose-500" size={24} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Strict Don'ts</span>
                     </div>
                  </div>

                  <button 
                    onClick={handleGeneratePlan}
                    className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.1em]"
                  >
                     Generate My Roadmap
                  </button>
                </>
              )}
           </div>
        </div>
      ) : isGenerating ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-10">
           <div className="relative">
              <div className="w-48 h-48 bg-blue-100 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={64} />
                 </div>
              </div>
           </div>
           <div className="space-y-4">
              <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Synthesizing Bio-Context...</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] max-w-xs mx-auto">Now I'll generate you a monthly plan</p>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
           {/* Plan Header */}
           <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-white/5">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-2 text-center md:text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 block mb-1">Professional Strategy</span>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">{plan?.title || 'Personalized Wellness Plan'}</h2>
                    <p className="text-blue-100/60 text-sm font-medium italic">Custom Monthly Protocol for {user.name}</p>
                 </div>
                 <button 
                  onClick={handleGeneratePlan}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3"
                 >
                   <Sparkles size={16} /> Re-Generate Plan
                 </button>
              </div>
           </div>

           {/* Diet Strategy Card */}
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-xl space-y-6 relative overflow-hidden group">
              <div className="flex items-center gap-4 text-emerald-600">
                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner"><Utensils size={28} /></div>
                 <h3 className="text-2xl font-black tracking-tight text-gray-800 uppercase italic">Diet & Nutrition Routine</h3>
              </div>
              <p className="text-lg font-medium text-gray-600 leading-relaxed border-l-4 border-emerald-500 pl-6 py-2">
                 {plan?.dietStrategy || 'Balanced nutrition focusing on whole foods and adequate hydration.'}
              </p>
           </div>

           {/* 30-Day Phases Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(plan?.phases || []).map((p, i) => (
                <div key={i} className="bg-white p-8 rounded-[3rem] border shadow-lg space-y-5 hover:border-blue-200 transition-all group">
                   <div className="flex items-center justify-between">
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-600 font-black text-xs uppercase tracking-widest">{p.phase}</div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.days}</span>
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-black text-gray-800 text-lg uppercase italic tracking-tighter">{p.focus}</h4>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Phase Objective</p>
                   </div>
                   <div className="space-y-3 pt-4 border-t border-gray-50">
                      {(p.activities || []).map((act, j) => (
                        <div key={j} className="flex gap-3 items-start">
                           <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                           <p className="text-xs font-bold text-gray-600 leading-tight">{act}</p>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>

           {/* Rules & Warnings */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Daily Dos */}
              <div className="bg-white p-10 rounded-[3.5rem] border shadow-xl space-y-8 flex flex-col">
                 <div className="flex items-center gap-4 text-indigo-600">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner"><HeartPulse size={28} /></div>
                    <h3 className="text-2xl font-black tracking-tight text-gray-800 uppercase italic">Daily Habits</h3>
                 </div>
                 <div className="space-y-4 flex-1">
                    {(plan?.doList && plan.doList.length > 0) ? plan.doList.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-white transition-all">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">{i+1}</div>
                         <p className="text-sm font-bold text-gray-700">{item}</p>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-gray-300 italic text-sm">Awaiting clinical metrics to define habits.</div>
                    )}
                 </div>
              </div>

              {/* Strict Don'ts */}
              <div className="bg-white p-10 rounded-[3.5rem] border shadow-xl space-y-8 flex flex-col">
                 <div className="flex items-center gap-4 text-rose-600">
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-inner"><Ban size={28} /></div>
                    <h3 className="text-2xl font-black tracking-tight text-gray-800 uppercase italic">Strict Don'ts</h3>
                 </div>
                 <div className="space-y-4 flex-1">
                    {(plan?.dontList && plan.dontList.length > 0) ? plan.dontList.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-rose-50/50 rounded-3xl border border-rose-100 group hover:bg-white transition-all">
                         <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-black text-xs shrink-0">!</div>
                         <p className="text-sm font-bold text-rose-900">{item}</p>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-gray-300 italic text-sm">Awaiting clinical metrics to define don'ts.</div>
                    )}
                 </div>
              </div>
           </div>

           {/* Precautions Footer */}
           <div className="p-10 bg-rose-600 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col items-center gap-8 border-4 border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-700/50 to-transparent pointer-events-none"></div>
              <div className="relative z-10 w-full flex flex-col md:flex-row items-center gap-8">
                <div className="p-6 bg-white/20 rounded-[2.5rem] backdrop-blur-xl shrink-0 shadow-lg border border-white/20">
                   <AlertCircle size={48} />
                </div>
                <div className="space-y-6 w-full">
                   <div className="flex items-center justify-between">
                     <h4 className="text-2xl font-black tracking-tighter uppercase italic">Red Flag Precautions</h4>
                     <div className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Clinical Alerts</div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(plan?.precautions && plan.precautions.length > 0) ? plan.precautions.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group">
                           <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white] shrink-0"></div>
                           <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{p}</p>
                        </div>
                      )) : (
                        <div className="col-span-full py-6 text-center text-white/40 italic text-sm">No red flag markers identified yet.</div>
                      )}
                   </div>
                </div>
              </div>
           </div>

           <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6">
              <ShieldCheck className="text-indigo-600 shrink-0" size={32} />
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Medical Disclaimer</p>
                 <p className="text-xs font-bold text-indigo-900/60 leading-relaxed italic">
                    This 30-day plan is synthesized by MediZen Loko Intelligence using your cumulative medical history and current biometrics (BP: {user.bloodPressure}). It is a clinical guide intended for wellness optimization. Always consult your primary physician before starting any new regime.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Planizer;