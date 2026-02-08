import React, { useState, useRef } from 'react';
// Added Stethoscope to the lucide-react imports
import { Upload, Send, Mic, Volume2, Loader2, FileText, CheckCircle2, ChevronRight, MessageSquare, Stethoscope } from 'lucide-react';
import { UserProfile, HealthReport } from '../types';
import { analyzeHealthReport, chatWithConsultant, generateVoiceResponse, playAudio } from '../services/geminiService';

interface Props {
  user: UserProfile;
  onReportAnalyzed: (report: HealthReport) => void;
  reports: HealthReport[];
  onUpdateReport: (report: HealthReport) => void;
}

const Consultant: React.FC<Props> = ({ user, onReportAnalyzed, reports, onUpdateReport }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeHealthReport(base64, file.type);
        
        const newReport: HealthReport = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          filename: file.name,
          specialty: analysis.specialty,
          analysis,
          chatHistory: [
            // Fix: Use analysis.summary instead of analysis.condition
            { role: 'model', text: `Analysis complete. Findings suggest ${analysis.summary}. I've detected this falls under ${analysis.specialty}. How can I help you today?` }
          ]
        };
        
        onReportAnalyzed(newReport);
        setSelectedReport(newReport);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedReport) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setIsTyping(true);

    const updatedHistory = [...selectedReport.chatHistory, { role: 'user' as const, text: userMsg }];
    
    try {
      const response = await chatWithConsultant(updatedHistory, userMsg);
      const finalReport = {
        ...selectedReport,
        chatHistory: [...updatedHistory, { role: 'model' as const, text: response }]
      };
      onUpdateReport(finalReport);
      setSelectedReport(finalReport);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeech = async (text: string) => {
    try {
      const audioBase64 = await generateVoiceResponse(text);
      if (audioBase64) await playAudio(audioBase64);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">AI Clinic</h2>
        {!selectedReport && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
            Upload Report
          </button>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
      </div>

      {!selectedReport ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-gray-200 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Stethoscope size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Get Instant AI Diagnosis</h3>
            <p className="text-gray-500 max-w-xs">Upload your blood reports, scans or medical history for a detailed analysis.</p>
          </div>
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="mt-2 text-blue-600 font-semibold hover:underline"
          >
            Select a file from your device
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[70vh] bg-white rounded-3xl border shadow-sm overflow-hidden">
          {/* Analysis Header */}
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><FileText size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">{selectedReport.filename}</h4>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{selectedReport.specialty}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedReport(null)}
              className="text-xs font-semibold text-blue-600"
            >
              New Analysis
            </button>
          </div>

          {/* Chat and Analysis Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
             {/* Report Analysis Card */}
             <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 size={16} /> Key Analysis</h5>
                  {/* Fix: Use analysis.summary and analysis.recommendations */}
                  <button onClick={() => handleSpeech(selectedReport.analysis.summary + ". Next steps include " + selectedReport.analysis.recommendations.join(', '))} className="text-emerald-600 hover:text-emerald-700">
                    <Volume2 size={16} />
                  </button>
                </div>
                {/* Fix: Use analysis.summary instead of analysis.condition */}
                <p className="text-sm text-emerald-900 leading-relaxed font-medium">{selectedReport.analysis.summary}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Recommended</p>
                    <ul className="text-xs space-y-1">
                      {/* Fix: Use medications property */}
                      {selectedReport.analysis.medications.map((m, i) => <li key={i} className="flex items-center gap-1.5">• {m}</li>)}
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Next Steps</p>
                    <ul className="text-xs space-y-1">
                      {/* Fix: Use recommendations property */}
                      {selectedReport.analysis.recommendations.map((s, i) => <li key={i} className="flex items-center gap-1.5">• {s}</li>)}
                    </ul>
                  </div>
                </div>
             </div>

             {/* Chat History */}
             {selectedReport.chatHistory.map((chat, idx) => (
               <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                   chat.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                 }`}>
                   {chat.text}
                   {chat.role === 'model' && (
                     <button onClick={() => handleSpeech(chat.text)} className="block mt-2 opacity-60 hover:opacity-100">
                       <Volume2 size={14} />
                     </button>
                   )}
                 </div>
               </div>
             ))}
             {isTyping && (
               <div className="flex justify-start">
                 <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none"><Loader2 className="animate-spin text-gray-400" size={16} /></div>
               </div>
             )}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2 border focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
              <button 
                onMouseDown={() => setIsRecording(true)} 
                onMouseUp={() => setIsRecording(false)}
                className={`p-2 rounded-xl transition-colors ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-200'}`}
              >
                <Mic size={20} />
              </button>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your report..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-black"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600"
              >
                <Send size={18} />
              </button>
            </div>
            {isRecording && <p className="text-[10px] text-center text-red-500 font-bold mt-2 uppercase tracking-widest">Listening...</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultant;