
import React, { useState, useEffect } from 'react';
import { AssessmentResult, UserProfile } from '../types';
import { 
  Brain, ShieldCheck, Sparkles, CheckCircle2, Volume2, Info, 
  ChevronLeft, Wind, CloudRain, Zap, AlertTriangle, ChevronRight, Loader2, VolumeX,
  Dna, Fingerprint, Activity, FileText, Download, Stethoscope
} from 'lucide-react';
import { analyzeWellnessScores, playAudio, generateVoiceResponse, stopAllAudio, generateFormalDoctorReport, cleanReportText, downloadAsFile } from '../services/geminiService';

const ALL_QUESTIONS = [
  // PHQ-9 (Depression)
  { section: 'Cognitive Health', text: "Little interest or pleasure in doing things?", type: 'PHQ9' },
  { section: 'Cognitive Health', text: "Feeling down, depressed, or hopeless?", type: 'PHQ9' },
  { section: 'Rest Cycles', text: "Trouble falling or staying asleep, or sleeping too much?", type: 'PHQ9' },
  { section: 'Rest Cycles', text: "Feeling tired or having little energy?", type: 'PHQ9' },
  { section: 'Metabolic Signals', text: "Poor appetite or overeating?", type: 'PHQ9' },
  { section: 'Self-Perception', text: "Feeling bad about yourself — or that you are a failure?", type: 'PHQ9' },
  { section: 'Neural Focus', text: "Trouble concentrating on things, such as reading the newspaper?", type: 'PHQ9' },
  { section: 'Motor Stability', text: "Moving or speaking so slowly that other people could have noticed?", type: 'PHQ9' },
  { section: 'Vital Safety', text: "Thoughts that you would be better off dead, or of hurting yourself?", type: 'PHQ9' },
  
  // GAD-7 (Anxiety)
  { section: 'Amygdala Response', text: "Feeling nervous, anxious, or on edge?", type: 'GAD7' },
  { section: 'Amygdala Response', text: "Not being able to stop or control worrying?", type: 'GAD7' },
  { section: 'Neural Feedback', text: "Worrying too much about different things?", type: 'GAD7' },
  { section: 'Neural Feedback', text: "Trouble relaxing?", type: 'GAD7' },
  { section: 'Somatic Output', text: "Being so restless that it is hard to sit still?", type: 'GAD7' },
  { section: 'Threshold Status', text: "Becoming easily annoyed or irritable?", type: 'GAD7' },
  { section: 'Anticipatory State', text: "Feeling afraid, as if something awful might happen?", type: 'GAD7' },

  // PC-PTSD-5 (PTSD)
  { section: 'Memory Index', text: "Have you had nightmares about a stressful experience?", type: 'PCPTSD5' },
  { section: 'Memory Index', text: "Tried hard not to think about a stressful experience?", type: 'PCPTSD5' },
  { section: 'Arousal Modulation', text: "Been constantly on guard, watchful, or easily startled?", type: 'PCPTSD5' },
  { section: 'Social Integration', text: "Felt numb or detached from people, activities, or your surroundings?", type: 'PCPTSD5' },
  { section: 'Cognitive Bias', text: "Felt guilty or unable to stop blaming yourself for a stressful experience?", type: 'PCPTSD5' },
];

const OPTIONS = [
  { label: "Not at all", value: 0, hint: "Baseline" },
  { label: "Several days", value: 1, hint: "Intermittent" },
  { label: "More than half", value: 2, hint: "Frequent" },
  { label: "Nearly every day", value: 3, hint: "Persistent" }
];

interface Props {
  user: UserProfile;
  onSave: (result: AssessmentResult) => void;
}

