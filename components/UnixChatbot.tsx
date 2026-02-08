
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Volume2, X, Info, VolumeX, MessageSquare, Activity, ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';
import { unixChatbotResponse, generateVoiceResponse, playAudio, stopAllAudio } from '../services/geminiService';

const ProfessionalPulse = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
     <div className="absolute inset-0 bg-blue-500 rounded-lg animate-pulse opacity-20"></div>
     <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-lg ring-2 ring-white">
        <Activity size={14} className="text-white" />
     </div>
  </div>
);

const UnixChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "MediZen Intelligence System initialized. How can I assist with your clinical operations today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Dragging States
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    if (!isOpen) { stopAllAudio(); setIsPlayingAudio(false); }
  }, [isOpen]);

  // Drag Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setHasMoved(false);
    setRel({
      x: e.pageX - position.x,
      y: e.pageY - position.y
    });
    e.stopPropagation();
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setHasMoved(true);
    setPosition({
      x: e.pageX - rel.x,
      y: e.pageY - rel.y
    });
  }, [isDragging, rel]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  const toggleOpen = () => {
    if (!hasMoved) {
      setIsOpen(!isOpen);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await unixChatbotResponse(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) { console.error(err); }
    setIsTyping(false);
  };

  const handleSpeak = async (text: string) => {
    if (isPlayingAudio) { stopAllAudio(); setIsPlayingAudio(false); return; }
    try {
      setIsPlayingAudio(true);
      const audio = await generateVoiceResponse(text);
      if (audio) await playAudio(audio);
    } catch (err) { console.error(err); }
    setIsPlayingAudio(false);
  };

  return (
    <div 
      className="fixed z-[9999] pointer-events-none" 
      style={{ 
        left: position.x, 
        top: position.y,
        transition: isDragging ? 'none' : 'all 0.1s ease-out'
      }}
    >
      <div 
        onMouseDown={onMouseDown}
        onClick={toggleOpen}
        className={`pointer-events-auto bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-700 text-white flex items-center gap-3 group transition-all hover:bg-slate-800 ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`}
      >
        <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-60 transition-opacity">
           <GripHorizontal size={12} />
           <GripHorizontal size={12} />
        </div>
        <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
           <MessageSquare size={20} />
        </div>
        <div className="hidden md:block text-left mr-2 select-none">
           <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Intelligence Assistant</p>
           <p className="text-[8px] font-medium text-slate-400 mt-1 uppercase tracking-widest">MZ-1 Core Online</p>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </div>

      {isOpen && (
        <div 
          className={`pointer-events-auto absolute bottom-0 right-full mr-4 w-[350px] md:w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300 ${isDragging ? 'opacity-40' : 'opacity-100'}`}
          style={{ height: '500px' }}
        >
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
               <ProfessionalPulse />
               <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest">MZ-1 Intelligence</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Support Protocol</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 scrollbar-hide">
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] p-4 rounded-xl text-xs font-medium shadow-sm border ${
                   m.role === 'user' 
                   ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                   : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
                 }`}>
                   <p className="leading-relaxed">{m.text}</p>
                   {m.role === 'assistant' && (
                     <button 
                       onClick={() => handleSpeak(m.text)} 
                       className={`mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${isPlayingAudio ? 'text-rose-600' : 'text-blue-600 hover:text-blue-800'}`}
                     >
                       {isPlayingAudio ? <VolumeX size={12} /> : <Volume2 size={12} />} {isPlayingAudio ? 'Interrupt' : 'Playback'}
                     </button>
                   )}
                 </div>
               </div>
             ))}
             {isTyping && (
                <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl w-20">
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
             )}
          </div>

          <div className="p-4 bg-white border-t shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 border focus-within:ring-2 focus-within:ring-blue-100 transition-all">
               <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Inquire about system operations..."
                  className="flex-1 bg-transparent border-none outline-none text-xs font-medium px-2 py-1.5 text-slate-900"
               />
               <button onClick={handleSend} disabled={!input.trim()} className="bg-slate-900 text-white p-2.5 rounded-lg hover:bg-black disabled:opacity-20 transition-all"><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnixChatbot;
