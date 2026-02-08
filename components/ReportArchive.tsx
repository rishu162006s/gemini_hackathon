import React, { useState } from 'react';
import { HealthReport } from '../types';
import { Search, Filter, FileText, ChevronRight, Volume2, Calendar } from 'lucide-react';
import { generateVoiceResponse, playAudio } from '../services/geminiService';

interface Props {
  reports: HealthReport[];
}

const ReportArchive: React.FC<Props> = ({ reports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);

  const filteredReports = reports.filter(r => 
    r.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAudioSummary = async (report: HealthReport) => {
    // Fix: Use analysis.summary instead of analysis.condition
    const text = `Report summary for ${report.filename}. Specialty: ${report.specialty}. Findings: ${report.analysis.summary}.`;
    const audio = await generateVoiceResponse(text);
    if (audio) await playAudio(audio);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Records Archive</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search reports by name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredReports.map(report => (
          <div key={report.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-blue-100 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm group-hover:text-blue-600 transition-colors">{report.filename}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar size={10} /> {new Date(report.date).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    {report.specialty}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => handleAudioSummary(report)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                 <Volume2 size={20} />
               </button>
               <button onClick={() => setSelectedReport(report)} className="p-2 text-gray-400 hover:text-blue-600">
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Filter size={48} className="mx-auto opacity-20 mb-4" />
            <p>No reports found.</p>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative">
             <button onClick={() => setSelectedReport(null)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 text-xl">✕</button>
             <div className="flex items-center gap-4">
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><FileText size={32} /></div>
               <div>
                 <h3 className="text-xl font-bold">{selectedReport.filename}</h3>
                 <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">{selectedReport.specialty}</p>
               </div>
             </div>
             
             <div className="space-y-4 pt-4 border-t">
               <section>
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Findings</h4>
                 {/* Fix: Use analysis.summary instead of analysis.condition */}
                 <p className="text-sm leading-relaxed text-gray-800">{selectedReport.analysis.summary}</p>
               </section>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-50 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Medications</h4>
                    <ul className="text-xs space-y-1 text-gray-700">
                      {/* Fix: Use analysis.medications property */}
                      {selectedReport.analysis.medications.map((m, i) => <li key={i}>• {m}</li>)}
                    </ul>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Instructions</h4>
                    {/* Fix: Use analysis.fullSpeechText as instructions */}
                    <p className="text-xs text-gray-700 leading-relaxed">{selectedReport.analysis.fullSpeechText}</p>
                 </div>
               </div>
             </div>
             <button 
                onClick={() => setSelectedReport(null)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
             >
               Close View
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportArchive;