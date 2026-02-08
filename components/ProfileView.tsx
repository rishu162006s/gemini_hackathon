import React, { useState, useEffect } from 'react';
import { UserProfile, HealthReport, AvatarItem, AvatarCategory } from '../types';
import { AVATAR_ITEMS } from '../constants';
import { Save, Edit3, Sparkles, ShoppingBag, UserCircle, Lock, CheckCircle, Wand2, Info, BadgeCheck, Type as TypeIcon, User, Smile } from 'lucide-react';
import { extractMetricsFromReport } from '../services/geminiService';

interface Props {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  latestReport?: HealthReport;
}

const ProfileView: React.FC<Props> = ({ user, onUpdate, latestReport }) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'metrics' | 'shop'>('avatar');
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formData, setFormData] = useState(user);
  const [shopCategory, setShopCategory] = useState<AvatarCategory>('base');

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleSaveMetrics = () => {
    onUpdate(formData);
    setIsEditingMetrics(false);
  };

  const handleRenameCharacter = (newName: string) => {
    const updated = { ...formData, characterName: newName };
    setFormData(updated);
    onUpdate({ characterName: newName });
  };

  const handleSmartExtract = async () => {
    if (!latestReport) {
      alert("No medical reports found to extract data from.");
      return;
    }
    setIsExtracting(true);
    try {
      // Fix: Use analysis.summary instead of analysis.condition to match HealthReport type
      const metrics = await extractMetricsFromReport(latestReport.analysis.summary);
      setFormData({ ...formData, ...metrics });
      onUpdate(metrics);
      alert("Health metrics successfully extracted from your latest report!");
    } catch (err) {
      console.error(err);
      alert("Failed to extract metrics. Try manual entry.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePurchase = (item: AvatarItem) => {
    if (user.mediPoints >= item.cost) {
      onUpdate({
        mediPoints: user.mediPoints - item.cost,
        unlockedItems: [...user.unlockedItems, item.id]
      });
    } else {
      alert("Insufficient Medi Points! Complete more check-ins.");
    }
  };

  const handleEquip = (item: AvatarItem) => {
    switch (item.type) {
      case 'base': onUpdate({ equippedBase: item.id }); break;
      case 'face': onUpdate({ equippedFace: item.id }); break;
      case 'shirt': onUpdate({ equippedShirt: item.id }); break;
      case 'pants': onUpdate({ equippedPants: item.id }); break;
      case 'shoes': onUpdate({ equippedShoes: item.id }); break;
      case 'pet': onUpdate({ equippedPet: item.id }); break;
    }
  };

  const currentItems = {
    base: AVATAR_ITEMS.find(i => i.id === user.equippedBase),
    face: AVATAR_ITEMS.find(i => i.id === user.equippedFace),
    shirt: AVATAR_ITEMS.find(i => i.id === user.equippedShirt),
    pants: AVATAR_ITEMS.find(i => i.id === user.equippedPants),
    shoes: AVATAR_ITEMS.find(i => i.id === user.equippedShoes),
    pet: AVATAR_ITEMS.find(i => i.id === user.equippedPet),
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Refined Character Preview Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-600 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border-4 border-white/10">
        <style>{`
          @keyframes character-breathe {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-5px) scale(1.01); }
          }
          @keyframes float-companion {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.2); }
          }
          .animate-breathe { animation: character-breathe 4s ease-in-out infinite; }
          .animate-glow { animation: glow-pulse 6s ease-in-out infinite; }
        `}</style>

        {/* Cinematic Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/20 rounded-full blur-[120px] animate-glow pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Proportional Assembly Viewport */}
          <div className="w-72 h-80 relative flex items-center justify-center">
             
             {/* Character Composite */}
             <div className="relative w-full h-full flex items-center justify-center animate-breathe group-hover:scale-105 transition-transform duration-1000">
                
                {/* Silhouette / Guide Layer */}
                <div className="text-[14rem] absolute z-10 select-none opacity-20 group-hover:opacity-30 transition-opacity">
                  {currentItems.base?.svg}
                </div>

                {/* Pants Layer - Positioned over legs area */}
                {currentItems.pants && (
                  <div className="text-[8.5rem] absolute z-20 top-[42%] select-none drop-shadow-2xl">
                    {currentItems.pants.svg}
                  </div>
                )}

                {/* Shirt Layer - Layered over torso */}
                {currentItems.shirt && (
                  <div className="text-[9.2rem] absolute z-30 top-[18%] select-none drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] scale-x-105">
                    {currentItems.shirt.svg}
                  </div>
                )}

                {/* Face Layer - The soul of the character at the top */}
                {currentItems.face && (
                  <div className="text-[7.2rem] absolute z-50 top-[-2%] select-none drop-shadow-lg">
                    {currentItems.face.svg}
                  </div>
                )}

                {/* Shoes Layer - Grounded at the bottom */}
                {currentItems.shoes && (
                  <div className="text-[4.2rem] absolute z-40 bottom-[-2%] select-none drop-shadow-md">
                    {currentItems.shoes.svg}
                  </div>
                )}

                {/* Pet Companion - Floating in proximity */}
                {currentItems.pet && (
                  <div className="text-[5.5rem] absolute z-[60] -right-20 bottom-16 select-none animate-[float-companion_3s_ease-in-out_infinite]">
                    {currentItems.pet.svg}
                  </div>
                )}
             </div>

             {/* Dynamic Ground Shadow */}
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-56 h-12 bg-black/40 rounded-[100%] blur-2xl scale-x-125 opacity-60"></div>
          </div>

          {/* Character Stats Info */}
          <div className="text-center md:text-left space-y-5 flex-1">
             <div className="space-y-1">
               <div className="flex items-center justify-center md:justify-start gap-4">
                  <h2 className="text-4xl font-black tracking-tighter uppercase drop-shadow-xl">{user.characterName || 'Medi Explorer'}</h2>
                  <div className="bg-emerald-400 p-2 rounded-2xl shadow-xl ring-4 ring-white/10"><BadgeCheck className="text-white" size={24} /></div>
               </div>
               <p className="text-indigo-100 font-black uppercase tracking-[0.5em] text-[10px] opacity-70">Health Persona for {user.name}</p>
             </div>

             <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-2xl px-6 py-4 rounded-[2rem] border border-white/20 flex items-center gap-4 shadow-xl">
                   <div className="p-2 bg-yellow-400/30 rounded-xl text-yellow-300"><Sparkles size={20} /></div>
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Medi Points</span>
                     <span className="font-black text-2xl leading-none">{user.mediPoints}</span>
                   </div>
                </div>
                <div className="bg-white/10 backdrop-blur-2xl px-6 py-4 rounded-[2rem] border border-white/20 flex items-center gap-4 shadow-xl">
                   <div className="p-2 bg-emerald-400/30 rounded-xl text-emerald-300"><CheckCircle size={20} /></div>
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Hot Streak</span>
                     <span className="font-black text-2xl leading-none">{user.streak}🔥</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex bg-white p-2 rounded-[2.5rem] border-2 border-gray-50 shadow-sm gap-2">
        <button 
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'avatar' ? 'bg-indigo-600 text-white shadow-2xl translate-y-[-2px]' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <UserCircle size={18} /> Persona
        </button>
        <button 
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'metrics' ? 'bg-indigo-600 text-white shadow-2xl translate-y-[-2px]' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <Wand2 size={18} /> Bio-Data
        </button>
        <button 
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'shop' ? 'bg-indigo-600 text-white shadow-2xl translate-y-[-2px]' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <ShoppingBag size={18} /> Shop
        </button>
      </div>

      {/* Animated Content Transitions */}
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        {activeTab === 'avatar' && (
          <div className="space-y-6">
            {/* Companion Identity Form */}
            <div className="bg-white rounded-[3rem] p-10 border shadow-sm space-y-10">
               <div className="flex items-center gap-4">
                 <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm"><TypeIcon size={24} /></div>
                 <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Character Rename</h3>
                    <p className="text-base font-bold text-gray-800">Assign a name to your vitality companion.</p>
                 </div>
               </div>
               
               <div className="space-y-4">
                  <div className="relative group">
                    <input 
                      type="text"
                      value={formData.characterName}
                      onChange={(e) => handleRenameCharacter(e.target.value)}
                      placeholder="e.g. LifeGuard..."
                      className="w-full px-10 py-7 bg-gray-50 rounded-[2.5rem] border-4 border-transparent outline-none font-black text-2xl shadow-inner focus:border-indigo-500 focus:ring-12 focus:ring-indigo-50 transition-all text-black placeholder:text-gray-300"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 bg-white px-4 py-2 rounded-2xl uppercase tracking-widest shadow-md border group-focus-within:scale-110 transition-transform">Identity Active</div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border shadow-sm space-y-8">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Current Loadout Summary</h3>
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-3 py-1 rounded-lg uppercase">{Object.values(currentItems).filter(Boolean).length} Active Parts</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
                 {Object.entries(currentItems).map(([type, item]) => (
                   <div key={type} className="p-5 bg-gray-50 rounded-3xl border-2 border-transparent hover:border-indigo-100 flex flex-col items-center gap-3 text-center transition-all hover:bg-white hover:shadow-xl group">
                      <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em]">{type}</span>
                      <span className="text-4xl drop-shadow-md group-hover:scale-125 transition-transform">{item?.svg || '❌'}</span>
                      <span className="text-[10px] font-black text-gray-600 line-clamp-1 uppercase tracking-tight">{item?.name || 'Empty'}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-white rounded-[3rem] p-10 border shadow-sm space-y-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-50 pb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Biometric Profile</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time Clinical Synchronization</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={handleSmartExtract}
                  disabled={isExtracting}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isExtracting ? 'Extracting...' : <><Sparkles size={16} /> AI Sync</>}
                </button>
                <button
                  onClick={() => isEditingMetrics ? handleSaveMetrics() : setIsEditingMetrics(true)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    isEditingMetrics ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {isEditingMetrics ? <><Save size={16} /> Save Changes</> : <><Edit3 size={16} /> Manual Edit</>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProfileInput label="Full Medical Name" value={formData.name} onChange={(v:string) => setFormData({ ...formData, name: v })} disabled={!isEditingMetrics} />
              <ProfileInput label="Age" type="number" value={formData.age} onChange={(v:string) => setFormData({ ...formData, age: Number(v) })} disabled={!isEditingMetrics} />
              <ProfileInput label="Blood Pressure (Systolic/Diastolic)" placeholder="120/80" value={formData.bloodPressure} onChange={(v:string) => setFormData({ ...formData, bloodPressure: v })} disabled={!isEditingMetrics} />
              <ProfileInput label="Glucose (Blood Sugar)" type="number" value={formData.bloodSugar} onChange={(v:string) => setFormData({ ...formData, bloodSugar: Number(v) })} disabled={!isEditingMetrics} suffix="mg/dL" />
              <ProfileInput label="Stress Quotient" type="number" value={formData.stressLevel} onChange={(v:string) => setFormData({ ...formData, stressLevel: Number(v) })} disabled={!isEditingMetrics} suffix="/10" />
              <ProfileInput label="Hemoglobin Concentration" type="number" value={formData.hemoglobin} onChange={(v:string) => setFormData({ ...formData, hemoglobin: Number(v) })} disabled={!isEditingMetrics} suffix="g/dL" />
            </div>

            <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] flex gap-5 items-start border border-indigo-100">
               <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-500"><Info size={24} /></div>
               <div className="space-y-1">
                 <h4 className="font-black text-[11px] uppercase tracking-widest text-indigo-600">Sync Information</h4>
                 <p className="text-xs text-indigo-900/70 leading-relaxed font-medium">
                    AI Sync automatically populates these metrics by analyzing your latest clinical upload. Manual edits are saved locally to your device and used for health visualization trends.
                 </p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="bg-white rounded-[3rem] p-10 border shadow-sm space-y-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-50 pb-8">
               <h3 className="font-black text-xl text-gray-800 uppercase tracking-tighter">Medi Premium Shop</h3>
               <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto max-w-full scrollbar-hide">
                  {(['base', 'face', 'shirt', 'pants', 'shoes', 'pet'] as const).map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setShopCategory(cat)}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        shopCategory === cat ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {AVATAR_ITEMS.filter(i => i.type === shopCategory).map(item => {
                 const isUnlocked = user.unlockedItems.includes(item.id);
                 const isEquipped = [user.equippedBase, user.equippedFace, user.equippedShirt, user.equippedPants, user.equippedShoes, user.equippedPet].includes(item.id);

                 return (
                   <div key={item.id} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-5 relative group ${
                     isEquipped ? 'border-indigo-500 ring-8 ring-indigo-50 shadow-2xl bg-white' : 'border-gray-50 hover:border-indigo-100 bg-gray-50/50 hover:bg-white'
                   }`}>
                      <div className="text-6xl drop-shadow-xl group-hover:scale-125 transition-transform duration-500">{item.svg}</div>
                      <div className="text-center space-y-1">
                        <p className="font-black text-xs text-gray-800 uppercase tracking-tight line-clamp-1">{item.name}</p>
                        {!isUnlocked && <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">✨ {item.cost} PT</p>}
                      </div>

                      {isUnlocked ? (
                        <button 
                          onClick={() => handleEquip(item)}
                          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                            isEquipped ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-900 text-white hover:bg-black hover:scale-105'
                          }`}
                        >
                          {isEquipped ? 'Active' : 'Equip Now'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePurchase(item)}
                          disabled={user.mediPoints < item.cost}
                          className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-50 disabled:hover:text-indigo-600 shadow-md"
                        >
                          <Lock size={14} /> Unlock
                        </button>
                      )}
                   </div>
                 );
               })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileInput = ({ label, value, onChange, type = 'text', disabled, placeholder, suffix }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-[0.2em]">{label}</label>
    <div className="relative group">
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-7 py-5 rounded-[1.8rem] border-2 transition-all outline-none font-black text-base ${
          disabled ? 'bg-gray-50 text-gray-500 border-gray-100 cursor-not-allowed opacity-80' : 'border-indigo-50 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 bg-white text-black shadow-sm group-hover:border-indigo-200'
        }`}
      />
      {suffix && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-500 uppercase bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">{suffix}</span>}
    </div>
  </div>
);

export default ProfileView;