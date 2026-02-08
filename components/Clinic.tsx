
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Stethoscope, Activity, HeartPulse, Pill, Mic, Phone, 
  X, Loader2, Volume2, Info, ShieldCheck, Thermometer, Calendar, VolumeX,
  ExternalLink, MapPin, Search as SearchIcon, Sparkles, Clock, ChevronDown, CheckCircle, ClipboardList, Download
} from 'lucide-react';
import { UserProfile, Consultation, Appointment, HealthReport } from '../types';
import { getAdvancedDiagnosis, playAudio, decodePCM, decodeAudioData, encodePCM, generateVoiceResponse, stopAllAudio, generateFormalDoctorReport, cleanReportText, downloadAsFile } from '../services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";

interface Props {
  user: UserProfile;
  onConsultationComplete: (c: Consultation, reportData?: any) => void;
  onReportUpdate?: (report: HealthReport) => void;
  onBookAppointment: (appt: Appointment) => void;
}

const Clinic: React.FC<Props> = ({ user, onConsultationComplete, onReportUpdate, onBookAppointment }) => {
  const [mode, setMode] = useState<'symptoms' | 'report'>('symptoms');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [formalReport, setFormalReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('1 day');
  const [specialty, setSpecialty] = useState('Auto-Detect');
  const [selectedFile, setSelectedFile] = useState<{data: string, type: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCalling, setIsCalling] = useState(false);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopAllAudio();
      stopCall();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        data: (reader.result as string).split(',')[1],
        type: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateReport = async () => {
    if (!diagnosis) return;
    setIsGeneratingReport(true);
    try {
      const reportText = await generateFormalDoctorReport(diagnosis, user);
      const cleanedText = cleanReportText(reportText);
      setFormalReport(cleanedText);
      
      // Update the saved report in history with the formal text
      if (currentReportId && onReportUpdate) {
        const updatedReport: HealthReport = {
          id: currentReportId,
          date: new Date().toISOString(),
          filename: selectedFile?.name || 'Clinical Checkup',
          specialty: diagnosis.specialty || 'General',
          formalReportText: cleanedText,
          analysis: diagnosis,
          chatHistory: []
        };
        onReportUpdate(updatedReport);
      }
    } catch (err) {
      console.error(err);
      alert("Report generation failed.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (formalReport) {
      downloadAsFile(`MediZen_Clinical_Report_${Date.now()}.txt`, formalReport);
    }
  };

  const handleListenToggle = async () => {
    if (isSpeaking || isGeneratingAudio) {
      stopAllAudio();
      setIsSpeaking(false);
      setIsGeneratingAudio(false);
      return;
    }

    if (!diagnosis) return;
    setIsGeneratingAudio(true);
    try {
      stopAllAudio();
      const base64 = await generateVoiceResponse(diagnosis.fullSpeechText || diagnosis.summary);
      setIsGeneratingAudio(false);
      
      if (base64) {
        setIsSpeaking(true);
        await playAudio(base64);
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("Audio generation failed:", err);
      setIsGeneratingAudio(false);
      setIsSpeaking(false);
    }
  };

  const handleDiagnose = async () => {
    setIsAnalyzing(true);
    setDiagnosis(null);
    setFormalReport(null);
    const newId = 'rep_' + Date.now();
    setCurrentReportId(newId);
    
    try {
      const result = await getAdvancedDiagnosis({
        mode,
        imageData: selectedFile?.data,
        mimeType: selectedFile?.type,
        symptoms,
        duration,
        specialtyPreference: specialty === 'Auto-Detect' ? undefined : specialty,
        user 
      });

      setDiagnosis(result);

      // AUTOMATICALLY SAVE TO VAULT
      onConsultationComplete({
        id: 'cons_' + Date.now(),
        date: new Date().toISOString(),
        mode,
        symptoms: symptoms,
        duration: duration,
        specialty: result.specialty || 'General',
        problem: result.summary,
        instructions: result.fullSpeechText || '',
        medicines: result.medications || [],
        isCleanHealth: false
      }, {
        filename: selectedFile?.name || 'Clinical Checkup',
        analysis: result
      });

    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startVoiceCall = async () => {
    if (!diagnosis) return;
    setIsCalling(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      if (outCtx.state === 'suspended') await outCtx.resume();
      if (inCtx.state === 'suspended') await inCtx.resume();

      audioContextRef.current = outCtx;
      inputContextRef.current = inCtx;
      nextStartTimeRef.current = 0;
      activeSourcesRef.current.clear();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are Dr. Rishu, a world-class Medical Doctor. A diagnostic analysis has just been performed: ${diagnosis.fullSpeechText}. Speak to your patient professionally and warmly.`
        },
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { 
                    data: encodePCM(new Uint8Array(int16.buffer)), 
                    mimeType: 'audio/pcm;rate=16000' 
                  } 
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (msg) => {
            const audioStr = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioStr) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decodePCM(audioStr), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => activeSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
            }
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setIsCalling(false);
    }
  };

  const stopCall = () => {
    activeSourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    activeSourcesRef.current.clear();
    
    const outCtx = audioContextRef.current;
    if (outCtx) {
      audioContextRef.current = null;
      if (outCtx.state !== 'closed') {
        try { outCtx.close().catch(() => {}); } catch (e) {}
      }
    }

    const inCtx = inputContextRef.current;
    if (inCtx) {
      inputContextRef.current = null;
      if (inCtx.state !== 'closed') {
        try { inCtx.close().catch(() => {}); } catch (e) {}
      }
    }

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch (e) {}
      });
    }
    
    setIsCalling(false);
    sessionPromiseRef.current = null;
    nextStartTimeRef.current = 0;
  };

  if (isCalling) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-[999] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
         <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none" />
         <div className="relative z-10 flex flex-col items-center gap-12 text-center max-w-xl">
            <div className="relative">
               <div className="w-56 h-56 bg-white/5 rounded-full border-4 border-blue-400/20 backdrop-blur-xl flex items-center justify-center shadow-2xl relative">
                  <Activity size={80} className="text-blue-400 animate-pulse" />
               </div>
            </div>
            <div className="space-y-6 text-white">
               <h2 className="text-4xl font-black tracking-tighter uppercase italic">You are right now talking to Dr Rishu</h2>
            </div>
            <button onClick={stopCall} className="px-12 py-5 bg-rose-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl">End Session</button>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between no-print">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"><Stethoscope size={28} /></div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Doctor Rishu's Clinic</h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">AI-Driven Clinical Decision Support</p>
            </div>
         </div>
         {diagnosis && (
           <button onClick={() => { setDiagnosis(null); setSelectedFile(null); setSymptoms(''); setFormalReport(null); setCurrentReportId(null); }} className="p-3 bg-white text-indigo-600 rounded-2xl border-2 border-indigo-50">
             <ClipboardList size={18} /> <span className="text-xs font-black uppercase tracking-widest">Restart Checkup</span>
           </button>
         )}
      </div>

      {!diagnosis && !isAnalyzing ? (
        <div className="bg-white rounded-[3.5rem] p-10 border shadow-2xl space-y-10 animate-in fade-in zoom-in duration-500 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <ClipboardList size={200} />
           </div>
           
           <div className="flex bg-gray-100 p-2 rounded-[2rem] border gap-2 shadow-inner">
             <button onClick={() => setMode('symptoms')} className={`flex-1 py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all ${mode === 'symptoms' ? 'bg-white text-indigo-600 shadow-lg scale-[1.02]' : 'text-gray-400'}`}><Thermometer size={20} /> Symptom Check</button>
             <button onClick={() => setMode('report')} className={`flex-1 py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all ${mode === 'report' ? 'bg-white text-indigo-600 shadow-lg scale-[1.02]' : 'text-gray-400'}`}><FileText size={20} /> Lab Vision</button>
           </div>

           <div className="space-y-8">
             {mode === 'symptoms' ? (
               <div className="space-y-6">
                 <textarea placeholder="Describe your symptoms professionally (e.g., location, severity, duration)..." value={symptoms} onChange={e => setSymptoms(e.target.value)} className="w-full p-7 bg-gray-50 rounded-[2.5rem] outline-none text-base font-bold text-black resize-none h-40 shadow-inner" />
               </div>
             ) : (
               <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-indigo-100 bg-indigo-50/20 rounded-[3rem] p-16 flex flex-col items-center gap-6 cursor-pointer text-center relative z-10">
                 <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-600">{selectedFile ? <CheckCircle size={48} className="text-emerald-500" /> : <Upload size={48} />}</div>
                 <h4 className="font-black text-gray-800 text-xl">{selectedFile ? selectedFile.name : 'Upload Medical Report'}</h4>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
               </div>
             )}
           </div>
           <button onClick={handleDiagnose} disabled={isAnalyzing || (mode === 'symptoms' && !symptoms) || (mode === 'report' && !selectedFile)} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl uppercase tracking-[0.1em]">
              Deep Clinical Diagnosis
           </button>
        </div>
      ) : isAnalyzing ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-10">
           <Loader2 className="animate-spin text-indigo-600" size={64} />
           <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Dr Rishu will explain you things shortly</h3>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
           <div className="p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden bg-[#1e293b] border-4 border-white/5 no-print">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Doctor Rishu's Synthesis</h2>
                <div className="flex items-center gap-3">
                   <button onClick={handleListenToggle} className={`p-5 rounded-3xl transition-all border-2 shadow-2xl flex items-center gap-3 ${(isSpeaking || isGeneratingAudio) ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white text-gray-900 border-white'}`}>
                     {isGeneratingAudio ? <Loader2 size={24} className="animate-spin" /> : isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
                     <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Play Doctor Summary</span>
                   </button>
                   <button onClick={startVoiceCall} className="p-5 bg-blue-600 border-2 border-blue-400 text-white rounded-3xl shadow-2xl flex items-center gap-3">
                      <Phone size={24} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Interactive Session</span>
                   </button>
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6 no-print">
              <ResultBox icon={<Activity />} title="Clinical Summary" content={diagnosis?.summary} color="indigo" />
              <ResultBox icon={<HeartPulse />} title="Recommendations" items={diagnosis?.recommendations} color="emerald" />
              <ResultBox icon={<Pill />} title="Medications" items={diagnosis?.medications} color="rose" />
           </div>

           <div className="pt-8">
              {!formalReport ? (
                <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="w-full py-7 bg-gray-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl transition-all no-print">
                  {isGeneratingReport ? <Loader2 className="animate-spin" /> : <FileText />}
                  Generate Full Clinical Report (Dr. Rishu Form)
                </button>
              ) : (
                <div className="bg-white p-12 rounded-[3.5rem] border-4 border-gray-900 shadow-2xl animate-in zoom-in duration-500 print-container">
                   <div className="flex items-center justify-between border-b-2 border-gray-100 pb-6 mb-8">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black text-gray-900 italic font-sans tracking-tighter uppercase">Clinical Consultation Report</h3>
                         <p className="text-[10px] font-black text-indigo-600 font-sans uppercase tracking-widest">Verified by Loko Intelligence Engine</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-gray-400">DATE: {new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="prose prose-slate max-w-none text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {formalReport}
                   </div>
                   <div className="mt-12 pt-8 border-t-2 border-gray-100 flex items-center justify-between no-print">
                      <div className="flex gap-4">
                         <button onClick={handleDownloadReport} className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 hover:underline">
                            <Download size={14} /> Download File
                         </button>
                         <button onClick={() => window.print()} className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 hover:underline">
                            <FileText size={14} /> Print to PDF
                         </button>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const ResultBox = ({ icon, title, content, items, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border shadow-xl space-y-6">
       <div className={`flex items-center gap-4 ${colors[color].split(' ')[1]}`}>
          <div className={`p-4 rounded-2xl border shadow-inner ${colors[color]}`}>{icon}</div>
          <h3 className="text-2xl font-black tracking-tight text-gray-800 uppercase italic">{title}</h3>
       </div>
       {content && <p className="text-lg font-medium text-gray-600 leading-relaxed border-l-4 pl-6 py-2">{content}</p>}
       {items && Array.isArray(items) && items.length > 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {items.map((item: string, i: number) => (
             <div key={i} className="flex gap-4 items-center p-5 bg-gray-50 rounded-3xl border border-gray-100">
               <CheckCircle size={20} className={colors[color].split(' ')[1]} />
               <p className="text-sm font-bold text-gray-700">{item}</p>
             </div>
           ))}
         </div>
       )}
    </div>
  );
};

export default Clinic;
