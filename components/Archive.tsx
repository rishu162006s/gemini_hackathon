
import React, { useState } from 'react';
import { 
  Archive, FileText, Activity, Brain, Search, 
  ChevronRight, Calendar, Stethoscope, HeartPulse, ShieldCheck,
  Clock, MapPin, X, Pill, CheckCircle, Info, MessageSquare, User, Volume2,
  ArrowRight, Download
} from 'lucide-react';
import { HealthReport, Consultation, AssessmentResult, Appointment } from '../types';
import { cleanReportText, playAudio, generateVoiceResponse, downloadAsFile } from '../services/geminiService';

interface Props {
  reports: HealthReport[];
  appointments: Appointment[];
  consultations: Consultation[];
  wellness: AssessmentResult[];
}

const HistoryVault: React.FC<Props> = ({ reports, appointments, consultations, wellness }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'appointments' | 'consults' | 'wellness'>('reports');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const filter = (items: any[]) => items.filter(i => 
    (i.filename || i.clinicName || i.problem || i.type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Archive size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">History Vault</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Complete Health Timeline</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search timeline..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border shadow-sm outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200 transition-all text-sm font-medium"
        />
      </div>

      <div className="flex bg-white p-2 rounded-2xl border shadow-sm gap-2 overflow-x-auto scrollbar-hide">
        <TabBtn active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={16} />} label="Reports" />
        <TabBtn active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} icon={<Calendar size={16} />} label="Visits" />
        <TabBtn active={activeTab === 'consults'} onClick={() => setActiveTab('consults')} icon={<Stethoscope size={16} />} label="Consults" />
        <TabBtn active={activeTab === 'wellness'} onClick={() => setActiveTab('wellness'} icon={<Brain size={16} />} label="Wellness" />
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'reports' && filter(reports).map(r => (
           <HistoryItem key={r.id} icon={<FileText />} title={r.filename} subtitle={r.specialty} date={r.date} onClick={() => setSelectedItem({ type: 'report', data: r })} />
        ))}
        {activeTab === 'appointments' && filter(appointments).map(a => (
           <HistoryItem key={a.id} icon={<Calendar />} title={a.clinicName} subtitle={a.specialty} date={a.date} color="indigo" onClick={() => setSelectedItem({ type: 'appt', data: a })} />
        ))}
        {activeTab === 'consults' && filter(consultations).map(c => (
           <HistoryItem key={c.id} icon={<Activity />} title={c.problem} subtitle={c.specialty} date={c.date} color="blue" onClick={() => setSelectedItem({ type: 'consult', data: c })} />
        ))}
        {activeTab === 'wellness' && filter(wellness).map(w => (
           <HistoryItem key={w.id} icon={<Brain />} title={w.type} subtitle={w.category} date={w.date} color="purple" onClick={() => setSelectedItem({ type: 'wellness', data: w })} />
        ))}
        
        {filter(
          activeTab === 'reports' ? reports : 
          activeTab === 'appointments' ? appointments :
          activeTab === 'consults' ? consultations : 
          wellness
        ).length === 0 && (
          <div className="py-20 text-center text-gray-400">
             <Calendar size={48} className="mx-auto opacity-10 mb-4" />
             <p className="text-sm font-medium">Archive Empty. Begin your clinical journey.</p>
          </div>
        )}
      </div>

      {selectedItem && (
        <HistoryDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
      active ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
    }`}
  >
    {icon} {label}
  </button>
);

const HistoryDetailModal = ({ item, onClose }: { item: any, onClose: () => void }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const data = item.data;

  const handleSpeak = async (text: string) => {
    if (isSpeaking) { setIsSpeaking(false); return; }
    setIsSpeaking(true);
    const audio = await generateVoiceResponse(text);
    if (audio) await playAudio(audio);
    setIsSpeaking(false);
  };

  const handleDownload = () => {
    if (data.formalReportText) {
      downloadAsFile(`MediZen_Record_${Date.now()}.txt`, data.formalReportText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative scrollbar-hide">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 z-10"><X size={24} /></button>
        
        <div className="p-10 space-y-8">
           <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
              <div className={`p-5 rounded-[2rem] text-white shadow-xl ${item.type === 'report' ? 'bg-emerald-600' : item.type === 'consult' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {item.type === 'report' ? <FileText size={32} /> : item.type === 'consult' ? <Stethoscope size={32} /> : <Brain size={32} />}
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">{item.type} Record</p>
                 <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic line-clamp-2">
                   {item.type === 'report' ? data.filename : item.type === 'consult' ? data.problem : data.type}
                 </h3>
                 <p className="text-xs font-bold text-gray-500 mt-1">{new Date(data.date).toLocaleDateString()} • {data.specialty || data.category}</p>
              </div>
           </div>

           <div className="space-y-8">
              {item.type === 'report' && data.formalReportText ? (
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-inner font-sans text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                   {data.formalReportText}
                </div>
              ) : item.type === 'report' ? (
                <>
                  <DetailSection title="Condition Summary" content={data.analysis.summary} icon={<Info />} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailSection title="Medications" items={data.analysis.medications} icon={<Pill />} />
                    <DetailSection title="Next Steps" items={data.analysis.recommendations} icon={<ArrowRight />} />
                  </div>
                </>
              ) : null}

              {item.type === 'consult' && (
                <>
                  <DetailSection title="Symptom Log" content={data.symptoms} icon={<Activity />} />
                  <DetailSection title="Diagnostic Summary" content={data.problem} icon={<Info />} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailSection title="Prescription" items={data.medicines} icon={<Pill />} />
                    <DetailSection title="Instructions" content={data.instructions} icon={<MessageSquare />} color="blue" />
                  </div>
                </>
              )}

              {item.type === 'wellness' && (
                <>
                  <DetailSection title="Clinical Analysis" content={data.aiAnalysis} icon={<Brain />} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <ScoreStat label="Depression" score={data.detailedScores?.depression} />
                     <ScoreStat label="Anxiety" score={data.detailedScores?.anxiety} />
                     <ScoreStat label="PTSD" score={data.detailedScores?.ptsd} />
                  </div>
                  <DetailSection title="Coping Strategies" items={data.strategies} icon={<HeartPulse />} color="purple" />
                </>
              )}
           </div>

           <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => handleSpeak(data.formalReportText || data.problem || data.aiAnalysis)}
                className="flex-1 py-4 bg-gray-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all"
              >
                <Volume2 size={18} /> Play Audio
              </button>
              {data.formalReportText && (
                <button onClick={handleDownload} className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-100 transition-all">
                  <Download size={18} /> Download PDF
                </button>
              )}
              <button onClick={onClose} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all">Close Vault</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const DetailSection = ({ title, content, items, icon, color = 'emerald' }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 ${colors[color].split(' ')[1]}`}>
         <div className={`p-2 rounded-xl ${colors[color]}`}>{React.cloneElement(icon, { size: 16 })}</div>
         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</h4>
      </div>
      <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
         {content && <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>}
         {items && (
           <div className="space-y-2">
             {items.map((it: string, i: number) => (
               <div key={i} className="flex items-start gap-3">
                 <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                 <p className="text-xs font-bold text-gray-600">{it}</p>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

const ScoreStat = ({ label, score }: any) => (
  <div className="bg-white p-4 rounded-2xl border flex flex-col items-center gap-1 shadow-sm">
     <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
     <span className="text-xl font-black text-indigo-600">{score ?? '--'}</span>
  </div>
);

const HistoryItem = ({ icon, title, subtitle, date, color = 'emerald', onClick }: any) => {
  const colorClasses: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-emerald-200 transition-all cursor-pointer hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">{title}</h4>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{subtitle} • {new Date(date).toLocaleDateString()}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </div>
  );
};

export default HistoryVault;
