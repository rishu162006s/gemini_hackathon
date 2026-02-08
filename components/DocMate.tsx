
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Search, Navigation, ExternalLink, Loader2, 
  Stethoscope, Heart, Eye, Baby, Activity, Info, 
  Sparkles, CheckCircle, ArrowRight, User, Upload, Camera, FileSearch, ShieldCheck,
  AlertCircle, Calendar, Clock, X, ChevronDown
} from 'lucide-react';
import { HealthReport, UserProfile, Appointment } from '../types';
import { findNearbyClinics, analyzeHealthReport } from '../services/geminiService';

interface Props {
  user: UserProfile;
  latestReport?: HealthReport;
  onBookAppointment: (appt: Appointment) => void;
}

const SPECIALTIES = [
  { id: 'General Physician', label: 'General', icon: <User size={18} />, color: 'bg-blue-50 text-blue-600' },
  { id: 'Cardiologist', label: 'Heart', icon: <Heart size={18} />, color: 'bg-rose-50 text-rose-600' },
  { id: 'Dermatologist', label: 'Skin', icon: <Sparkles size={18} />, color: 'bg-purple-50 text-purple-600' },
  { id: 'Neurologist', label: 'Brain', icon: <Activity size={18} />, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'Pediatrician', label: 'Child', icon: <Baby size={18} />, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'Ophthalmologist', label: 'Eye', icon: <Eye size={18} />, color: 'bg-cyan-50 text-cyan-600' },
  { id: 'Orthopedic', label: 'Bone', icon: <Activity size={18} />, color: 'bg-orange-50 text-orange-600' },
];

const BookingModal = ({ clinicName, specialty, onClose, onConfirm }: any) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleConfirm = () => {
    if (!date || !time) return;
    onConfirm({
      id: 'appt_' + Date.now(),
      clinicName,
      specialty,
      date,
      time,
      status: 'Scheduled'
    });
    setStep('success');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
        {step === 'form' ? (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Book Visit</h3>
               <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-inner">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Target Facility</p>
               <h4 className="font-black text-blue-900 text-lg leading-tight">{clinicName}</h4>
               <span className="text-xs font-bold text-blue-600 uppercase mt-2 inline-block bg-white px-3 py-1 rounded-lg border shadow-sm">{specialty}</span>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                     <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm text-black shadow-inner" 
                     />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Time</label>
                  <div className="relative">
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                     <select 
                        value={time} 
                        onChange={e => setTime(e.target.value)} 
                        className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm text-black appearance-none shadow-inner"
                     >
                        <option value="" className="text-gray-400">Select a slot</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:30 PM">04:30 PM</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleConfirm}
              disabled={!date || !time}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30"
            >
              Confirm Booking
            </button>
          </div>
        ) : (
          <div className="p-10 text-center space-y-6">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50">
               <ShieldCheck size={48} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-gray-800 uppercase italic">Scheduled!</h3>
                <p className="text-gray-500 font-medium mt-2">Your visit to {clinicName} is confirmed for {date} at {time}.</p>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 inline-block">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">+50 Medi Points Earned! ✨</span>
             </div>
             <button onClick={onClose} className="w-full py-5 bg-gray-900 text-white rounded-[1.8rem] font-black uppercase tracking-widest hover:bg-black transition-all">Great!</button>
          </div>
        )}
      </div>
    </div>
  );
};

