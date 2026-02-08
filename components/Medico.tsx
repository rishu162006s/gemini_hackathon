
import React, { useState, useRef } from 'react';
import { 
  Search, Pill, Info, ShoppingCart, Loader2, 
  CheckCircle, AlertTriangle, ShieldCheck, ArrowRight,
  Package, Truck, Trash2, CreditCard, ShoppingBag, Activity, X, Camera, FileSearch,
  Upload, FileText, ClipboardList, ScanLine
} from 'lucide-react';
import { Medicine } from '../types';
import { identifyMedicine, suggestMedicines, analyzeMedicineImage, extractMedicinesFromReport } from '../services/geminiService';

const Medico: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'identify' | 'reports' | 'marketplace'>('identify');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results States
  const [identifiedMed, setIdentifiedMed] = useState<Partial<Medicine> | null>(null);
  const [reportMeds, setReportMeds] = useState<Medicine[]>([]);
  const [marketResults, setMarketResults] = useState<Medicine[]>([]);
  
  // Cart State
  const [cart, setCart] = useState<Medicine[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetResults = () => {
    setIdentifiedMed(null);
    setReportMeds([]);
    setMarketResults([]);
    setSearchQuery('');
    setError(null);
  };

  const handleTabChange = (tab: 'identify' | 'reports' | 'marketplace') => {
    setActiveTab(tab);
    resetResults();
  };

  // Option 1: Product Identification
  const processIdentification = async (file?: File) => {
    setIsProcessing(true);
    setIdentifiedMed(null);
    setError(null);
    try {
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeMedicineImage(base64, file.type);
          if (result && result.name) setIdentifiedMed(result);
          else setError("Unable to identify product from image.");
        };
        reader.readAsDataURL(file);
      } else if (searchQuery.trim()) {
        const info = await identifyMedicine(searchQuery);
        if (info && info.name) setIdentifiedMed(info);
        else setError("Product not found in clinical database.");
      }
    } catch (err) { 
      console.error(err);
      setError("Clinical database query failed.");
    }
    setIsProcessing(false);
  };

  // Option 2: Report Analysis
  const processReportAnalysis = async (file: File) => {
    setIsProcessing(true);
    setReportMeds([]);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const meds = await extractMedicinesFromReport(base64, file.type);
        if (meds.length > 0) setReportMeds(meds);
        else setError("No pharmaceutical agents detected in report.");
      };
      reader.readAsDataURL(file);
    } catch (err) { 
      console.error(err);
      setError("Report extraction failed.");
    }
    setIsProcessing(false);
  };

  // Option 3: Marketplace Fulfillment
  const processMarketSearch = async (file?: File) => {
    setIsProcessing(true);
    setMarketResults([]);
    setError(null);
    try {
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const meds = await extractMedicinesFromReport(base64, file.type);
          if (meds.length > 0) setMarketResults(meds.map(m => ({ ...m, price: m.price || 299 })));
          else setError("No buyable products identified.");
        };
        reader.readAsDataURL(file);
      } else if (searchQuery.trim()) {
        const results = await suggestMedicines(searchQuery);
        if (results.length > 0) setMarketResults(results);
        else setError("No products match your search.");
      }
    } catch (err) { 
      console.error(err);
      setError("Marketplace search failed.");
    }
    setIsProcessing(false);
  };

  const addToCart = (med: any) => {
    const fullMed: Medicine = { 
        id: med.id || 'med_' + Date.now(), 
        name: med.name || 'Generic Product', 
        type: med.type || 'Pharmaceutical', 
        uses: med.uses || [], 
        dosage: med.dosage || 'Consult Physician', 
        price: med.price || 199, 
        description: med.description || '' 
    };
    setCart(prev => [...prev, fullMed]);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-slate-900 text-white rounded-lg shadow-lg"><Pill size={24} /></div>
           <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase italic">Pharmacy Logic</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Fulfillment System</p>
           </div>
        </div>
        
        {cart.length > 0 && (
          <button onClick={() => setShowCheckout(true)} className="flex items-center gap-3 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95">
            <ShoppingCart size={16} /> Checkout Fulfillment ({cart.length})
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm gap-2">
        <TabButton active={activeTab === 'identify'} onClick={() => handleTabChange('identify')} icon={<Camera size={16} />} label="Product ID" sub="Identify Molecule" />
        <TabButton active={activeTab === 'reports'} onClick={() => handleTabChange('reports')} icon={<FileText size={16} />} label="Script Scan" sub="Extract From Report" />
        <TabButton active={activeTab === 'marketplace'} onClick={() => handleTabChange('marketplace')} icon={<ShoppingBag size={16} />} label="Marketplace" sub="Order Fulfillment" />
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
            <ScanLine size={18} className="text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {activeTab === 'identify' ? 'Product Nomenclature or Visual Input' : 
                 activeTab === 'reports' ? 'Clinical Document Ingestion' : 
                 'Global Marketplace Search'}
            </h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
           {activeTab !== 'reports' && (
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    placeholder={activeTab === 'identify' ? "Enter brand or chemical name (e.g. Combiflam)..." : "Search for symptoms or medicines..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'identify' ? processIdentification() : processMarketSearch())}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all text-sm font-medium text-black"
                />
             </div>
           )}
           
           <div className="flex gap-2 w-full md:w-auto">
              {activeTab === 'reports' ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                >
                  <Upload size={16} /> Upload Clinical Report
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => activeTab === 'identify' ? processIdentification() : processMarketSearch()}
                    disabled={isProcessing || !searchQuery.trim()}
                    className="flex-1 md:flex-none px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20 shadow-lg"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Process Query'}
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="p-4 bg-white border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <Camera size={20} />
                  </button>
                </>
              )}
           </div>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (activeTab === 'identify') processIdentification(file);
                else if (activeTab === 'reports') processReportAnalysis(file);
                else processMarketSearch(file);
             }} 
             className="hidden" 
             accept="image/*,application/pdf" 
           />
        </div>
      </div>

      {/* Error Feedback */}
      {error && !isProcessing && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-4">
           <AlertTriangle size={24} />
           <div>
              <p className="font-black text-xs uppercase tracking-widest">System Error</p>
              <p className="text-sm font-bold opacity-80">{error}</p>
           </div>
        </div>
      )}

      {/* Results Workspace */}
      <div className="min-h-[400px]">
        {isProcessing && (
           <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Consulting Clinical Database...</p>
           </div>
        )}

        {/* Identification Result */}
        {activeTab === 'identify' && identifiedMed && identifiedMed.name && !isProcessing && (
          <div className="bg-white rounded-[3rem] border-2 border-blue-50 p-12 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Pill size={200} />
             </div>
             
             <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b pb-10 mb-10 border-slate-50 relative z-10">
                <div className="flex gap-8 items-center">
                   <div className="p-6 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-100 ring-8 ring-blue-50">
                      <Pill size={40} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-1">Identified Molecule</p>
                      <h3 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">{identifiedMed.name}</h3>
                      <div className="flex items-center gap-3 mt-4">
                         <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">Class: {identifiedMed.type}</span>
                         <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100">Market Ready</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-3 text-slate-400">
                      <Activity size={18} />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Therapeutic Indications</h4>
                   </div>
                   <div className="space-y-3">
                      {identifiedMed.uses?.map((u, i) => (
                        <div key={i} className="flex items-center gap-5 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-xl transition-all">
                           <CheckCircle size={18} className="text-emerald-500 shrink-0" /> {u}
                        </div>
                      ))}
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="flex items-center gap-3 text-rose-500">
                      <ShieldCheck size={18} />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Clinical Protocol</h4>
                   </div>
                   <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 shadow-inner space-y-6">
                      <p className="text-lg font-black text-rose-900 italic leading-relaxed">"{identifiedMed.dosage}"</p>
                      <div className="p-5 bg-white/50 rounded-2xl border border-rose-100 flex items-start gap-4">
                         <AlertTriangle size={20} className="text-rose-500 shrink-0" />
                         <p className="text-[10px] font-black text-rose-800 leading-relaxed uppercase tracking-widest">
                            Pharmaceutical profile for information only. Verify with healthcare practitioners prior to administration.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="mt-12 pt-10 border-t border-slate-50 flex justify-end">
                <button onClick={() => addToCart(identifiedMed)} className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-4 hover:translate-y-[-4px]">
                    <ShoppingBag size={20} /> Acquire Fulfillment Pack
                </button>
             </div>
          </div>
        )}

        {/* List Views */}
        {activeTab === 'reports' && reportMeds.length > 0 && !isProcessing && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
             <div className="flex items-center justify-between px-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Extracted Clinical Script</h4>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">{reportMeds.length} Items Found</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportMeds.map(med => (
                   <MedCard key={med.id || Math.random()} med={med} onAdd={() => addToCart(med)} actionLabel="Order Molecule" />
                ))}
             </div>
          </div>
        )}

        {activeTab === 'marketplace' && marketResults.length > 0 && !isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500">
             {marketResults.map(med => (
               <MedCard key={med.id || Math.random()} med={med} onAdd={() => addToCart(med)} actionLabel="Fulfill Order" showPrice />
             ))}
          </div>
        )}

        {!isProcessing && !error && !identifiedMed && reportMeds.length === 0 && marketResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300 space-y-6">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
                {activeTab === 'identify' ? <Camera size={40} /> : activeTab === 'reports' ? <FileText size={40} /> : <Search size={40} />}
             </div>
             <div className="text-center space-y-1">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Awaiting Ingestion</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Select a clinical modality above</p>
             </div>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white/20">
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-center border-b pb-6 border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Order Fulfillment</h3>
                    <button onClick={() => setShowCheckout(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors shadow-inner"><X size={24} /></button>
                 </div>
                 <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 scrollbar-hide">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-sm hover:bg-white transition-all shadow-sm group">
                         <div className="flex items-center gap-5">
                            <div className="p-3 bg-white rounded-xl border text-blue-600 shadow-md group-hover:scale-110 transition-transform"><Package size={20} /></div>
                            <div>
                                <span className="font-black text-slate-800 uppercase text-xs tracking-tight">{item.name}</span>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{item.type}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <span className="font-black text-slate-900 text-base italic">₹{item.price}</span>
                            <button onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="pt-8 border-t border-slate-100 space-y-8">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Settlement Total</span>
                       <span className="text-5xl font-black text-slate-900 tracking-tighter italic">₹{totalPrice.toFixed(0)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-emerald-50 rounded-[1.8rem] border border-emerald-100 flex items-center gap-4">
                          <Truck size={20} className="text-emerald-600" />
                          <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Logistics Ready</span>
                       </div>
                       <div className="p-5 bg-blue-50 rounded-[1.8rem] border border-blue-100 flex items-center gap-4">
                          <ShieldCheck size={20} className="text-blue-600" />
                          <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Clinical Audit OK</span>
                       </div>
                    </div>
                    <button onClick={() => { alert("Logistics Initiated. Tracking ID: MZ-" + Math.random().toString(16).slice(2, 10).toUpperCase()); setCart([]); setShowCheckout(false); }} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(15,23,42,0.4)] hover:bg-black transition-all flex items-center justify-center gap-4">
                       <CreditCard size={20} /> Authorize Settlement
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, sub: string }> = ({ active, onClick, icon, label, sub }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-5 px-4 rounded-[1.5rem] transition-all flex flex-col items-center gap-1 group ${
      active ? 'bg-slate-900 text-white shadow-2xl translate-y-[-2px]' : 'text-slate-400 hover:bg-slate-50'
    }`}
  >
    <div className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon} {label}
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 italic">{sub}</span>
  </button>
);

const MedCard: React.FC<{ med: Medicine, onAdd: () => void, actionLabel: string, showPrice?: boolean }> = ({ med, onAdd, actionLabel, showPrice = true }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all flex flex-col justify-between group h-full relative overflow-hidden">
       <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <Package size={80} />
       </div>
       <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-start">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shadow-inner"><Package size={24} /></div>
             {showPrice && <p className="text-2xl font-black text-slate-900 italic">₹{(med.price || 199).toFixed(0)}</p>}
          </div>
          <div>
             <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter leading-none group-hover:text-blue-600 transition-colors">{med.name}</h4>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">{med.type}</p>
          </div>
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-50 group-hover:bg-white transition-colors">
            <p className="text-[12px] font-bold text-slate-500 leading-relaxed italic line-clamp-3">"{med.dosage}"</p>
          </div>
       </div>
       <button onClick={onAdd} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-lg shadow-slate-100 hover:shadow-blue-200 group-hover:translate-y-[-2px]">
           {actionLabel}
       </button>
    </div>
);

export default Medico;
