import React, { useState } from 'react';
import { UserProfile, DailyLog } from '../types';
import { CheckCircle2, Trophy, Flame, ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  onCheckIn: (log: DailyLog, points: number) => void;
}

const DailyCheckIn: React.FC<Props> = ({ user, onCheckIn }) => {
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = user.lastCheckIn === today;

  const [formData, setFormData] = useState<DailyLog>({
    date: today,
    bloodPressure: user.bloodPressure,
    bloodSugar: user.bloodSugar,
    stressLevel: user.stressLevel,
    hemoglobin: user.hemoglobin,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckIn(formData, 10);
  };

  if (hasCheckedInToday) {
    return (
      <div className="space-y-6 flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold">You're All Set!</h2>
        <p className="text-gray-500 max-w-xs">You've completed your daily health check-in. Come back tomorrow to keep your {user.streak} day streak alive!</p>
        <div className="bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100 mt-6 flex gap-8">
           <div className="text-center">
             <p className="text-xs font-bold text-emerald-600 uppercase">Points Gained</p>
             <p className="text-xl font-bold text-emerald-800">+10 ✨</p>
           </div>
           <div className="text-center">
             <p className="text-xs font-bold text-emerald-600 uppercase">New Streak</p>
             <p className="text-xl font-bold text-emerald-800">{user.streak} Days 🔥</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Daily Log</h2>
        <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-bold border border-orange-100">
           <Flame size={16} /> Streak: {user.streak}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <div className="flex items-start gap-4 mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <Trophy className="text-blue-600 mt-1" size={24} />
          <div>
            <h4 className="font-bold text-blue-900">Medi Rewards</h4>
            <p className="text-sm text-blue-700">Complete this log to earn 10 Medi Points and maintain your streak!</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CheckInInput label="Blood Pressure" value={formData.bloodPressure} onChange={v => setFormData({...formData, bloodPressure: v})} placeholder="120/80" />
            <CheckInInput label="Blood Sugar" type="number" value={formData.bloodSugar} onChange={v => setFormData({...formData, bloodSugar: Number(v)})} placeholder="90" suffix="mg/dL" />
            <CheckInInput label="Stress Level (1-10)" type="range" min="1" max="10" value={formData.stressLevel} onChange={v => setFormData({...formData, stressLevel: Number(v)})} />
            <CheckInInput label="Hemoglobin" type="number" step="0.1" value={formData.hemoglobin} onChange={v => setFormData({...formData, hemoglobin: Number(v)})} placeholder="14.5" suffix="g/dL" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase">Optional Notes</label>
            <textarea 
               className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none h-24 text-sm text-black"
               placeholder="How are you feeling today?"
               value={formData.notes}
               onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Complete Check-in
          </button>
        </form>
      </div>
    </div>
  );
};

const CheckInInput = ({ label, value, onChange, type = 'text', placeholder, suffix, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase flex justify-between items-center">
      {label}
      {type === 'range' && <span className="text-blue-600">{value}</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm text-black"
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">{suffix}</span>}
    </div>
  </div>
);

export default DailyCheckIn;