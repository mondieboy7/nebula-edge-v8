
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
  userName?: string;
  isCreator?: boolean;
  memoryCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, currentId, onSelect, onNewChat, isOpen, toggleOpen, userName, isCreator, memoryCount = 0 }) => {
  const shadowSessions = sessions.filter(s => s.isShadow);
  const normalSessions = sessions.filter(s => !s.isShadow);

  return (
    <aside className={`${isOpen ? 'w-72' : 'w-0'} bg-[#131315] border-r border-slate-800 flex flex-col transition-all duration-300 overflow-hidden relative z-30`}>
      <div className="p-4 border-b border-slate-800">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors group"
        >
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">New Expedition</span>
          <svg className="w-5 h-5 text-slate-400 group-hover:text-nebula-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isCreator && shadowSessions.length > 0 && (
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Shadow Archive</h2>
            </div>
            {shadowSessions.map(session => (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all truncate group ${
                  currentId === session.id 
                    ? 'bg-red-950/30 text-red-400 border border-red-500/20' 
                    : 'text-slate-600 hover:bg-red-500/5 hover:text-red-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className={`w-4 h-4 flex-shrink-0 ${currentId === session.id ? 'text-red-500' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">{session.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h2 className="px-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Past Intelligence</h2>
          {normalSessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className={`w-full text-left p-3 rounded-xl transition-all truncate group ${
                currentId === session.id 
                  ? 'bg-slate-800 text-nebula-cyan shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 flex-shrink-0 ${currentId === session.id ? 'text-nebula-cyan' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <span className="text-xs font-bold truncate">{session.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 mt-auto border-t border-slate-800 space-y-6">
        {/* Memory Core Display */}
        <div className="px-3 py-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">Neural Memory Core</span>
           </div>
           <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight">
             {memoryCount > 0 ? `${memoryCount} Persistent Synapses Active` : 'Learning user patterns...'}
           </p>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-10 h-10 rounded-xl nebula-gradient flex items-center justify-center text-xs font-black text-white shadow-lg">N</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[120px]">{userName || 'Traveler'}</span>
            <span className="text-[8px] text-nebula-cyan uppercase font-black tracking-widest">{isCreator ? 'Sovereign Core' : 'G3-Elite Core'}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-1">Architect</p>
          <p className="text-[11px] font-black nebula-text-gradient uppercase tracking-widest">Kingston Mondie</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