const DocMate: React.FC<Props> = ({ user, latestReport, onBookAppointment }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [isHealthy, setIsHealthy] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [bookingClinic, setBookingClinic] = useState<{name: string, spec: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied", err)
      );
    }
  }, []);

  const handleSearch = async (specialty: string) => {
    setSelectedSpecialty(specialty);
    setIsSearching(true);
    setResults([]);
    setIsHealthy(false);
    
    try {
      const res = await findNearbyClinics(specialty, location?.lat, location?.lng);
      setResults(res.locations);
      setAnalysisText(res.text);
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setResults([]);
    setIsHealthy(false);
    setAnalysisText('');
    setSelectedSpecialty('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const analysis = await analyzeHealthReport(base64, file.type);
          
          if (analysis.specialty === 'Healthy') {
            setIsHealthy(true);
            setAnalysisText(analysis.condition);
            setIsAnalyzing(false);
          } else if (analysis.specialty) {
            setAnalysisText(analysis.condition);
            await handleSearch(analysis.specialty);
            setIsAnalyzing(false);
          } else {
            alert("MediZen AI could not determine the clinical specialty. Please select one manually below.");
            setIsAnalyzing(false);
          }
        } catch (innerErr) {
          console.error(innerErr);
          alert("Error processing the clinical analysis response. Please ensure the file is a clear medical document.");
          setIsAnalyzing(false);
        }
      };
      reader.onerror = () => {
        alert("Failed to read the file. Please try again.");
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try a clearer image or a standard PDF report.");
      setIsAnalyzing(false);
    } finally {
        if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
         <div className="p-4 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-100 ring-4 ring-emerald-50">
           <MapPin size={28} />
         </div>
         <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">DocMate Finder</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Precision Location Services</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-4 border-white/10 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
        >
           <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all pointer-events-none"></div>
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                    <FileSearch size={24} />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest">Report Scanning</h3>
              </div>
              <p className="text-lg font-bold leading-tight">
                Analyze a document to let <span className="underline decoration-blue-300 underline-offset-4 font-black">DocMate AI</span> pinpoint a provider.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase text-blue-200 tracking-widest">
                 <Camera size={14} /> Instant Specialist Mapping
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
           </div>
        </div>

        {latestReport ? (
          <div 
            onClick={() => handleSearch(latestReport.specialty)}
            className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-4 border-white/10 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
          >
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                      <Sparkles size={24} />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest">Automated Pathway</h3>
                </div>
                <p className="text-lg font-bold leading-tight">
                  Continue based on latest findings: <span className="bg-white/20 px-3 py-1 rounded-xl font-black">{latestReport.specialty}</span>
                </p>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-emerald-200 tracking-widest">
                   <CheckCircle size={14} /> Integrated Clinical Vault Sync
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-gray-100/50 border-4 border-dashed border-gray-200 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center text-gray-400 group hover:bg-white hover:border-indigo-100 transition-all cursor-default">
             <Stethoscope className="opacity-20 mb-4 group-hover:scale-110 transition-transform" size={48} />
             <p className="text-sm font-black uppercase tracking-[0.3em]">Vault Inactive</p>
             <p className="text-xs font-bold mt-2 opacity-60">Scan a medical report to activate suggestions</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[4rem] p-10 border shadow-2xl space-y-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">Global Directory</h3>
              <p className="text-xl font-black text-gray-800 mt-1 italic tracking-tight">Manual Specialty Selection</p>
           </div>
           <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest">{location ? 'Proximity Sync Active' : 'Universal Directory'}</span>
              <div className={`w-2 h-2 rounded-full ${location ? 'bg-emerald-500 animate-pulse' : 'bg-blue-300'}`} />
           </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
           {SPECIALTIES.map((spec) => (
             <button 
               key={spec.id}
               onClick={() => handleSearch(spec.id)}
               className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 text-center group ${
                 selectedSpecialty === spec.id ? 'border-emerald-500 bg-emerald-50 shadow-2xl scale-105' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-xl'
               }`}
             >
                <div className={`p-4 rounded-3xl ${spec.color} group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md`}>
                  {spec.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">{spec.label}</span>
             </button>
           ))}
        </div>
      </div>

      {(isSearching || isAnalyzing) && (
        <div className="py-24 text-center space-y-6 animate-in fade-in duration-300">
           <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center text-emerald-600 border-8 border-white shadow-2xl ring-1 ring-emerald-50">
                {isAnalyzing ? <FileSearch className="animate-bounce" size={48} /> : <Navigation className="animate-spin" size={48} />}
              </div>
           </div>
           <div className="space-y-2">
              <p className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">
                {isAnalyzing ? 'Decoding Clinical Data...' : 'DocMate is searching for clinics nearby...'}
              </p>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
                {isAnalyzing ? 'Extracting clinical taxonomy' : `Locating specialists in ${selectedSpecialty || 'Clinical'} care`}
              </p>
           </div>
        </div>
      )}

      {isHealthy && !isAnalyzing && (
        <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700">
          <div className="p-16 bg-emerald-600 rounded-[5rem] text-white shadow-[0_40px_80px_-20px_rgba(5,150,105,0.4)] relative overflow-hidden text-center space-y-6 border-8 border-white/10">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-[100px] pointer-events-none"></div>
             <div className="relative z-10 flex flex-col items-center">
                <div className="p-8 bg-white/20 rounded-[3rem] backdrop-blur-2xl mb-8 shadow-2xl border border-white/20 ring-8 ring-white/5">
                  <ShieldCheck size={72} className="text-white" />
                </div>
                <h3 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Perfect Health Profile</h3>
                <p className="text-xl font-bold leading-relaxed max-w-lg mx-auto mt-6 text-emerald-50 opacity-90">
                   Clinical analysis completed: <span className="bg-white/20 px-3 py-1 rounded-xl font-black">Normal Baseline</span>. 
                   <br/><br/>
                   <span className="text-3xl block font-black border-4 border-white/20 rounded-[2.5rem] py-8 px-12 mt-6 uppercase tracking-widest shadow-2xl bg-white/5">No Medical Intervention Required</span>
                </p>
             </div>
          </div>
        </div>
      )}

      {results.length > 0 && !isSearching && !isAnalyzing && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
           <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] flex items-start gap-6 shadow-sm">
              <div className="p-4 bg-white rounded-2xl shadow-md text-indigo-600 shrink-0 border border-indigo-50">
                <MapPin size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-1">Clinic Directory Results</span>
                <p className="text-lg font-bold text-indigo-900 leading-tight italic">
                  These are medical professionals and clinics near you for {selectedSpecialty || 'Clinical Care'}:
                </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((loc, i) => (
                <div 
                  key={i} 
                  className="bg-white p-8 rounded-[3.5rem] border-2 border-transparent hover:border-emerald-200 hover:shadow-2xl transition-all flex flex-col gap-8 group/loc"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-700 font-black text-2xl group-hover/loc:bg-emerald-600 group-hover/loc:text-white transition-all shadow-inner shrink-0 ring-1 ring-gray-100">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-black text-gray-800 text-lg leading-tight group-hover/loc:text-emerald-700 transition-colors tracking-tight">{loc.title}</h4>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                         <MapPin size={12} /> Proximity Verified
                       </p>
                    </div>
                    <a href={loc.uri} target="_blank" rel="noopener noreferrer" className="p-5 bg-gray-50 rounded-[2rem] text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all border border-gray-100 shadow-sm">
                      <ExternalLink size={24} />
                    </a>
                  </div>
                  <button 
                    onClick={() => setBookingClinic({ name: loc.title, spec: selectedSpecialty || 'General' })}
                    className="w-full py-6 bg-gray-900 text-white rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-emerald-600 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl shadow-gray-100"
                  >
                    <Calendar size={18} /> Reserve Priority Visit
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {bookingClinic && (
        <BookingModal 
          clinicName={bookingClinic.name} 
          specialty={bookingClinic.spec} 
          onClose={() => setBookingClinic(null)}
          onConfirm={(appt: Appointment) => onBookAppointment(appt)}
        />
      )}
    </div>
  );
};

export default DocMate;
