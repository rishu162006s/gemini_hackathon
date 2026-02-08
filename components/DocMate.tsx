import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Navigation, 
  ShieldCheck, Loader2, 
  ExternalLink, Info, Stethoscope, Sparkles, FileText, ChevronRight,
  Upload, CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import { UserProfile, HealthReport, Appointment } from '../types';
import { findNearbyClinics, analyzeHealthReport } from '../services/geminiService';

interface Props {
  user: UserProfile;
  latestReport?: HealthReport;
  onBookAppointment: (appt: Appointment) => void;
}

const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Dermatologist', 
  'Neurologist', 'Pediatrician', 'Orthopedic Surgeon',
  'Psychiatrist', 'Gastroenterologist', 'Ophthalmologist'
];

const DocMate: React.FC<Props> = ({ user, latestReport, onBookAppointment }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [scanFinding, setScanFinding] = useState<{ summary: string, specialty: string } | null>(null);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      }, (err) => {
        console.warn("Geolocation permission denied:", err);
      });
    }
  }, []);

  const handleSearch = async (specialty: string, skipFindingReset = false) => {
    if (!skipFindingReset) setScanFinding(null);
    setSelectedSpecialty(specialty);
    setIsSearching(true);
    setResults([]);
    
    try {
      const res = await findNearbyClinics(specialty, location?.latitude, location?.longitude);
      setResults(res.locations);
      setAnalysisText(res.text);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to locate providers.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setResults([]);
    setScanFinding(null);
    setSelectedSpecialty('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeHealthReport(base64, file.type);
        
        setScanFinding({
          summary: analysis.summary,
          specialty: analysis.specialty
        });

        // Automatically trigger search for the suggested specialty
        handleSearch(analysis.specialty, true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Report analysis failed. Please try manual selection.");
      setIsScanning(false);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBook = (item: any) => {
    const newAppt: Appointment = {
      id: 'appt_' + Date.now(),
      clinicName: item.title,
      specialty: selectedSpecialty,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:00 AM',
      status: 'Scheduled'
    };
    onBookAppointment(newAppt);
    alert(`Appointment scheduled at ${item.title} for tomorrow at 10:00 AM.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-2xl ring-4 ring-indigo-50">
            <MapPin size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Clinical Network</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Smart Locator via Google Grounding</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-2xl shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-widest">
           <div className={`w-2 h-2 rounded-full ${location ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
           GPS: {location ? 'Fixed' : 'Acquiring...'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Options */}
        <div className="lg:col-span-1 space-y-6">
           {/* Report Scan Card */}
           <div className="bg-white rounded-[3rem] p-8 border shadow-xl space-y-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                 <FileText size={150} />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                 <Sparkles className="text-emerald-500" size={20} />
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Clinical Analysis Sync</h3>
              </div>
              <p className="text-sm font-bold text-gray-600 leading-relaxed relative z-10">
                 Upload a report to automatically detect the required specialty and find matching doctors.
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning || isSearching}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 relative z-10"
              >
                {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                {isScanning ? 'Scanning...' : 'Scan Report & Find'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
           </div>

           {/* Specialty Picker Card */}
           <div className="bg-white rounded-[3rem] p-8 border shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <Stethoscope className="text-indigo-400" size={18} />
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Manual Specialty Scan</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                 {SPECIALTIES.map(s => (
                   <button
                     key={s}
                     onClick={() => handleSearch(s)}
                     disabled={isSearching || isScanning}
                     className={`w-full px-5 py-3.5 rounded-xl border-2 transition-all font-bold text-[11px] uppercase tracking-wider text-left flex items-center justify-between group ${
                       selectedSpecialty === s 
                       ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                       : 'bg-white border-gray-50 text-gray-500 hover:border-indigo-100 hover:bg-indigo-50/30'
                     }`}
                   >
                     {s}
                     <ChevronRight size={14} className={selectedSpecialty === s ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} />
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Results Area */}
        <div className="lg:col-span-2">
           {isScanning || isSearching ? (
             <div className="bg-white rounded-[4rem] border border-dashed h-full flex flex-col items-center justify-center py-32 space-y-8">
                <div className="relative">
                   <div className="w-24 h-24 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-indigo-600" size={48} />
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <p className="text-xs font-black text-gray-800 uppercase tracking-[0.4em]">
                      {isScanning ? 'Dr. Rishu is Analyzing Document...' : 'Syncing Regional Clinical Data...'}
                   </p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by Google Grounding Tech</p>
                </div>
             </div>
           ) : results.length > 0 ? (
             <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                {/* AI Routing Context */}
                {scanFinding && (
                  <div className="p-10 bg-indigo-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-white/5">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-500 rounded-lg shadow-lg"><CheckCircle size={16} /></div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Diagnosis-Based Routing Active</span>
                        </div>
                        <div className="space-y-4">
                           <p className="text-xl font-medium leading-relaxed italic text-indigo-50">
                              "{scanFinding.summary}"
                           </p>
                           <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                              <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 Recommended: <span className="text-emerald-400">{scanFinding.specialty}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-4">
                   <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Nearby Specialists</h3>
                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 uppercase">{results.length} Providers Found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {results.map((loc, i) => (
                     <div key={i} className="bg-white p-8 rounded-[3rem] border shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between h-full">
                        <div className="space-y-6">
                           <div className="flex items-start justify-between">
                              <div className="p-4 bg-gray-50 rounded-2xl border group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                 <Navigation size={24} />
                              </div>
                              <a href={loc.uri} target="_blank" rel="noopener noreferrer" className="p-3 text-gray-400 hover:text-indigo-600 transition-colors">
                                 <ExternalLink size={20} />
                              </a>
                           </div>
                           <div>
                              <h4 className="text-xl font-black text-gray-800 line-clamp-2 leading-tight uppercase italic group-hover:text-indigo-600 transition-colors">{loc.title}</h4>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{selectedSpecialty}</p>
                           </div>
                        </div>
                        
                        <div className="mt-10 pt-8 border-t border-gray-50 flex gap-3">
                           <button onClick={() => handleBook(loc)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-100">
                              Book
                           </button>
                           <a href={loc.uri} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-indigo-100 transition-all border border-indigo-100">
                              View Map
                           </a>
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white/50 flex items-start gap-4">
                   <ShieldCheck size={20} className="text-indigo-400 mt-1 shrink-0" />
                   <p className="text-xs font-medium italic leading-relaxed">
                      {analysisText}
                   </p>
                </div>
             </div>
           ) : (
             <div className="h-full bg-indigo-50/30 rounded-[4rem] border border-indigo-100/50 flex flex-col items-center justify-center p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-indigo-600">
                   <Search size={48} className="opacity-20" />
                </div>
                <div className="space-y-4 max-w-sm">
                   <h4 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">Regional Provider Scan Offline</h4>
                   <p className="text-xs font-bold text-gray-400 leading-relaxed">
                      Select a specialty from the directory or upload a medical report for AI-powered clinical routing.
                   </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                   <div className="px-4 py-2 bg-white rounded-xl border text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Live GPS Tracking
                   </div>
                   <div className="px-4 py-2 bg-white rounded-xl border text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={12} /> AI Specialty Routing
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default DocMate;
