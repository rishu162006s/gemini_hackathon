
import React from 'react';
import { UserProfile, AvatarItem } from '../types';
import { AVATAR_ITEMS } from '../constants';
import { Lock, CheckCircle2 } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
}

const AvatarStudio: React.FC<Props> = ({ user, onUpdateUser }) => {
  const handlePurchase = (item: AvatarItem) => {
    if (user.mediPoints >= item.cost) {
      onUpdateUser({
        mediPoints: user.mediPoints - item.cost,
        unlockedItems: [...user.unlockedItems, item.id]
      });
    } else {
      alert('Not enough Medi Points!');
    }
  };

  // Fix: handleEquip now correctly maps AvatarItem types to the specific equipment slots defined in UserProfile
  const handleEquip = (item: AvatarItem) => {
    switch (item.type) {
      case 'base':
        onUpdateUser({ equippedBase: item.id });
        break;
      case 'shirt':
        onUpdateUser({ equippedShirt: item.id });
        break;
      case 'pants':
        onUpdateUser({ equippedPants: item.id });
        break;
      case 'shoes':
        onUpdateUser({ equippedShoes: item.id });
        break;
      case 'pet':
        onUpdateUser({ equippedPet: item.id });
        break;
    }
  };

  // Fix: Find specific equipped items for the preview display based on UserProfile slots
  const currentBase = AVATAR_ITEMS.find(i => i.id === user.equippedBase);
  const currentShirt = AVATAR_ITEMS.find(i => i.id === user.equippedShirt);
  const currentPants = AVATAR_ITEMS.find(i => i.id === user.equippedPants);
  const currentShoes = AVATAR_ITEMS.find(i => i.id === user.equippedShoes);
  const currentPet = AVATAR_ITEMS.find(i => i.id === user.equippedPet);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Avatar Studio</h2>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 font-bold flex items-center gap-2">
           ✨ {user.mediPoints} Points
        </div>
      </div>

      {/* Avatar Preview */}
      <div className="bg-gradient-to-b from-blue-50 to-white rounded-3xl p-10 border shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-4 left-4 text-[10px] font-bold text-blue-300 uppercase tracking-widest">Live Preview</div>
        <div className="w-48 h-48 rounded-full bg-white shadow-inner flex flex-col items-center justify-center relative border-4 border-blue-100">
           {/* Layered Avatar Parts Preview */}
           <div className="text-6xl mb-2">{currentBase?.svg || '👤'}</div>
           <div className="text-4xl absolute -bottom-2">
             {currentShirt?.svg} {currentPants?.svg} {currentShoes?.svg}
           </div>
           {currentPet && <div className="text-4xl absolute -right-6 bottom-4 animate-bounce">{currentPet.svg}</div>}
        </div>
        <div className="mt-8 text-center">
           <h3 className="font-bold text-lg">{user.name}</h3>
           <p className="text-sm text-gray-500">Level {Math.floor(user.mediPoints / 500) + 1} Wellness Explorer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Fix: Replaced invalid 'clothing' literal comparison with a filter for all non-pet wearable items */}
        <Section title="Clothing Shop" items={AVATAR_ITEMS.filter(i => i.type !== 'pet')} user={user} onEquip={handleEquip} onPurchase={handlePurchase} />
        <Section title="Pet Companions" items={AVATAR_ITEMS.filter(i => i.type === 'pet')} user={user} onEquip={handleEquip} onPurchase={handlePurchase} />
      </div>
    </div>
  );
};

const Section = ({ title, items, user, onEquip, onPurchase }: any) => (
  <div className="space-y-4">
    <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider px-1">{title}</h3>
    <div className="grid grid-cols-2 gap-3">
      {items.map((item: AvatarItem) => {
        const isUnlocked = user.unlockedItems.includes(item.id);
        // Fix: isEquipped now checks all possible equipment slots in UserProfile to identify if an item is in use
        const isEquipped = [
          user.equippedBase,
          user.equippedShirt,
          user.equippedPants,
          user.equippedShoes,
          user.equippedPet
        ].includes(item.id);
        
        return (
          <div key={item.id} className={`bg-white p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
            isEquipped ? 'border-emerald-500 ring-2 ring-emerald-50 shadow-md' : 'border-gray-100 hover:border-blue-200'
          }`}>
             <span className="text-3xl p-2 bg-gray-50 rounded-xl">{item.svg}</span>
             <div className="text-center">
               <p className="text-xs font-bold text-gray-800">{item.name}</p>
               {!isUnlocked && <p className="text-[10px] font-bold text-blue-600">✨ {item.cost}</p>}
             </div>
             
             {isUnlocked ? (
               <button 
                onClick={() => onEquip(item)}
                className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  isEquipped ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
               >
                 {isEquipped ? 'Equipped' : 'Equip'}
               </button>
             ) : (
               <button 
                onClick={() => onPurchase(item)}
                disabled={user.mediPoints < item.cost}
                className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-gray-600"
               >
                 <Lock size={10} /> Unlock
               </button>
             )}
          </div>
        );
      })}
    </div>
  </div>
);

export default AvatarStudio;