const WellnessAssessments: React.FC<Props> = ({ user, onSave }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(ALL_QUESTIONS.length).fill(-1));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formalReport, setFormalReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const progress = ((currentStep + 1) / ALL_QUESTIONS.length) * 100;

  const handleSelect = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
    
    if (currentStep < ALL_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    setIsGeneratingReport(true);
    try {
      const report = await generateFormalDoctorReport(result, user);
      setFormalReport(cleanReportText(report));
    } catch (err) {
      console.error(err);
      alert("Report generation failed.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (formalReport) {
      downloadAsFile(`MediZen_Wellness_Report_${Date.now()}.txt`, formalReport);
    }
  };

  const handleListenToggle = async () => {
    if (isSpeaking || isGeneratingAudio) {
      stopAllAudio();
      setIsSpeaking(false);
      setIsGeneratingAudio(false);
      return;
    }

    if (!result?.summary) return;
    
    setIsGeneratingAudio(true);
    try {
      stopAllAudio();
      const base64 = await generateVoiceResponse(result.summary);
      setIsGeneratingAudio(false);
      
      if (base64) {
        setIsSpeaking(true);
        await playAudio(base64);
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error(err);
      setIsGeneratingAudio(false);
      setIsSpeaking(false);
    }
  };

  const calculateFinalResults = async () => {
    setIsAnalyzing(true);
    const phq9 = answers.slice(0, 9).reduce((a, b) => a + b, 0);
    const gad7 = answers.slice(9, 16).reduce((a, b) => a + b, 0);
    const ptsd = answers.slice(16, 21).filter(v => v >= 2).length;

    try {
      const aiResponse = await analyzeWellnessScores({ depression: phq9, anxiety: gad7, ptsd: ptsd }, user);
      setResult(aiResponse);
      
      onSave({
        id: 'well_' + Date.now(),
        type: 'ULTIMATE_CHECK',
        date: new Date().toISOString(),
        score: phq9 + gad7 + ptsd,
        category: aiResponse.category || 'Normal',
        strategies: aiResponse.recommendations || [],
        aiAnalysis: aiResponse.summary,
        detailedScores: { depression: phq9, anxiety: gad7, ptsd: ptsd }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 pb-20">
         <div className={`p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden ${
           result.category === 'Normal' ? 'bg-[#0f172a]' : 
           result.category === 'Medium Risk' ? 'bg-[#312e81]' : 
           'bg-[#450a0a]'
         }`}>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
           
           <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10 shadow-lg"><Activity size={32} className="text-blue-400" /></div>
                <div className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Clinical Bio-Analysis Complete</div>
              </div>
              
              <div className="space-y-2">
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Diagnostic Synthesis</h2>
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] opacity-80">Processed via Loko Intelligence Engine</p>
              </div>

              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                 <p className="text-lg font-medium text-white/95 leading-relaxed italic">"{result.summary || 'Clinical summary pending.'}"</p>
              </div>
              
              <button 
                onClick={handleListenToggle}
                className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] transition-all border-2 font-black uppercase tracking-widest text-[11px] shadow-2xl ${
                  (isSpeaking || isGeneratingAudio) 
                  ? 'bg-rose-500 border-rose-400 text-white animate-pulse' 
                  : 'bg-white text-gray-900 border-white hover:bg-gray-100'
                }`}
              >
                {isGeneratingAudio ? <Loader2 size={18} className="animate-spin" /> : 
                 isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                {isGeneratingAudio ? 'Synthesizing Voice...' : (isSpeaking ? 'Interrupt Audio' : 'Play Audio Analysis')}
              </button>
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard title="Serotonin Index" content={result.findings?.depression || 'Normal range.'} icon={<CloudRain className="text-blue-500" />} />
            <ResultCard title="Cortisol Flux" content={result.findings?.anxiety || 'Stable flux.'} icon={<Wind className="text-purple-500" />} />
            <ResultCard title="Amygdala Marker" content={result.findings?.ptsd || 'No markers detected.'} icon={<Zap className="text-amber-500" />} />
         </div>

         <div className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><CheckCircle2 size={24} /></div>
               <h3 className="font-black text-sm uppercase tracking-[0.2em] text-gray-800">Actionable Remediation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(result.recommendations || []).map((rec: string, i: number) => (
                 <div key={i} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-start gap-5 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 font-black shrink-0 group-hover:scale-110 transition-transform">{i+1}</div>
                    <p className="text-sm font-bold text-gray-700 leading-snug pt-2">{rec}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="pt-4">
            {!formalReport ? (
              <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full py-6 bg-gray-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl no-print"
              >
                {isGeneratingReport ? <Loader2 className="animate-spin" /> : <FileText />}
                Generate Official Wellness Report (Dr. Rishu Form)
              </button>
            ) : (
              <div className="bg-white p-12 rounded-[3.5rem] border-4 border-gray-900 shadow-2xl animate-in zoom-in duration-500 font-serif relative overflow-hidden print-container">
                 <div className="absolute top-0 right-0 p-8 opacity-5 no-print"><Stethoscope size={100} /></div>
                 <div className="flex items-center justify-between border-b-2 border-gray-100 pb-6 mb-8">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-gray-900 italic font-sans tracking-tighter uppercase">Wellness Assessment Report</h3>
                       <p className="text-[10px] font-black text-indigo-600 font-sans uppercase tracking-widest">Psychological Baseline Audit</p>
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

         <button 
          onClick={() => { setResult(null); setIsStarted(false); setAnswers(new Array(ALL_QUESTIONS.length).fill(-1)); setCurrentStep(0); setFormalReport(null); }}
          className="w-full py-6 bg-gray-100 text-gray-400 rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all no-print"
         >
           Close Report & Vault
         </button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-10">
         <div className="relative">
            <div className="w-48 h-48 bg-blue-100 rounded-full animate-ping opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Brain size={80} className="text-indigo-600 animate-pulse" />
                <div className="absolute -top-2 -right-2"><Sparkles className="text-amber-400 animate-bounce" /></div>
              </div>
            </div>
         </div>
         <div className="space-y-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Dr Rishu will explain you things shortly</h3>
            <div className="flex items-center justify-center gap-2">
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0s]"></div>
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.1s]"></div>
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] max-w-xs mx-auto">Clinical Intelligence Active</p>
         </div>
      </div>
    );
  }

  if (isStarted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24">
         <div className="flex items-center justify-between px-4">
            <button 
              onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
              className="p-4 bg-white rounded-2xl border text-gray-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] block mb-1">{ALL_QUESTIONS[currentStep].section}</span>
               <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Signal {currentStep + 1} / {ALL_QUESTIONS.length}</span>
               </div>
            </div>
            <div className="w-14"></div>
         </div>

         <div className="px-4">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                 style={{ width: `${progress}%` }}
               />
            </div>
         </div>

         <div className="bg-white rounded-[4rem] p-12 border shadow-2xl space-y-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500"></div>
            
            <h3 className="text-4xl font-black text-gray-800 leading-[1.1] tracking-tighter relative z-10 italic">
              {ALL_QUESTIONS[currentStep].text}
            </h3>

            <div className="grid grid-cols-1 gap-4 relative z-10">
               {OPTIONS.map((opt, i) => (
                 <button 
                    key={i}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full p-8 rounded-[2.5rem] border-4 transition-all flex items-center justify-between group/opt ${
                      answers[currentStep] === opt.value 
                      ? 'bg-indigo-700 border-indigo-100 text-white shadow-2xl scale-[1.03] translate-y-[-4px]' 
                      : 'bg-gray-50/50 border-transparent hover:border-indigo-100 hover:bg-white text-gray-700'
                    }`}
                 >
                    <div className="flex items-center gap-6">
                       <span className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg transition-all ${
                         answers[currentStep] === opt.value ? 'bg-white/20 scale-110' : 'bg-white text-indigo-600 group-hover/opt:scale-110'
                       }`}>
                         {i + 1}
                       </span>
                       <div className="text-left">
                         <p className="font-black text-xl leading-none tracking-tight">{opt.label}</p>
                         <p className={`text-[10px] uppercase font-black tracking-[0.2em] mt-2 ${answers[currentStep] === opt.value ? 'text-indigo-100' : 'text-gray-400'}`}>
                           Intensity: {opt.hint}
                         </p>
                       </div>
                    </div>
                    {answers[currentStep] === opt.value && <CheckCircle2 size={24} className="text-white" />}
                 </button>
               ))}
            </div>
         </div>

         {currentStep === ALL_QUESTIONS.length - 1 && answers[currentStep] !== -1 && (
           <button 
            onClick={calculateFinalResults}
            className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em]"
           >
             Initialize Final Report
           </button>
         )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
         <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-100">
            <Brain size={32} />
         </div>
         <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Neuro-Wellness Audit</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Advanced Clinical Assessment</p>
         </div>
      </div>

      <div className="bg-white rounded-[4rem] p-12 border shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Fingerprint size={120} className="text-indigo-600" />
         </div>
         <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
         
         <div className="relative z-10 space-y-8">
            <div className="space-y-4">
               <h3 className="text-5xl font-black text-gray-800 leading-[0.95] tracking-tighter uppercase italic">
                  Dr Rishu will dive into your brain now.
               </h3>
               <p className="text-base text-gray-500 font-medium leading-relaxed max-w-xl">
                  Initiate a comprehensive clinical journey screening for Depression, Anxiety, and PTSD markers. We correlate results with your biometric baseline for a high-fidelity diagnostic summary.
               </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
               <FeatureBadge icon={<Dna size={16} />} text="DNA Markers" />
               <FeatureBadge icon={<ShieldCheck size={16} />} text="Secure Analysis" />
               <FeatureBadge icon={<Zap size={16} />} text="Real-time Synth" />
            </div>

            <button 
              onClick={() => setIsStarted(true)}
              className="w-full py-7 bg-indigo-700 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-6 hover:bg-indigo-800 hover:shadow-[0_20px_50px_-10px_rgba(67,56,202,0.4)] transition-all hover:translate-y-[-6px] shadow-xl group/btn"
            >
              Begin Clinical Scan <ChevronRight size={28} className="group-hover/btn:translate-x-2 transition-transform" />
            </button>
         </div>
      </div>

      <div className="p-8 bg-[#0f172a] rounded-[3rem] border border-white/5 flex gap-6 items-center shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-full bg-indigo-500/10 blur-2xl"></div>
         <AlertTriangle className="text-amber-400 shrink-0" size={32} />
         <div className="space-y-1">
            <h4 className="font-black text-[10px] text-white/50 uppercase tracking-[0.4em]">Professional Disclaimer</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed font-bold">
               Standardized clinical indices applied. AI results are for guidance only and do not replace professional medical intervention.
            </p>
         </div>
      </div>
    </div>
  );
};

const FeatureBadge = ({ icon, text }: any) => (
  <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
     <div className="text-indigo-500">{icon}</div>
     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{text}</span>
  </div>
);

const ResultCard = ({ title, content, icon }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4 hover:shadow-2xl hover:translate-y-[-5px] transition-all group">
     <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-[1.2rem] group-hover:bg-blue-50 transition-colors shadow-inner">{icon}</div>
        <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 group-hover:text-blue-500 transition-colors">{title}</h4>
     </div>
     <p className="text-sm font-bold text-gray-700 leading-relaxed">{content}</p>
  </div>
);

export default WellnessAssessments;
